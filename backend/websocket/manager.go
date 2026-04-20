package websocket

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/gorilla/websocket"

	"axion/database"
)

type ConnectionManager struct {
	connections map[string]map[*websocket.Conn]bool
	mu          sync.Mutex
	maxPerUser  int
}

var Manager = &ConnectionManager{
	connections: make(map[string]map[*websocket.Conn]bool),
	maxPerUser:  5,
}

func (m *ConnectionManager) Connect(conn *websocket.Conn, userID string) bool {
	m.mu.Lock()

	if _, exists := m.connections[userID]; exists {
		if len(m.connections[userID]) >= m.maxPerUser {
			m.mu.Unlock()
			conn.Close()
			return false
		}
	}

	if m.connections[userID] == nil {
		m.connections[userID] = make(map[*websocket.Conn]bool)
	}
	m.connections[userID][conn] = true
	m.mu.Unlock()

	database.DB.Exec("UPDATE users SET is_online = true, last_seen = NOW() WHERE id = $1", userID)

	m.notifyFriends(userID, "userOnline")
	m.sendOnlineFriendsToUser(conn, userID)
	m.notifyPending(userID, "pendingOnline")
	m.notifyCommunityMembers(userID, "memberOnline")

	fmt.Println("User connected:", userID)
	return true
}

func (m *ConnectionManager) Disconnect(conn *websocket.Conn, userID string) {
	m.mu.Lock()
	if conns, exists := m.connections[userID]; exists {
		delete(conns, conn)
		if len(conns) == 0 {
			delete(m.connections, userID)
			m.mu.Unlock()

			database.DB.Exec("UPDATE users SET is_online = false, last_seen = NOW() WHERE id = $1", userID)

			m.notifyFriends(userID, "userOffline")
			m.notifyPending(userID, "pendingOffline")
			m.notifyCommunityMembers(userID, "memberOffline")

			fmt.Println("User disconnected:", userID)
			return
		}
	}
	m.mu.Unlock()
}

func (m *ConnectionManager) BroadcastToCommunity(communityID string, payload map[string]any) {
	rows, err := database.DB.Query(`
		SELECT user_id FROM community_members WHERE community_id = $1
	`, communityID)
	if err != nil {
		fmt.Println("BroadcastToCommunity error:", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var userID string
		if err := rows.Scan(&userID); err != nil {
			continue
		}
		m.BroadcastToUser(userID, payload)
	}
}

func (m *ConnectionManager) BroadcastToUser(userID string, message map[string]any) {
	m.mu.Lock()
	conns, exists := m.connections[userID]
	if !exists {
		m.mu.Unlock()
		return
	}

	msgBytes, err := json.Marshal(message)
	if err != nil {
		m.mu.Unlock()
		return
	}

	for conn := range conns {
		err := conn.WriteMessage(websocket.TextMessage, msgBytes)
		if err != nil {
			conn.Close()
			delete(conns, conn)
		}
	}
	m.mu.Unlock()
}

func (m *ConnectionManager) BroadcastToTwoUsers(userID1, userID2 string, message map[string]any) {
	m.BroadcastToUser(userID1, message)
	m.BroadcastToUser(userID2, message)
}

func (m *ConnectionManager) notifyFriends(userID string, eventType string) {
	rows, err := database.DB.Query(`
		SELECT 
			CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END as friend_id
		FROM friends f
		WHERE (f.requester_id = $1 OR f.addressee_id = $1)
		AND f.status = 'friends'
	`, userID)

	if err != nil {
		fmt.Println("Notify friends error:", err)
		return
	}
	defer rows.Close()

	var username, profileImage string
	var createdAt time.Time
	database.DB.QueryRow(
		"SELECT username, profile_image, created_at FROM users WHERE id = $1", userID,
	).Scan(&username, &profileImage, &createdAt)

	for rows.Next() {
		var friendID string
		rows.Scan(&friendID)

		m.BroadcastToUser(friendID, map[string]any{
			"type":      eventType,
			"id":        userID,
			"username":  username,
			"image":     profileImage,
			"createdAt": createdAt.Year(),
		})
	}
}

func (m *ConnectionManager) sendOnlineFriendsToUser(conn *websocket.Conn, userID string) {
	rows, err := database.DB.Query(`
		SELECT u.id, u.username, u.profile_image, u.created_at
		FROM friends f
		JOIN users u ON (
			(f.requester_id = $1 AND f.addressee_id = u.id) OR
			(f.addressee_id = $1 AND f.requester_id = u.id)
		)
		WHERE (f.requester_id = $1 OR f.addressee_id = $1)
		AND f.status = 'friends'
		AND u.is_online = true
		AND u.id != $1
	`, userID)

	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id, username, image string
		var createdAt time.Time
		rows.Scan(&id, &username, &image, &createdAt)

		msg, _ := json.Marshal(map[string]any{
			"type":      "userOnline",
			"id":        id,
			"username":  username,
			"image":     image,
			"createdAt": createdAt.Year(),
		})
		conn.WriteMessage(websocket.TextMessage, msg)
	}
}

func (m *ConnectionManager) notifyPending(userID string, eventType string) {
	rows, err := database.DB.Query(`
		SELECT 
			CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END as pending_id
		FROM friends f
		WHERE (f.requester_id = $1 OR f.addressee_id = $1)
		AND f.status = 'pending'
	`, userID)

	if err != nil {
		return
	}
	defer rows.Close()

	var username, profileImage string
	var createdAt time.Time
	database.DB.QueryRow(
		"SELECT username, profile_image, created_at FROM users WHERE id = $1", userID,
	).Scan(&username, &profileImage, &createdAt)

	for rows.Next() {
		var pendingID string
		rows.Scan(&pendingID)

		m.BroadcastToUser(pendingID, map[string]any{
			"type":      eventType,
			"id":        userID,
			"username":  username,
			"image":     profileImage,
			"createdAt": createdAt.Year(),
		})
	}
}

func (m *ConnectionManager) notifyCommunityMembers(userID string, eventType string) {
	rows, err := database.DB.Query(`
		SELECT DISTINCT cm2.user_id
		FROM community_members cm1
		JOIN community_members cm2 ON cm1.community_id = cm2.community_id
		WHERE cm1.user_id = $1
		AND cm2.user_id != $1
	`, userID)

	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var memberID string
		rows.Scan(&memberID)

		m.BroadcastToUser(memberID, map[string]any{
			"type":     eventType,
			"memberId": userID,
		})
	}
}

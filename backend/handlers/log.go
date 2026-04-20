package handlers

import (
	"axion/database"
	ws "axion/websocket"
	"time"
)

func CreateLog(communityID string, userID string, title string, note *string) error {
	logID := database.GenerateID(20)

	_, err := database.DB.Exec(
		`INSERT INTO community_logs (id, community_id, user_id, title, note)
		 VALUES ($1, $2, $3, $4, $5)`,
		logID, communityID, userID, title, note,
	)

	var userImage string
	err = database.DB.QueryRow(
		"SELECT image FROM users WHERE id = $1", userID,
	).Scan(&userImage)

	if err != nil {
		return err
	}

	ws.Manager.BroadcastToCommunity(communityID, map[string]any{
		"type":      "newLog",
		"title":     title,
		"note":      note,
		"image":     userImage,
		"createdAt": time.Now().UTC().Format("Mon 15:04"),
	})

	return err
}

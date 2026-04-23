package handlers

import (
	"axion/database"
	"axion/models"
)

func GetFriends(userID string) ([]models.Friend, error) {
	rows, err := database.DB.Query(`
		SELECT 
			CASE 
				WHEN requester_id = $1 THEN addressee_id
				ELSE requester_id
			END AS friend_id
		FROM friends
		WHERE (requester_id = $1 OR addressee_id = $1)
	`, userID)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var friends []models.Friend

	for rows.Next() {
		var friend models.Friend
		if err := rows.Scan(&friend.ID); err != nil {
			return nil, err
		}
		friends = append(friends, friend)
	}

	return friends, err
}

func GetFriend(userID1 string, userID2 string) (models.Friend, error) {
	var friend models.Friend

	err := database.DB.QueryRow(
		`SELECT id, requester_id, addressee_id, status, created_at, updated_at FROM friends 
		 WHERE (requester_id = $1 AND addressee_id = $2) 
		 OR (requester_id = $2 AND addressee_id = $1)`,
		userID1, userID2,
	).Scan(&friend.ID, &friend.RequesterID, &friend.AddresseID, &friend.Status, &friend.CreatedAt, &friend.UpdatedAt)

	return friend, err
}

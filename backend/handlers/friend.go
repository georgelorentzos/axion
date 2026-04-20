package handlers

import (
	"axion/database"
	"axion/models"
)

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

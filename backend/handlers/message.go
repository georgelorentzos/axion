package handlers

import (
	"axion/database"
	"axion/models"
)

func GetDirectMessage(messageID string) (models.DirectMessage, error) {
	var message models.DirectMessage
	err := database.DB.QueryRow(
		"SELECT id, sender_id FROM direct_messages WHERE id = $1", messageID,
	).Scan(&message.ID, &message.SenderID)
	return message, err
}

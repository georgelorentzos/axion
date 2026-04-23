package handlers

import (
	"axion/database"
	"axion/models"
)

func GetConversations(userID string) ([]models.Conversation, error) {
	rows, err := database.DB.Query(`
		SELECT
			CASE 
				WHEN sender_id = $1 THEN recipient_id
			ELSE sender_id
		END AS conversation_id
		WHERE (sender_id = $1 OR recipient_id = $1)
	`, userID)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var conversations []models.Conversation

	for rows.Next() {
		var conversation models.Conversation
		if err := rows.Scan(&conversation.ID); err != nil {
			return nil, err
		}
		conversations = append(conversations, conversation)
	}

	return conversations, err
}

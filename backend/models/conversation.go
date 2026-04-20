package models

import "time"

type Conversation struct {
	ID          string    `json:"id"`
	SenderID    string    `json:"sender_id"`
	RecipientID string    `json:"recipient_id"`
	Message     string    `json:"message"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

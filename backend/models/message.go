package models

import "time"

type DirectMessage struct {
	ID                string    `json:"id"`
	SenderID          string    `json:"senderId"`
	RecipientID       string    `json:"recipientId"`
	Message           string    `json:"message"`
	HiddenBySender    bool      `json:"hiddenBySender"`
	HiddenByRecipient bool      `json:"hiddenByRecipient"`
	IsEdited          bool      `json:"isEdited"`
	CreatedAt         time.Time `json:"createdAt"`
	ReplyToID         *string   `json:"replyToId"`
	SenderUsername    string    `json:"senderUsername"`
	SenderImage       *string   `json:"senderImage"`
	ReplyToUsername   *string   `json:"replyToUsername"`
	ReplyToImage      *string   `json:"replyToImage"`
	ReplyToMessage    *string   `json:"replyToMessage"`
}

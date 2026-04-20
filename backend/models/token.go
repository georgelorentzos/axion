package models

import "time"

type Token struct {
	ID        string    `json:"id"`
	Token     string    `json:"token"`
	Type      string    `json:"type"`
	UserID    string    `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

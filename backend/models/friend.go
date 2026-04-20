package models

import "time"

type Friend struct {
	ID          string    `json:"id"`
	RequesterID string    `json:"requester_id"`
	AddresseID  string    `json:"addressee_id"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

package models

import "time"

type User struct {
	ID         string    `json:"id"`
	Username   string    `json:"username"`
	Email      string    `json:"email"`
	Bio        *string   `json:"bio"`
	Image      *string   `json:"image"`
	IsVerified bool      `json:"isVerified"`
	IsOnline   bool      `json:"isOnline"`
	LastSeen   time.Time `json:"lastSeen"`
	CreatedAt  time.Time `json:"createdAt"`
}

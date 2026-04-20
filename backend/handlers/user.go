package handlers

import (
	"axion/database"
	"axion/models"
)

func GetUser(userID string) (models.User, error) {
	var user models.User

	err := database.DB.QueryRow(
		"SELECT id, username, image, created_at FROM users WHERE id = $1", userID,
	).Scan(&user.ID, &user.Username, &user.Image, &user.CreatedAt)

	return user, err
}

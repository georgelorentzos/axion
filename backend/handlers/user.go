package handlers

import (
	"axion/database"
	"axion/models"
	"net/http"
)

func GetUser(userID string) (models.User, error) {
	var user models.User

	err := database.DB.QueryRow(
		"SELECT id, username, email, bio, image, created_at FROM users WHERE id = $1", userID,
	).Scan(&user.ID, &user.Username, &user.Email, &user.Bio, &user.Image, &user.CreatedAt)

	return user, err
}

func CheckFieldTaken(w http.ResponseWriter, field string, value string, excludeID string) bool {
	var existingID string
	err := database.DB.QueryRow(
		"SELECT id FROM users WHERE "+field+" = $1 AND id != $2",
		value, excludeID,
	).Scan(&existingID)

	if err == nil {
		WriteErrorResponse(w, http.StatusConflict, field+" already taken.")
		return true
	}
	return false
}

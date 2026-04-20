package routes

import (
	"axion/database"
	"axion/handlers"
	"axion/middleware"
	"axion/models"
	"encoding/json"
	"net/http"
)

func UserRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /me", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		currentUser, err := handlers.GetUser(r.Header.Get("X-User-ID"))

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success":  true,
			"id":       currentUser.ID,
			"username": currentUser.Username,
			"image":    currentUser.Image,
			"email":    currentUser.Email,
		})
	}))

	mux.HandleFunc("GET /users/search", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		currentUserID := r.Header.Get("X-User-ID")
		var searchQuery = r.URL.Query().Get("search")

		if searchQuery == "" {
			json.NewEncoder(w).Encode(map[string]any{
				"success": true,
				"users":   []any{},
			})
			return
		}

		rows, err := database.DB.Query(
			"SELECT id, username, image, is_online, created_at FROM users WHERE username ILIKE $1 AND id != $2", "%"+searchQuery+"%", currentUserID,
		)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Query failed.")
			return
		}

		defer rows.Close()

		var users []map[string]any
		for rows.Next() {
			var user models.User
			rows.Scan(&user.ID, &user.Username, &user.Image, &user.IsOnline, &user.CreatedAt)
			users = append(users, map[string]any{
				"id":        user.ID,
				"username":  user.Username,
				"image":     user.Image,
				"isOnline":  user.IsOnline,
				"createdAt": user.CreatedAt.Year(),
			})
		}

		if users == nil {
			users = []map[string]any{}
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"users":   users,
		})
	}))

	mux.HandleFunc("GET /users/{userID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := handlers.ValidateID(w, r.PathValue("userID"), "User")
		if !ok {
			return
		}

		user, err := handlers.GetUser(userID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success":   true,
			"id":        user.ID,
			"username":  user.Username,
			"image":     user.Image,
			"isOnline":  user.IsOnline,
			"createdAt": user.CreatedAt,
		})
	}))
}

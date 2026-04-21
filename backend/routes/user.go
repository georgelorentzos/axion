package routes

import (
	"axion/database"
	"axion/handlers"
	"axion/middleware"
	"axion/models"
	"encoding/json"
	"net/http"
	"path/filepath"
)

func UserRoutes(mux *http.ServeMux) {
	mux.HandleFunc("PATCH /me", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		currentUser, err := handlers.GetUser(r.Header.Get("X-User-ID"))

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
			return
		}

		r.ParseMultipartForm(10 << 20)

		username, ok := handlers.ValidateName(w, r.FormValue("username"), "Community", 32)
		if !ok {
			return
		}

		email, ok := handlers.ValidateEmail(w, r.FormValue("email"), "Community")
		if !ok {
			return
		}

		bio := r.FormValue("bio")

		var imagePath *string
		file, header, err := r.FormFile("image")
		if err == nil {
			defer file.Close()
			path, err := handlers.SaveFile(file, filepath.Ext(header.Filename))
			if err != nil {
				handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to save image.")
				return
			}
			imagePath = &path
		}

		if handlers.CheckFieldTaken(w, "username", username, currentUser.ID) {
			return
		}
		if handlers.CheckFieldTaken(w, "email", email, currentUser.ID) {
			return
		}

		_, err = database.DB.Exec(
			"UPDATE users SET username = $1, email = $2, bio = $3, image = $4 WHERE id = $5",
			username, email, bio, imagePath, currentUser.ID,
		)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to update user.")
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("GET /me", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		currentUser, err := handlers.GetUser(r.Header.Get("X-User-ID"))

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success":   true,
			"id":        currentUser.ID,
			"username":  currentUser.Username,
			"email":     currentUser.Email,
			"bio":       currentUser.Bio,
			"image":     currentUser.Image,
			"createdAt": currentUser.CreatedAt,
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
			"bio":       user.Bio,
			"image":     user.Image,
			"isOnline":  user.IsOnline,
			"createdAt": user.CreatedAt,
		})
	}))
}

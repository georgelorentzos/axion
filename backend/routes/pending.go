package routes

import (
	"axion/database"
	"axion/handlers"
	"axion/middleware"
	"axion/models"
	ws "axion/websocket"
	"encoding/json"
	"net/http"
)

func PendingRoutes(mux *http.ServeMux) {
	mux.HandleFunc("PATCH /pending/{userID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := handlers.ValidateID(w, r.PathValue("userID"), "User")
		if !ok {
			return
		}

		currentUser, err := handlers.GetUser(r.Header.Get("X-User-ID"))

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
			return
		}

		user, err := handlers.GetUser(userID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
			return
		}

		friend, err := handlers.GetFriend(currentUser.ID, user.ID)

		if err != nil || friend.Status != "pending" {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Friend request not found.")
			return
		}

		_, err = database.DB.Exec(
			"UPDATE friends SET status = $2 WHERE id = $1", friend.ID, "friends",
		)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to update friend status.")
			return
		}

		ws.Manager.BroadcastToUser(user.ID, map[string]any{
			"type":      "allyRequestAccepted",
			"id":        currentUser.ID,
			"username":  currentUser.Username,
			"bio":       currentUser.Bio,
			"image":     currentUser.Image,
			"isOnline":  currentUser.IsOnline,
			"createdAt": currentUser.CreatedAt,
		})

		ws.Manager.BroadcastToUser(currentUser.ID, map[string]any{
			"type":      "allyRequestAccepted",
			"id":        user.ID,
			"username":  user.Username,
			"bio":       user.Bio,
			"image":     user.Image,
			"isOnline":  user.IsOnline,
			"createdAt": user.CreatedAt,
		})

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("DELETE /pending/{userID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := handlers.ValidateID(w, r.PathValue("userID"), "User")
		if !ok {
			return
		}

		currentUserID := r.Header.Get("X-User-ID")

		friend, err := handlers.GetFriend(currentUserID, userID)

		if err != nil || friend.Status != "pending" {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Friend request not found.")
			return
		}

		_, err = database.DB.Exec(
			"DELETE FROM friends WHERE id = $1", friend.ID,
		)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to delete pending.")
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("GET /pending", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		currentUserID := r.Header.Get("X-User-ID")

		rows, err := database.DB.Query(`
			SELECT u.id, u.username, u.bio, u.image, u.is_online, u.created_at
			FROM friends f
			JOIN users u ON u.id = f.requester_id
			WHERE f.addressee_id = $1 AND f.status = $2;
		`, currentUserID, "pending")

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to fetch pending")
			return
		}
		defer rows.Close()

		var users []map[string]any
		for rows.Next() {
			var user models.User
			rows.Scan(&user.ID, &user.Username, &user.Bio, &user.Image, &user.IsOnline, &user.CreatedAt)
			users = append(users, map[string]any{
				"id":        user.ID,
				"username":  user.Username,
				"bio":       user.Bio,
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
			"pending": users,
		})
	}))
}

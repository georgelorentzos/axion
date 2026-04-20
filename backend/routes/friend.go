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

func FriendRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /friends/{userID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := handlers.ValidateID(w, r.PathValue("userID"), "User")
		if !ok {
			return
		}

		currentUser, err := handlers.GetUser(r.Header.Get("X-User-ID"))

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
			return
		}

		if userID == currentUser.ID {
			handlers.WriteErrorResponse(w, http.StatusBadRequest, "Cannot friend yourself.")
			return
		}

		friend, err := handlers.GetFriend(currentUser.ID, userID)

		if err == nil {
			if friend.Status == "friends" {
				handlers.WriteErrorResponse(w, http.StatusBadRequest, "Already friends.")
				return
			}

			if friend.RequesterID == userID && friend.Status == "pending" {
				_, err = database.DB.Exec(
					"UPDATE friends SET status = 'friends' WHERE id = $1",
					friend.ID,
				)

				if err != nil {
					handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to accept friend request.")
					return
				}

				json.NewEncoder(w).Encode(map[string]any{
					"success": true,
				})
				return
			}

			handlers.WriteErrorResponse(w, http.StatusBadRequest, "Request already exists.")
			return
		}

		friendID := database.GenerateID(20)
		_, err = database.DB.Exec(
			"INSERT INTO friends (id, requester_id, addressee_id, status) VALUES ($1, $2, $3, 'pending')",
			friendID, currentUser.ID, userID,
		)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to send request.")
			return
		}

		ws.Manager.BroadcastToUser(userID, map[string]any{
			"type":      "allyRequestSent",
			"id":        currentUser.ID,
			"username":  currentUser.Username,
			"image":     currentUser.Image,
			"isOnline":  currentUser.IsOnline,
			"createdAt": currentUser.CreatedAt,
		})

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("DELETE /friends/{userID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := handlers.ValidateID(w, r.PathValue("userID"), "User")
		if !ok {
			return
		}

		currentUser, err := handlers.GetUser(r.Header.Get("X-User-ID"))

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
			return
		}

		if userID == currentUser.ID {
			handlers.WriteErrorResponse(w, http.StatusBadRequest, "Cannot Unfriend yourself.")
			return
		}

		member, err := handlers.GetFriend(currentUser.ID, userID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "No friend request found.")
			return
		}

		_, err = database.DB.Exec("DELETE FROM friends WHERE id = $1", member.ID)
		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to cancel request.")
			return
		}

		ws.Manager.BroadcastToUser(userID, map[string]any{
			"type": "allyRequestDeleted",
			"id":   currentUser.ID,
		})

		ws.Manager.BroadcastToUser(currentUser.ID, map[string]any{
			"type": "allyRequestDeleted",
			"id":   userID,
		})

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("GET /friends", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		currentUserID := r.Header.Get("X-User-ID")

		rows, err := database.DB.Query(`
			SELECT u.id, u.username, u.image, u.is_online, u.created_at
			FROM friends f
			JOIN users u ON (
				(f.requester_id = $1 AND f.addressee_id = u.id) OR
				(f.addressee_id = $1 AND f.requester_id = u.id)
			)
			WHERE (f.requester_id = $1 OR f.addressee_id = $1)
			AND f.status = 'friends'
			AND u.id != $1
		`, currentUserID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to fetch friends")
			return
		}

		defer rows.Close()

		var friends []map[string]any
		for rows.Next() {
			var user models.User
			rows.Scan(&user.ID, &user.Username, &user.Image, &user.IsOnline, &user.CreatedAt)
			friends = append(friends, map[string]any{
				"id":        user.ID,
				"username":  user.Username,
				"image":     user.Image,
				"isOnline":  user.IsOnline,
				"createdAt": user.CreatedAt.Year(),
			})
		}

		if friends == nil {
			friends = []map[string]any{}
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"friends": friends,
		})
	}))
}

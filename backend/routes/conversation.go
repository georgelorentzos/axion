package routes

import (
	"axion/database"
	"axion/handlers"
	"axion/middleware"
	"axion/models"
	ws "axion/websocket"
	"database/sql"
	"encoding/json"
	"net/http"
)

func ConversationRoutes(mux *http.ServeMux) {
	mux.HandleFunc("DELETE /conversations/{userID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := handlers.ValidateID(w, r.PathValue("userID"), "User")
		if !ok {
			return
		}

		currentUser, err := handlers.GetUser(r.Header.Get("X-User-ID"))

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
			return
		}

		var conversation models.Conversation
		err = database.DB.QueryRow(`
    	    SELECT id, sender_id FROM conversations WHERE
    	    (
    	        (sender_id = $1 AND recipient_id = $2) OR
    	        (sender_id = $2 AND recipient_id = $1)
    	    )
    	`, currentUser.ID, userID).Scan(&conversation.ID, &conversation.SenderID)

		if err != nil {
			if err == sql.ErrNoRows {
				handlers.WriteErrorResponse(w, http.StatusNotFound, "Conversation not found.")
				return
			}

			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to fetch conversation.")
			return
		}

		tx, err := database.DB.Begin()

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to start transaction.")
			return
		}

		if conversation.SenderID == currentUser.ID {
			tx.Exec("UPDATE conversations SET hidden_by_sender = true WHERE id = $1", conversation.ID)
		} else {
			tx.Exec("UPDATE conversations SET hidden_by_recipient = true WHERE id = $1", conversation.ID)
		}

		tx.Exec(`
    	    UPDATE direct_messages SET
    	        hidden_by_sender = CASE WHEN sender_id = $1 THEN true ELSE hidden_by_sender END,
    	        hidden_by_recipient = CASE WHEN recipient_id = $1 THEN true ELSE hidden_by_recipient END
    	    WHERE (sender_id = $1 AND recipient_id = $2)
    	       OR (sender_id = $2 AND recipient_id = $1)
    	`, currentUser.ID, userID)

		tx.Exec(`
    	    DELETE FROM direct_messages WHERE
    	    hidden_by_sender = true AND hidden_by_recipient = true
    	    AND (
    	        (sender_id = $1 AND recipient_id = $2) OR
    	        (sender_id = $2 AND recipient_id = $1)
    	    )
    	`, currentUser.ID, userID)

		err = tx.Commit()

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to delete conversation.")
			return
		}

		ws.Manager.BroadcastToUser(currentUser.ID, map[string]any{
			"type": "conversationDeleted",
			"id":   userID,
		})

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("GET /conversations", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		currentUserID := r.Header.Get("X-User-ID")

		rows, err := database.DB.Query(`
			SELECT 
				u.id, u.username, u.image, u.is_online, u.created_at,
				c.message
			FROM conversations c
			JOIN users u ON (
				CASE
					WHEN c.sender_id = $1 THEN u.id = c.recipient_id
					WHEN c.recipient_id = $1 THEN u.id = c.sender_id
				END
			)
			WHERE (c.sender_id = $1 OR c.recipient_id = $1)
			AND NOT (c.sender_id = $1 AND c.hidden_by_sender = true)
			AND NOT (c.recipient_id = $1 AND c.hidden_by_recipient = true)
			ORDER BY c.created_at DESC
		`, currentUserID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to fetch conversations.")
			return
		}

		defer rows.Close()

		seen := make(map[string]bool)
		var conversations []map[string]any
		for rows.Next() {
			var user models.User
			var latestMessage string
			rows.Scan(&user.ID, &user.Username, &user.Image, &user.IsOnline, &user.CreatedAt, &latestMessage)

			if seen[user.ID] {
				continue
			}
			seen[user.ID] = true

			conversations = append(conversations, map[string]any{
				"id":            user.ID,
				"username":      user.Username,
				"image":         user.Image,
				"isOnline":      user.IsOnline,
				"createdAt":     user.CreatedAt.Year(),
				"latestMessage": latestMessage,
			})
		}

		if conversations == nil {
			conversations = []map[string]any{}
		}
		json.NewEncoder(w).Encode(map[string]any{
			"success":       true,
			"conversations": conversations,
		})
	}))
}

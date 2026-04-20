package routes

import (
	"axion/database"
	"axion/handlers"
	"axion/middleware"
	"axion/models"
	"axion/schemas"
	ws "axion/websocket"
	"encoding/json"
	"net/http"
	"strconv"
)

func MessageRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /chat/{userID}/messages", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := handlers.ValidateID(w, r.PathValue("userID"), "User")
		if !ok {
			return
		}

		var req schemas.MessageRequest
		if !handlers.DecodeJSON(w, r, &req) {
			return
		}

		if req.Message == "" {
			handlers.WriteErrorResponse(w, http.StatusBadRequest, "message is required.")
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

		if user.ID == currentUser.ID {
			handlers.WriteErrorResponse(w, http.StatusBadRequest, "Cannot send message to yourself.")
			return
		}

		messageID := database.GenerateID(20)
		_, err = database.DB.Exec(`
			INSERT INTO direct_messages (id, sender_id, recipient_id, message, reply_to_id) VALUES ($1, $2, $3, $4, $5)
		`, messageID, currentUser.ID, user.ID, req.Message, req.ReplyToID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create message.")
			return
		}

		var conversationID string
		err = database.DB.QueryRow(`
			SELECT id FROM conversations WHERE
			(
				(sender_id = $1 AND recipient_id = $2) OR
				(sender_id = $2 AND recipient_id = $1)
			)
		`, currentUser.ID, user.ID).Scan(&conversationID)
		if err != nil {
			conversationID := database.GenerateID(20)
			_, err = database.DB.Exec(
				"INSERT INTO conversations (id, sender_id, recipient_id, message) VALUES ($1, $2, $3, $4)",
				conversationID, currentUser.ID, user.ID, req.Message)
			if err != nil {
				handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create conversation.")
				return
			}
		} else {
			_, err = database.DB.Exec(
				"UPDATE conversations SET message = $1, hidden_by_sender = false, hidden_by_recipient = false WHERE id = $2",
				req.Message, conversationID)
			if err != nil {
				handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to update conversation.")
				return
			}
		}

		ws.Manager.BroadcastToUser(currentUser.ID, map[string]any{
			"type":          "conversationUpdated",
			"id":            user.ID,
			"username":      user.Username,
			"image":         user.Image,
			"isOnline":      user.IsOnline,
			"createdAt":     user.CreatedAt.Year(),
			"latestMessage": req.Message,
		})

		ws.Manager.BroadcastToUser(user.ID, map[string]any{
			"type":          "conversationUpdated",
			"id":            currentUser.ID,
			"username":      currentUser.Username,
			"image":         currentUser.Image,
			"isOnline":      currentUser.IsOnline,
			"createdAt":     currentUser.CreatedAt.Year(),
			"latestMessage": req.Message,
		})

		var message models.DirectMessage
		err = database.DB.QueryRow(`
		    SELECT 
		        d.id,
		        d.sender_id,
		        d.recipient_id,
		        d.message,
		        d.is_edited,
		        d.created_at,
		        d.reply_to_id,
		        u.username,
		        u.image,
		        r.message,
		        ru.username,
		        ru.image
		    FROM direct_messages d
		    JOIN users u ON u.id = d.sender_id
		    LEFT JOIN direct_messages r ON r.id = d.reply_to_id
		    LEFT JOIN users ru ON ru.id = r.sender_id
		    WHERE d.id = $1
		`, messageID).Scan(
			&message.ID, &message.SenderID, &message.RecipientID,
			&message.Message, &message.IsEdited, &message.CreatedAt,
			&message.ReplyToID, &message.SenderUsername, &message.SenderImage,
			&message.ReplyToMessage, &message.ReplyToUsername, &message.ReplyToImage,
		)

		var messageData = map[string]any{
			"type":            "newDirectMessage",
			"id":              message.ID,
			"senderId":        message.SenderID,
			"recipientId":     message.RecipientID,
			"message":         message.Message,
			"isEdited":        message.IsEdited,
			"createdAt":       message.CreatedAt.Format("15:04"),
			"senderUsername":  message.SenderUsername,
			"senderImage":     message.SenderImage,
			"replyToId":       message.ReplyToID,
			"replyToUsername": message.ReplyToUsername,
			"replyToImage":    message.ReplyToImage,
			"replyToMessage":  message.ReplyToMessage,
		}

		ws.Manager.BroadcastToTwoUsers(currentUser.ID, user.ID, messageData)

		ws.Manager.BroadcastToUser(user.ID, map[string]any{
			"type":      "unreadDirectMessages",
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

	mux.HandleFunc("PATCH /chat/{userID}/messages/{messageID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := handlers.ValidateID(w, r.PathValue("userID"), "User")
		if !ok {
			return
		}

		messageID, ok := handlers.ValidateID(w, r.PathValue("messageID"), "Message")
		if !ok {
			return
		}

		currentUserID := r.Header.Get("X-User-ID")

		var req schemas.MessageRequest
		if !handlers.DecodeJSON(w, r, &req) {
			return
		}

		message, err := handlers.GetDirectMessage(messageID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Message not found.")
			return
		}

		if currentUserID != message.SenderID {
			handlers.WriteErrorResponse(w, http.StatusForbidden, "You cant edit messages that you dont own")
			return
		}

		_, err = database.DB.Exec(
			"UPDATE direct_messages SET message = $1, is_edited = true WHERE id = $2", req.Message, message.ID,
		)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to update message")
			return
		}

		ws.Manager.BroadcastToTwoUsers(currentUserID, userID, map[string]any{
			"type":     "directMessageEdited",
			"id":       message.ID,
			"message":  req.Message,
			"isEdited": true,
		})

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("DELETE /chat/{userID}/messages/{messageID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := handlers.ValidateID(w, r.PathValue("userID"), "User")
		if !ok {
			return
		}

		messageID, ok := handlers.ValidateID(w, r.PathValue("messageID"), "Message")
		if !ok {
			return
		}

		currentUserID := r.Header.Get("X-User-ID")

		message, err := handlers.GetDirectMessage(messageID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Message not found.")
			return
		}

		if message.SenderID != currentUserID {
			handlers.WriteErrorResponse(w, http.StatusForbidden, "You cant delete messages that you dont own")
			return
		}

		_, err = database.DB.Exec(
			"DELETE FROM direct_messages WHERE id = $1", message.ID,
		)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to delete message.")
			return
		}

		ws.Manager.BroadcastToTwoUsers(currentUserID, userID, map[string]any{
			"type": "directMessageDeleted",
			"id":   message.ID,
		})

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("GET /chat/{userID}/messages", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := handlers.ValidateID(w, r.PathValue("userID"), "User")
		if !ok {
			return
		}

		currentUserID := r.Header.Get("X-User-ID")

		limit := r.URL.Query().Get("limit")
		offset := r.URL.Query().Get("offset")

		var totalCount int
		err := database.DB.QueryRow(`
			SELECT COUNT (*) FROM direct_messages WHERE 
			(
				(sender_id = $1 AND recipient_id = $2) OR
        		(sender_id = $2 AND recipient_id = $1)
			)
			AND NOT (sender_id = $1 AND hidden_by_sender = true)
    		AND NOT (recipient_id = $1 AND hidden_by_recipient = true)
		`, currentUserID, userID).Scan(&totalCount)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to count messages.")
			return
		}

		rows, err := database.DB.Query(`
			SELECT 
				d.id,
				d.sender_id,
        		d.recipient_id,
        		d.message,
        		d.is_edited,
        		d.created_at,
        		d.reply_to_id,
				u.username,
				u.image,
				r.message,
        		ru.username,
        		ru.image
			FROM direct_messages d
			JOIN users u ON u.id = d.sender_id
			LEFT JOIN direct_messages r ON r.id = d.reply_to_id
			LEFT JOIN users ru ON ru.id = r.sender_id
    		WHERE (
    		    (d.sender_id = $1 AND d.recipient_id = $2) OR
    		    (d.sender_id = $2 AND d.recipient_id = $1)
    		)
			AND NOT (d.sender_id = $1 AND d.hidden_by_sender = true)
    		AND NOT (d.recipient_id = $1 AND d.hidden_by_recipient = true)
    		ORDER BY d.created_at ASC
    		LIMIT $3 OFFSET $4
		`, currentUserID, userID, limit, offset)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to fetch messages.")
			return
		}

		defer rows.Close()

		var messages []map[string]any
		for rows.Next() {
			var message models.DirectMessage
			rows.Scan(
				&message.ID, &message.SenderID, &message.RecipientID,
				&message.Message, &message.IsEdited, &message.CreatedAt,
				&message.ReplyToID, &message.SenderUsername, &message.SenderImage,
				&message.ReplyToMessage, &message.ReplyToUsername, &message.ReplyToImage,
			)
			messages = append(messages, map[string]any{
				"id":              message.ID,
				"senderId":        message.SenderID,
				"recipientId":     message.RecipientID,
				"message":         message.Message,
				"isEdited":        message.IsEdited,
				"createdAt":       message.CreatedAt.Format("15:04"),
				"senderUsername":  message.SenderUsername,
				"senderImage":     message.SenderImage,
				"replyToId":       message.ReplyToID,
				"replyToUsername": message.ReplyToUsername,
				"replyToImage":    message.ReplyToImage,
				"replyToMessage":  message.ReplyToMessage,
			})
		}

		if messages == nil {
			messages = []map[string]any{}
		}

		limitInt, _ := strconv.Atoi(limit)
		offsetInt, _ := strconv.Atoi(offset)

		json.NewEncoder(w).Encode(map[string]any{
			"success":  true,
			"messages": messages,
			"total":    totalCount,
			"limit":    limitInt,
			"offset":   offsetInt,
			"hasMore":  (offsetInt + limitInt) < totalCount,
		})
	}))
}

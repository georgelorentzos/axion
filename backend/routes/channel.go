package routes

import (
	"axion/constants"
	"axion/database"
	"axion/handlers"
	"axion/middleware"
	"axion/models"
	"axion/schemas"
	"axion/services"
	ws "axion/websocket"
	"encoding/json"
	"net/http"
	"strconv"
)

func ChannelRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /communities/{communityID}/channels", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		var req schemas.ChannelRequest
		if !handlers.DecodeJSON(w, r, &req) {
			return
		}

		channelName, ok := handlers.ValidateName(w, req.ChannelName, "Channel", 32)
		if !ok {
			return
		}

		community, err := handlers.GetCommunity(communityID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Community not found.")
			return
		}

		currentUser, err := handlers.GetUser(r.Header.Get("X-User-ID"))

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
			return
		}

		if community.OwnerID != currentUser.ID {
			ok := handlers.CheckPermissions(
				currentUser.ID,
				community.ID,
				[]string{constants.ADMINISTRATOR, constants.MANAGE_CHANNELS},
				w,
			)

			if !ok {
				handlers.WriteErrorResponse(w, http.StatusUnauthorized, "You dont have permission.")
				return
			}
		}

		channelID := database.GenerateID(20)

		_, err = database.DB.Exec(`
			INSERT INTO community_channels (id, name, type, community_id, category_id)
			VALUES ($1, $2, $3, $4, $5)
		`, channelID, channelName, constants.CHANNEL_TEXT, communityID, req.CategoryID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create channel.")
			return
		}

		ws.Manager.BroadcastToCommunity(communityID, map[string]any{
			"type":       "channelCreated",
			"id":         channelID,
			"name":       channelName,
			"categoryId": req.CategoryID,
		})

		err = services.CreateLog(communityID, currentUser.ID, currentUser.Username+" created the channel "+channelName, nil)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create log.")
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("DELETE /communities/{communityID}/channels/{channelID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		channelID, ok := handlers.ValidateID(w, r.PathValue("channelID"), "Channel")
		if !ok {
			return
		}

		community, err := handlers.GetCommunity(communityID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Community not found.")
			return
		}

		currentUser, err := handlers.GetUser(r.Header.Get("X-User-ID"))

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
			return
		}

		if community.OwnerID != currentUser.ID {
			ok := handlers.CheckPermissions(
				currentUser.ID,
				community.ID,
				[]string{constants.ADMINISTRATOR, constants.MANAGE_CHANNELS},
				w,
			)

			if !ok {
				handlers.WriteErrorResponse(w, http.StatusForbidden, "You dont have permission.")
				return
			}
		}

		channel, err := handlers.GetCommunityChannel(community.ID, channelID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Channel not found.")
			return
		}

		tx, err := database.DB.Begin()

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to start transaction.")
			return
		}

		tx.Exec(`
			DELETE FROM channel_messages WHERE community_id = $1 AND channel_id = $2
		`, community.ID, channel.ID)
		tx.Exec(`
			DELETE FROM community_channels WHERE community_id = $1 AND id = $2
		`, community.ID, channel.ID)

		err = tx.Commit()

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to delete channel.")
			return
		}

		ws.Manager.BroadcastToCommunity(community.ID, map[string]any{
			"type": "channelDeleted",
			"id":   channelID,
		})

		err = services.CreateLog(community.ID, currentUser.ID, currentUser.Username+" deleted the channel "+channel.Name, nil)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create log.")
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"id":      channelID,
		})
	}))

	mux.HandleFunc("GET /communities/{communityID}/channels/{channelID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		channelID, ok := handlers.ValidateID(w, r.PathValue("channelID"), "Channel")
		if !ok {
			return
		}

		channel, err := handlers.GetCommunityChannel(communityID, channelID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Channel not found.")
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"id":      channel.ID,
			"name":    channel.Name,
		})
	}))

	mux.Handle("GET /communities/{communityID}/channels", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		rows, err := database.DB.Query(`
			SELECT c.id, c.name, c.category_id
			FROM community_channels c
			JOIN communities cm ON cm.id = c.community_id
			WHERE cm.id = $1
		`, communityID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to fetch channels.")
			return
		}

		defer rows.Close()

		var channels []map[string]any

		for rows.Next() {
			var channel models.CommunityChannel
			rows.Scan(&channel.ID, &channel.Name, &channel.CategoryID)
			channels = append(channels, map[string]any{
				"id":         channel.ID,
				"name":       channel.Name,
				"categoryId": channel.CategoryID,
			})
		}

		if channels == nil {
			channels = []map[string]any{}
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success":  true,
			"channels": channels,
		})
	}))

	mux.HandleFunc("POST /communities/{communityID}/channels/{channelID}/messages", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		channelID, ok := handlers.ValidateID(w, r.PathValue("channelID"), "Channel")
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

		messageID := database.GenerateID(20)
		_, err = database.DB.Exec(`
			INSERT INTO channel_messages 
			(id, sender_id, channel_id, community_id, message, reply_to_id)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, messageID, currentUser.ID, channelID, communityID, req.Message, req.ReplyToID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create message.")
			return
		}

		var message models.ChannelMessage
		err = database.DB.QueryRow(`
			SELECT 
				cm.id,
				cm.sender_id,
				cm.channel_id,
				cm.message,
				cm.is_edited,
				cm.created_at,
				cm.reply_to_id,
				u.username,
				u.image,
				rm.message,
				ru.username,
				ru.image
			FROM channel_messages cm
			JOIN users u ON u.id = cm.sender_id
			LEFT JOIN channel_messages rm ON rm.id = cm.reply_to_id
			LEFT JOIN users ru ON ru.id = rm.sender_id
			WHERE cm.id = $1
		`, messageID).Scan(
			&message.ID,
			&message.SenderID,
			&message.ChannelID,
			&message.Message,
			&message.IsEdited,
			&message.CreatedAt,
			&message.ReplyToID,
			&message.SenderUsername,
			&message.SenderImage,
			&message.ReplyToMessage,
			&message.ReplyToUsername,
			&message.ReplyToImage,
		)

		var messageData = map[string]any{
			"type":            "newChannelMessage",
			"id":              message.ID,
			"senderId":        message.SenderID,
			"recipientId":     message.ChannelID,
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

		ws.Manager.BroadcastToCommunity(communityID, messageData)

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("PATCH /communities/{communityID}/channels/{channelID}/messages/{messageID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		channelID, ok := handlers.ValidateID(w, r.PathValue("channelID"), "Channel")
		if !ok {
			return
		}

		messageID, ok := handlers.ValidateID(w, r.PathValue("messageID"), "Message")
		if !ok {
			return
		}

		var req schemas.MessageRequest
		if !handlers.DecodeJSON(w, r, &req) {
			return
		}

		message, err := handlers.GetChannelMessage(communityID, channelID, messageID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Message not found.")
			return
		}

		currentUserID := r.Header.Get("X-User-ID")

		if message.SenderID != currentUserID {
			handlers.WriteErrorResponse(w, http.StatusForbidden, "You cant edit messages that you dont own")
			return
		}

		_, err = database.DB.Exec(
			"UPDATE channel_messages SET message = $1, is_edited = true WHERE community_id = $2 AND channel_id = $3 AND id = $4", req.Message, communityID, channelID, messageID,
		)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to update message")
			return
		}

		ws.Manager.BroadcastToCommunity(communityID, map[string]any{
			"type":     "channelMessageEdited",
			"id":       messageID,
			"message":  req.Message,
			"isEdited": true,
		})

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("DELETE /communities/{communityID}/channels/{channelID}/messages/{messageID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		channelID, ok := handlers.ValidateID(w, r.PathValue("channelID"), "Channel")
		if !ok {
			return
		}

		messageID, ok := handlers.ValidateID(w, r.PathValue("messageID"), "Message")
		if !ok {
			return
		}

		currentUserID := r.Header.Get("X-User-ID")

		message, err := handlers.GetChannelMessage(communityID, channelID, messageID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Message not found.")
			return
		}

		if message.SenderID != currentUserID {
			handlers.WriteErrorResponse(w, http.StatusForbidden, "You cant delete messages that you dont own")
			return
		}

		_, err = database.DB.Exec(
			"DELETE FROM channel_messages WHERE community_id = $1 AND channel_id = $2 AND id = $3", communityID, channelID, messageID,
		)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to delete message.")
			return
		}

		ws.Manager.BroadcastToCommunity(communityID, map[string]any{
			"type": "channelMessageDeleted",
			"id":   messageID,
		})

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("GET /communities/{communityID}/channels/{channelID}/messages", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		channelID, ok := handlers.ValidateID(w, r.PathValue("channelID"), "Channel")
		if !ok {
			return
		}

		limit := r.URL.Query().Get("limit")
		offset := r.URL.Query().Get("offset")

		var totalCount int
		err := database.DB.QueryRow(`
			SELECT COUNT (*) FROM channel_messages WHERE community_id = $1 AND channel_id = $2
		`, communityID, channelID).Scan(&totalCount)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to count messages.")
			return
		}

		rows, err := database.DB.Query(`
			SELECT 
				cm.id,
				cm.sender_id,
				cm.channel_id,
				cm.message,
				cm.is_edited,
				cm.created_at,
				cm.reply_to_id,
				u.username,
				u.image,
				rm.message,
				ru.username,
				ru.image
			FROM channel_messages cm
			JOIN users u ON u.id = cm.sender_id
			LEFT JOIN channel_messages rm ON rm.id = cm.reply_to_id
			LEFT JOIN users ru ON ru.id = rm.sender_id
			WHERE cm.community_id = $1 AND cm.channel_id = $2
			ORDER BY cm.created_at DESC
			LIMIT $3 OFFSET $4
		`, communityID, channelID, limit, offset)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to fetch messages.")
			return
		}

		defer rows.Close()

		var messages []map[string]any
		for rows.Next() {
			var message models.ChannelMessage
			rows.Scan(
				&message.ID, &message.SenderID, &message.ChannelID,
				&message.Message, &message.IsEdited, &message.CreatedAt,
				&message.ReplyToID, &message.SenderUsername, &message.SenderImage,
				&message.ReplyToMessage, &message.ReplyToUsername, &message.ReplyToImage,
			)
			messages = append(messages, map[string]any{
				"id":              message.ID,
				"senderId":        message.SenderID,
				"channelId":       message.ChannelID,
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

		for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
			messages[i], messages[j] = messages[j], messages[i]
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

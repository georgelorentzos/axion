package routes

import (
	"axion/constants"
	"axion/database"
	"axion/handlers"
	"axion/middleware"
	"axion/models"
	ws "axion/websocket"
	"encoding/json"
	"net/http"
	"path/filepath"
)

func CommunityRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /communities", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		currentUser, err := handlers.GetUser(r.Header.Get("X-User-ID"))

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
			return
		}

		r.ParseMultipartForm(10 << 20)

		name, ok := handlers.ValidateName(w, r.FormValue("name"), "Community", 32)
		if !ok {
			return
		}

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

		tx, err := database.DB.Begin()

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to start transaction.")
			return
		}

		communityID := database.GenerateID(20)
		memberID := database.GenerateID(20)
		categoryID := database.GenerateID(20)
		channelID := database.GenerateID(20)

		tx.Exec("INSERT INTO communities (id, name, image, owner_id) VALUES ($1, $2, $3, $4)",
			communityID, name, imagePath, currentUser.ID,
		)
		tx.Exec("INSERT INTO community_members (id, user_id, community_id, role) VALUES ($1, $2, $3, 'owner')",
			memberID, currentUser.ID, communityID,
		)
		tx.Exec("INSERT INTO community_categories (id, name, community_id) VALUES ($1, $2, $3)",
			categoryID, "Text Channels", communityID,
		)
		tx.Exec("INSERT INTO community_channels (id, name, type, community_id, category_id) VALUES ($1, $2, $3, $4, $5)",
			channelID, "general", constants.CHANNEL_TEXT, communityID, categoryID,
		)

		err = tx.Commit()

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create community.")
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"id":      communityID,
			"name":    name,
			"image":   imagePath,
		})
	}))

	mux.HandleFunc("PATCH /communities/{communityID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		r.ParseMultipartForm(10 << 20)

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
				[]string{constants.ADMINISTRATOR, constants.MANAGE_COMMUNITY},
				w,
			)

			if !ok {
				handlers.WriteErrorResponse(w, http.StatusForbidden, "You dont have permission.")
				return
			}
		}

		name := r.FormValue("name")
		if name == "" {
			handlers.WriteErrorResponse(w, http.StatusBadRequest, "Community name is required.")
			return
		}

		if community.Name != name {
			_, err = database.DB.Exec(
				"UPDATE communities SET name = $1 WHERE id = $2", name, communityID,
			)

			if err != nil {
				handlers.WriteErrorResponse(w, http.StatusBadRequest, "Failed to update community name.")
				return
			}

			err = handlers.CreateLog(communityID, currentUser.ID, currentUser.Username+" updated community name to "+name, nil)

			if err != nil {
				handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create log.")
				return
			}
		}

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

			_, err = database.DB.Exec(
				"UPDATE communities SET image = $1 WHERE id = $2", imagePath, communityID,
			)

			if err != nil {
				handlers.WriteErrorResponse(w, http.StatusBadRequest, "Failed to update community image.")
				return
			}

			err = handlers.CreateLog(communityID, currentUser.ID, currentUser.Username+" updated community image", nil)

			if err != nil {
				handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create log.")
				return
			}
		}

		oldImage := community.Image
		finalImage := imagePath
		if finalImage == nil {
			finalImage = oldImage
		}

		ws.Manager.BroadcastToCommunity(communityID, map[string]any{
			"type":  "communityUpdated",
			"id":    communityID,
			"name":  name,
			"image": finalImage,
		})

		json.NewEncoder(w).Encode(map[string]any{
			"success":   true,
			"id":        communityID,
			"name":      name,
			"image":     finalImage,
			"ownerId":   community.OwnerID,
			"createdAt": community.CreatedAt.Format("2006"),
		})
	}))

	mux.HandleFunc("POST /communities/{communityID}/join", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
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

		ban, err := handlers.GetCommunityBan(communityID, currentUser.ID)

		if err == nil {
			reason := "You have been banned"
			if ban.Reason != nil {
				reason = *ban.Reason
			}
			handlers.WriteErrorResponse(w, http.StatusUnauthorized, reason)
			return
		}

		_, err = handlers.GetCommunityMember(communityID, currentUser.ID)

		if err == nil {
			w.WriteHeader(200)
			json.NewEncoder(w).Encode(map[string]any{
				"success": true,
				"id":      communityID,
			})
			return
		}

		memberID := database.GenerateID(20)
		_, err = database.DB.Exec(
			"INSERT INTO community_members (id, user_id, community_id) VALUES ($1, $2, $3)",
			memberID, currentUser.ID, communityID,
		)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusBadRequest, "Failed to join community.")
			return
		}

		ws.Manager.BroadcastToCommunity(communityID, map[string]any{
			"type":      "memberJoined",
			"id":        currentUser.ID,
			"username":  currentUser.Username,
			"image":     currentUser.Image,
			"isOnline":  currentUser.IsOnline,
			"createdAt": currentUser.CreatedAt,
		})

		json.NewEncoder(w).Encode(map[string]any{
			"success":   true,
			"id":        communityID,
			"name":      community.Name,
			"image":     community.Image,
			"ownerId":   community.OwnerID,
			"createdAt": community.CreatedAt,
		})
	}))

	mux.HandleFunc("DELETE /communities/{communityID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		community, err := handlers.GetCommunity(communityID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Community not found.")
			return
		}

		currentUserID := r.Header.Get("X-User-ID")

		if community.OwnerID == currentUserID {

			tx, err := database.DB.Begin()
			if err != nil {
				handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to start transaction.")
				return
			}

			tx.Exec(`
				DELETE FROM member_roles
				WHERE member_id IN (
					SELECT id FROM community_members WHERE community_id = $1
				)
			`, community.ID)
			tx.Exec("DELETE FROM community_members WHERE community_id = $1", community.ID)
			tx.Exec("DELETE FROM community_logs WHERE community_id = $1", community.ID)
			tx.Exec("DELETE FROM community_channels WHERE community_id = $1", community.ID)
			tx.Exec("DELETE FROM community_categories WHERE community_id = $1", community.ID)
			tx.Exec("DELETE FROM community_roles WHERE community_id = $1", community.ID)
			tx.Exec("DELETE FROM community_bans WHERE community_id = $1", community.ID)
			tx.Exec("DELETE FROM communities WHERE id = $1", community.ID)
			err = tx.Commit()

			if err != nil {
				handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to delete community.")
				return
			}

			if community.Image != nil && *community.Image != "" {
				handlers.DeleteFile(*community.Image)
			}

			ws.Manager.BroadcastToCommunity(community.ID, map[string]any{
				"type": "communityDeleted",
				"id":   community.ID,
			})
		} else {

			tx, err := database.DB.Begin()
			if err != nil {
				handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to start transaction.")
				return
			}

			tx.Exec(`
				DELETE FROM member_roles
				WHERE member_id = (
					SELECT id FROM community_members
					WHERE community_id = $1 AND user_id = $2
				)
			`, community.ID, currentUserID)
			tx.Exec(`
				DELETE FROM community_members
				WHERE community_id = $1 AND user_id = $2
			`, community.ID, currentUserID)
			err = tx.Commit()

			if err != nil {
				handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to leave community.")
				return
			}

			ws.Manager.BroadcastToCommunity(community.ID, map[string]any{
				"type": "memberLeft",
				"id":   community.ID,
			})
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"id":      community.ID,
		})
	}))

	mux.HandleFunc("DELETE /communities/{communityID}/image", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		community, err := handlers.GetCommunity(communityID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Community not found.")
			return
		}

		currentUserID := r.Header.Get("X-User-ID")

		if community.OwnerID != currentUserID {
			ok := handlers.CheckPermissions(
				currentUserID,
				community.ID,
				[]string{constants.ADMINISTRATOR, constants.MANAGE_COMMUNITY},
				w,
			)

			if !ok {
				handlers.WriteErrorResponse(w, http.StatusUnauthorized, "You dont have permission.")
				return
			}
		}

		if community.Image != nil && *community.Image != "" {
			handlers.DeleteFile(*community.Image)
		}

		_, err = database.DB.Exec(
			"UPDATE communities SET image = NULL WHERE id = $1", community.ID,
		)
		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusBadRequest, "Failed to remove image.")
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("GET /communities/{communityID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		community, err := handlers.GetCommunity(communityID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Community not found.")
			return
		}

		var totalMembers int
		err = database.DB.QueryRow(
			"SELECT COUNT(*) FROM community_members WHERE community_id = $1", community.ID,
		).Scan(&totalMembers)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to count members.")
			return
		}

		var onlineMembers int
		err = database.DB.QueryRow(`
        	SELECT COUNT(*) FROM community_members m
        	JOIN users u ON u.id = m.user_id
        	WHERE m.community_id = $1 AND u.is_online = true
    	`, community.ID).Scan(&onlineMembers)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to count online members.")
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success":       true,
			"id":            community.ID,
			"name":          community.Name,
			"image":         community.Image,
			"ownerId":       community.OwnerID,
			"totalMembers":  totalMembers,
			"onlineMembers": onlineMembers,
			"createdAt":     community.CreatedAt.Format("2006"),
		})
	}))

	mux.HandleFunc("GET /communities", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		currentUserID := r.Header.Get("X-User-ID")

		rows, err := database.DB.Query(`
			SELECT c.id, c.name, c.image, c.owner_id FROM communities c
			JOIN community_members m ON c.id = m.community_id
			WHERE m.user_id = $1
		`, currentUserID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to get communities.")
			return
		}

		defer rows.Close()

		var communities []map[string]any
		for rows.Next() {
			var community models.Community
			rows.Scan(&community.ID, &community.Name, &community.Image, &community.OwnerID)
			communities = append(communities, map[string]any{
				"id":      community.ID,
				"name":    community.Name,
				"image":   community.Image,
				"ownerId": community.OwnerID,
			})
		}

		if communities == nil {
			communities = []map[string]any{}
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success":     true,
			"communities": communities,
		})
	}))
}

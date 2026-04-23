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
)

func BanRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /communities/{communityID}/bans/{userID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		userID, ok := handlers.ValidateID(w, r.PathValue("userID"), "User")
		if !ok {
			return
		}

		var req schemas.BanRequest
		if !handlers.DecodeJSON(w, r, &req) {
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

		user, err := handlers.GetUser(userID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
			return
		}

		if community.OwnerID != currentUser.ID {
			ok := handlers.CheckPermissions(
				currentUser.ID,
				community.ID,
				[]string{constants.ADMINISTRATOR, constants.BAN},
				w,
			)

			if !ok {
				handlers.WriteErrorResponse(w, http.StatusUnauthorized, "You dont have permission.")
				return
			}
		}

		member, err := handlers.GetCommunityMember(communityID, userID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Member not found.")
			return
		}

		tx, err := database.DB.Begin()

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to start transaction.")
			return
		}

		tx.Exec(
			"INSERT INTO community_bans (id, community_id, user_id, reason) VALUES ($1, $2, $3, $4)",
			database.GenerateID(20), communityID, userID, req.Reason,
		)
		tx.Exec(
			"DELETE FROM member_roles WHERE member_id = $1", member.ID,
		)
		tx.Exec(
			"DELETE FROM community_members WHERE community_id = $1 AND user_id = $2",
			communityID, userID,
		)
		err = tx.Commit()

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to ban member.")
			return
		}

		err = services.CreateLog(communityID, userID, currentUser.Username+" banned "+user.Username, nil)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create log.")
			return
		}

		ws.Manager.BroadcastToUser(userID, map[string]any{
			"type": "memberBanned",
			"id":   communityID,
		})

		ws.Manager.BroadcastToCommunity(communityID, map[string]any{
			"type": "memberLeft",
			"id":   member.ID,
		})

		ws.Manager.BroadcastToCommunity(communityID, map[string]any{
			"type":      "newBan",
			"id":        user.ID,
			"username":  user.Username,
			"image":     user.Image,
			"reason":    req.Reason,
			"createdAt": user.CreatedAt.Format("Mon 15:04"),
		})

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("DELETE /communities/{communityID}/bans/{userID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		userID, ok := handlers.ValidateID(w, r.PathValue("userID"), "User")
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

		user, err := handlers.GetUser(userID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
			return
		}

		if community.OwnerID != currentUser.ID {
			ok := handlers.CheckPermissions(
				currentUser.ID,
				community.ID,
				[]string{constants.ADMINISTRATOR, constants.BAN},
				w,
			)

			if !ok {
				handlers.WriteErrorResponse(w, http.StatusUnauthorized, "You dont have permission.")
				return
			}
		}

		_, err = database.DB.Exec(
			"DELETE FROM community_bans WHERE community_id = $1 AND user_id = $2", community.ID, user.ID,
		)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to unban user.")
			return
		}

		err = services.CreateLog(communityID, userID, currentUser.Username+" unbanned "+user.Username, nil)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create log.")
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"id":      user.ID,
		})
	}))

	mux.HandleFunc("GET /communities/{communityID}/bans", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")

		if !ok {
			return
		}

		currentUserID := r.Header.Get("X-User-ID")

		community, err := handlers.GetCommunity(communityID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Community not found.")
			return
		}

		if community.OwnerID != currentUserID {
			ok := handlers.CheckPermissions(
				currentUserID,
				community.ID,
				[]string{constants.ADMINISTRATOR, constants.BAN},
				w,
			)

			if !ok {
				handlers.WriteErrorResponse(w, http.StatusUnauthorized, "You dont have permission.")
				return
			}
		}

		rows, err := database.DB.Query(`
			SELECT 
				cb.user_id,
				u.username,
				u.image,
				cb.reason,
				cb.created_at
			FROM community_bans cb
			JOIN users u ON u.id = cb.user_id
			WHERE cb.community_id = $1
		`, communityID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to fetch community bans.")
			return
		}

		defer rows.Close()

		var bans []map[string]any

		for rows.Next() {
			var ban models.CommunityBan
			var user models.User
			rows.Scan(&ban.UserID, &user.Username, &user.Image, &ban.Reason, &ban.CreatedAt)
			bans = append(bans, map[string]any{
				"id":        ban.UserID,
				"username":  user.Username,
				"image":     user.Image,
				"reason":    ban.Reason,
				"createdAt": ban.CreatedAt.Format("Mon 15:04"),
			})
		}

		if bans == nil {
			bans = []map[string]any{}
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"bans":    bans,
		})
	}))
}

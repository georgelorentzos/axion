package routes

import (
	"axion/constants"
	"axion/database"
	"axion/handlers"
	"axion/middleware"
	"axion/models"
	"axion/schemas"
	ws "axion/websocket"
	"encoding/json"
	"net/http"
)

func MemberRoutes(mux *http.ServeMux) {
	mux.HandleFunc("DELETE /communities/{communityID}/members/{userID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		userID, ok := handlers.ValidateID(w, r.PathValue("userID"), "User")
		if !ok {
			return
		}

		var req schemas.KickRequest
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

		if community.OwnerID == user.ID {
			handlers.WriteErrorResponse(w, http.StatusForbidden, "You cant kick server owner.")
			return
		}

		if community.OwnerID != currentUser.ID {
			ok := handlers.CheckPermissions(
				currentUser.ID,
				community.ID,
				[]string{constants.ADMINISTRATOR, constants.KICK},
				w,
			)

			if !ok {
				handlers.WriteErrorResponse(w, http.StatusForbidden, "You dont have permission.")
				return
			}
		}

		member, err := handlers.GetCommunityMember(community.ID, user.ID)

		tx, err := database.DB.Begin()
		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to start transaction.")
			return
		}
		tx.Exec(
			"DELETE FROM member_roles WHERE member_id = $1", member.ID,
		)
		tx.Exec(
			"DELETE FROM community_members WHERE community_id = $1 AND user_id = $2",
			community.ID, user.ID,
		)
		err = tx.Commit()

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to kick member.")
			return
		}

		ws.Manager.BroadcastToUser(user.ID, map[string]any{
			"type": "memberKicked",
			"id":   community.ID,
		})

		err = handlers.CreateLog(community.ID, currentUser.ID, currentUser.Username+" kicked "+user.Username, &req.Reason)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create log.")
			return
		}

		ws.Manager.BroadcastToCommunity(community.ID, map[string]any{
			"type": "memberLeft",
			"id":   user.ID,
		})

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("PATCH /communities/{communityID}/members/{userID}/roles/{roleID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		userID, ok := handlers.ValidateID(w, r.PathValue("userID"), "User")
		if !ok {
			return
		}

		roleID, ok := handlers.ValidateID(w, r.PathValue("roleID"), "Role")
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
				[]string{constants.ADMINISTRATOR, constants.MANAGE_ROLES},
				w,
			)
			if !ok {
				return
			}
		}

		member, err := handlers.GetCommunityMember(community.ID, userID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Member not found.")
			return
		}

		role, err := handlers.GetCommunityRole(community.ID, roleID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Role not found.")
			return
		}

		err = handlers.ToggleMemberRole(
			community.ID, member.ID, role.ID, role.Name,
			currentUser.ID, currentUser.Username, user.Username,
		)
		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to toggle role.")
			return
		}

		rows, err := database.DB.Query(`
			SELECT cr.id, cr.name, cr.color 
			FROM member_roles mr
			JOIN community_roles cr ON cr.id = mr.role_id
			WHERE mr.member_id = $1
		`, member.ID)
		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to get roles")
			return
		}
		defer rows.Close()

		var roles []map[string]any
		for rows.Next() {
			var role models.CommunityRole
			rows.Scan(&role.ID, &role.Name, &role.Color)
			roles = append(roles, map[string]any{
				"id":    role.ID,
				"name":  role.Name,
				"color": role.Color,
			})
		}

		if roles == nil {
			roles = []map[string]any{}
		}

		ws.Manager.BroadcastToUser(userID, map[string]any{
			"type":        "permissionsUpdated",
			"communityId": community.ID,
		})

		ws.Manager.BroadcastToCommunity(community.ID, map[string]any{
			"type":  "memberRolesUpdated",
			"id":    userID,
			"roles": roles,
		})

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("GET /communities/{communityID}/members", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		rows, err := database.DB.Query(`
			SELECT 
				u.id,
				u.username,
				u.image,
				u.is_online,
				u.created_at,
				r.id,
				r.name,
				r.color
			FROM community_members m 
			JOIN users u ON u.id = m.user_id
			LEFT JOIN member_roles mr ON mr.member_id = m.id
			LEFT JOIN community_roles r ON r.id = mr.role_id
			WHERE m.community_id = $1
		`, communityID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Invalid community.")
			return
		}

		defer rows.Close()

		memberMap := map[string]map[string]any{}

		for rows.Next() {
			var member models.User
			var roleID *string
			var roleName *string
			var roleColor *string

			err := rows.Scan(
				&member.ID,
				&member.Username,
				&member.Image,
				&member.IsOnline,
				&member.CreatedAt,
				&roleID,
				&roleName,
				&roleColor,
			)
			if err != nil {
				handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to scan member data.")
				return
			}

			if _, exists := memberMap[member.ID]; !exists {
				memberMap[member.ID] = map[string]any{
					"id":        member.ID,
					"username":  member.Username,
					"image":     member.Image,
					"isOnline":  member.IsOnline,
					"createdAt": member.CreatedAt,
					"roles":     []map[string]any{},
				}
			}

			if roleID != nil {
				memberMap[member.ID]["roles"] = append(
					memberMap[member.ID]["roles"].([]map[string]any),
					map[string]any{
						"id":    roleID,
						"name":  roleName,
						"color": roleColor,
					},
				)
			}
		}

		var members []map[string]any
		for _, m := range memberMap {
			members = append(members, m)
		}

		if members == nil {
			members = []map[string]any{}
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"members": members,
		})
	}))
}

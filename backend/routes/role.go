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
	"strings"
)

func RoleRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /communities/{communityID}/roles", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		currentUser, err := handlers.GetUser(r.Header.Get("X-User-ID"))

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
			return
		}

		var req schemas.RoleRequest
		if !handlers.DecodeJSON(w, r, &req) {
			return
		}

		roleName, ok := handlers.ValidateName(w, req.Name, "Role", 20)
		if !ok {
			return
		}

		community, err := handlers.GetCommunity(communityID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Community not found.")
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
				handlers.WriteErrorResponse(w, http.StatusUnauthorized, "You dont have permission.")
				return
			}
		}

		var perms []string
		if req.Permissions != "" {
			perms = strings.Split(req.Permissions, "|")
		}
		permsJSON, err := json.Marshal(perms)
		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to process permissions.")
			return
		}

		var roleID = database.GenerateID(20)
		_, err = database.DB.Exec(
			"INSERT INTO community_roles (id, name, color, permissions, community_id) VALUES ($1, $2, $3, $4, $5)",
			roleID, roleName, req.Color, permsJSON, community.ID,
		)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create role.")
			return
		}

		err = handlers.CreateLog(community.ID, currentUser.ID, currentUser.Username+" created the role "+roleName, nil)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create log.")
			return
		}

		ws.Manager.BroadcastToCommunity(community.ID, map[string]any{
			"type":        "roleCreated",
			"id":          roleID,
			"name":        roleName,
			"color":       req.Color,
			"permissions": perms,
		})

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("PATCH /communities/{communityID}/roles/{roleID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		roleID, ok := handlers.ValidateID(w, r.PathValue("roleID"), "Role")
		if !ok {
			return
		}

		var req schemas.RoleRequest
		if !handlers.DecodeJSON(w, r, &req) {
			return
		}

		roleName, ok := handlers.ValidateName(w, req.Name, "Role", 20)
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
				[]string{constants.ADMINISTRATOR, constants.MANAGE_ROLES},
				w,
			)

			if !ok {
				handlers.WriteErrorResponse(w, http.StatusUnauthorized, "You dont have permission.")
				return
			}
		}

		var perms []string
		if req.Permissions != "" {
			perms = strings.Split(req.Permissions, "|")
		}
		permsJSON, err := json.Marshal(perms)
		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to process permissions.")
			return
		}

		_, err = database.DB.Exec(
			"UPDATE community_roles SET name = $1, color = $2, permissions = $3 WHERE community_id = $4 AND id = $5",
			roleName, req.Color, permsJSON, community.ID, roleID,
		)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to update role.")
			return
		}

		err = handlers.CreateLog(community.ID, currentUser.ID, currentUser.Username+" updated the role "+roleName, nil)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create log.")
			return
		}

		ws.Manager.BroadcastToCommunity(community.ID, map[string]any{
			"type":        "roleUpdated",
			"id":          roleID,
			"name":        roleName,
			"color":       req.Color,
			"permissions": perms,
		})

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("DELETE /communities/{communityID}/roles/{roleID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
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

		if community.OwnerID != currentUser.ID {
			ok := handlers.CheckPermissions(
				currentUser.ID,
				community.ID,
				[]string{constants.ADMINISTRATOR, constants.MANAGE_ROLES},
				w,
			)

			if !ok {
				handlers.WriteErrorResponse(w, http.StatusUnauthorized, "You dont have permission.")
				return
			}
		}

		role, err := handlers.GetCommunityRole(community.ID, roleID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Role not found.")
			return
		}

		_, err = database.DB.Exec(
			"DELETE FROM community_roles WHERE community_id = $1 AND id = $2",
			community.ID, role.ID,
		)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to delete role.")
			return
		}

		err = handlers.CreateLog(community.ID, currentUser.ID, currentUser.Username+" deleted the role "+role.Name, nil)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create log.")
			return
		}

		ws.Manager.BroadcastToCommunity(community.ID, map[string]any{
			"type": "roleDeleted",
			"id":   role.ID,
		})

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
		})
	}))

	mux.HandleFunc("GET /communities/{communityID}/roles", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		rows, err := database.DB.Query(`
			SELECT id, name, color, permissions
			FROM community_roles
			WHERE community_id = $1
			ORDER BY created_at ASC
		`, communityID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to get roles.")
			return
		}

		defer rows.Close()

		var roles []map[string]any

		for rows.Next() {
			var role models.CommunityRole
			rows.Scan(&role.ID, &role.Name, &role.Color, &role.Permissions)

			var perms any
			if err := json.Unmarshal([]byte(role.Permissions), &perms); err != nil {
				return
			}

			roles = append(roles, map[string]any{
				"id":          role.ID,
				"name":        role.Name,
				"color":       role.Color,
				"permissions": perms,
			})
		}

		if roles == nil {
			roles = []map[string]any{}
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"roles":   roles,
		})
	}))
}

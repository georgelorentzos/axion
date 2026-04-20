package routes

import (
	"axion/database"
	"axion/handlers"
	"axion/middleware"
	"encoding/json"
	"net/http"
)

func PermissionRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /communities/{communityID}/permissions", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		currentUserID := r.Header.Get("X-User-ID")

		member, err := handlers.GetCommunityMember(communityID, currentUserID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Member not found.")
			return
		}

		rows, err := database.DB.Query(`
			SELECT cr.permissions
			FROM community_roles cr
			JOIN member_roles mr ON mr.role_id = cr.id
			WHERE mr.member_id = $1
			AND cr.community_id = $2
		`, member.ID, communityID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to get permissions.")
			return
		}

		defer rows.Close()

		permMap := make(map[string]bool)

		for rows.Next() {
			var rawPermissions []byte

			if err := rows.Scan(&rawPermissions); err != nil {
				handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Error reading permissions.")
				return
			}

			var perms []string
			if err := json.Unmarshal(rawPermissions, &perms); err != nil {
				handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Error parsing permissions.")
				return
			}

			for _, p := range perms {
				permMap[p] = true
			}
		}

		permissions := make([]string, 0, len(permMap))
		for p := range permMap {
			permissions = append(permissions, p)
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success":     true,
			"communityId": communityID,
			"userId":      currentUserID,
			"permissions": permissions,
		})
	}))
}

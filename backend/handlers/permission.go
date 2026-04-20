package handlers

import (
	"axion/database"
	"encoding/json"
	"net/http"
)

func CheckPermissions(userID string, communityID string, permissions []string, w http.ResponseWriter) bool {
	var memberID string
	err := database.DB.QueryRow(
		"SELECT id FROM community_members WHERE user_id = $1 AND community_id = $2",
		userID, communityID,
	).Scan(&memberID)

	if err != nil {
		w.WriteHeader(403)
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"detail":  "Not a member of this community.",
		})
		return false
	}

	rows, err := database.DB.Query(`
		SELECT cr.permissions FROM community_roles cr
		JOIN member_roles mr ON mr.role_id = cr.id
		WHERE cr.community_id = $1 AND mr.member_id = $2
	`, communityID, memberID)

	if err != nil {
		w.WriteHeader(500)
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"detail":  "Failed to fetch permissions.",
		})
		return false
	}

	defer rows.Close()

	var allPermissions []string
	for rows.Next() {
		var permJSON string

		if err := rows.Scan(&permJSON); err != nil {
			continue
		}

		var perms []string
		if err := json.Unmarshal([]byte(permJSON), &perms); err != nil {
			continue
		}

		allPermissions = append(allPermissions, perms...)
	}

	hasPermission := false
	for _, userPerm := range allPermissions {
		for _, required := range permissions {
			if userPerm == required {
				hasPermission = true
				break
			}
		}
		if hasPermission {
			break
		}
	}

	return hasPermission
}

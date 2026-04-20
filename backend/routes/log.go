package routes

import (
	"axion/constants"
	"axion/database"
	"axion/handlers"
	"axion/middleware"
	"axion/models"
	"encoding/json"
	"net/http"
)

func LogRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /communities/{communityID}/logs", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
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
				[]string{constants.ADMINISTRATOR, constants.VIEW_LOGS},
				w,
			)

			if !ok {
				handlers.WriteErrorResponse(w, http.StatusForbidden, "You dont have permission.")
				return
			}
		}

		rows, err := database.DB.Query(`
			SELECT cl.title, u.image, cl.note, cl.created_at
			FROM community_logs cl
			LEFT JOIN users u ON cl.user_id = u.id
			WHERE cl.community_id = $1
			ORDER BY cl.created_at ASC
		`, community.ID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to get logs.")
			return
		}

		defer rows.Close()

		var logs []map[string]any

		for rows.Next() {
			var log models.CommunityLog
			var userImage string

			rows.Scan(&log.Title, &userImage, &log.Note, &log.CreatedAt)
			logs = append(logs, map[string]any{
				"title":     log.Title,
				"note":      log.Note,
				"image":     userImage,
				"createdAt": log.CreatedAt.Format("Mon 15:04"),
			})
		}

		if logs == nil {
			logs = []map[string]any{}
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"logs":    logs,
		})
	}))
}

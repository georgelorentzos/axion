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

func CategoryRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /communities/{communityID}/categories", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		var req schemas.CategoryRequest
		if !handlers.DecodeJSON(w, r, &req) {
			return
		}

		categoryName, ok := handlers.ValidateName(w, req.CategoryName, "Category", 32)
		if !ok {
			return
		}

		currentUser, err := handlers.GetUser(r.Header.Get("X-User-ID"))

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
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
				[]string{constants.ADMINISTRATOR, constants.MANAGE_CHANNELS},
				w,
			)

			if !ok {
				handlers.WriteErrorResponse(w, http.StatusUnauthorized, "You dont have permission.")
				return
			}
		}

		categoryID := database.GenerateID(20)
		_, err = database.DB.Exec(`
			INSERT INTO community_categories (id, name, community_id)
			VALUES ($1, $2, $3)
		`, categoryID, categoryName, community.ID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create category.")
			return
		}

		ws.Manager.BroadcastToCommunity(community.ID, map[string]any{
			"type": "categoryCreated",
			"id":   categoryID,
			"name": categoryName,
		})

		err = services.CreateLog(community.ID, currentUser.ID, currentUser.Username+" created the category "+categoryName, nil)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create log.")
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"id":      categoryID,
			"name":    categoryName,
		})
	}))

	mux.HandleFunc("DELETE /communities/{communityID}/categories/{categoryID}", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		categoryID, ok := handlers.ValidateID(w, r.PathValue("categoryID"), "Category")
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

		category, err := handlers.GetCommunityCategory(community.ID, categoryID)
		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Category not found.")
			return
		}

		_, err = database.DB.Exec(`
			DELETE FROM community_categories WHERE community_id = $1 AND id = $2
		`, community.ID, category.ID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusBadRequest, "Failed to delete category (invalid community or category id).")
			return
		}

		ws.Manager.BroadcastToCommunity(community.ID, map[string]any{
			"type": "categoryDeleted",
			"id":   category.ID,
		})

		err = services.CreateLog(community.ID, currentUser.ID, currentUser.Username+" deleted the category "+category.Name, nil)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create log.")
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"id":      category.ID,
		})
	}))

	mux.Handle("GET /communities/{communityID}/categories", middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		communityID, ok := handlers.ValidateID(w, r.PathValue("communityID"), "Community")
		if !ok {
			return
		}

		rows, err := database.DB.Query(`
			SELECT c.id, c.name
			FROM community_categories c
			JOIN communities cm ON cm.id = c.community_id
			WHERE cm.id = $1
		`, communityID)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to fetch categories.")
			return
		}

		defer rows.Close()

		var categories []map[string]any

		for rows.Next() {
			var category models.CommunityCategory
			rows.Scan(&category.ID, &category.Name)
			categories = append(categories, map[string]any{
				"id":   category.ID,
				"name": category.Name,
			})
		}

		if categories == nil {
			categories = []map[string]any{}
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success":    true,
			"categories": categories,
		})
	}))
}

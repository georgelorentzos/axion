package handlers

import (
	"encoding/json"
	"net/http"
)

func WriteErrorResponse(w http.ResponseWriter, statusCode int, detail string) {
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]any{
		"success": false,
		"detail":  detail,
	})
}

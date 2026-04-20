package handlers

import (
	"encoding/json"
	"net/http"
)

func DecodeJSON(w http.ResponseWriter, r *http.Request, req interface{}) bool {
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		WriteErrorResponse(w, http.StatusBadRequest, "Invalid request body.")
		return false
	}
	return true
}

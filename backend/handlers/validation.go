package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"unicode"
)

func ValidateID(w http.ResponseWriter, id string, name string) (string, bool) {
	if id == "" {
		WriteErrorResponse(w, http.StatusBadRequest, name+" id is required.")
		return "", false
	}

	if len(id) != 20 {
		WriteErrorResponse(w, http.StatusBadRequest, name+" id must be exactly 20 digits.")
		return "", false
	}

	for _, c := range id {
		if !unicode.IsDigit(c) {
			WriteErrorResponse(w, http.StatusBadRequest, name+" id must contain only numbers.")
			return "", false
		}
	}

	return id, true
}

func ValidateName(w http.ResponseWriter, name string, label string, max int) (string, bool) {
	name = strings.TrimSpace(name)
	if len(name) < 1 {
		WriteErrorResponse(w, http.StatusBadRequest, label+" name must be at least 1 character.")
		return "", false
	}
	if len(name) > max {
		WriteErrorResponse(w, http.StatusBadRequest, label+" name can't be longer than "+strconv.Itoa(max)+" characters.")
		return "", false
	}
	return name, true
}

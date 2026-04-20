package middleware

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt"
)

func Auth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")

		if header == "" {
			w.WriteHeader(401)
			json.NewEncoder(w).Encode(map[string]any{
				"success": false,
				"detail":  "Not authenticated.",
			})
			return
		}

		tokenString := strings.TrimPrefix(header, "Bearer ")
		jwtToken, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !jwtToken.Valid {
			detail := "Invalid token."
			if ve, ok := err.(*jwt.ValidationError); ok {
				if ve.Errors&jwt.ValidationErrorExpired != 0 {
					detail = "Token has expired."
				}
			}
			w.WriteHeader(401)
			json.NewEncoder(w).Encode(map[string]any{
				"success": false,
				"detail":  detail,
			})
			return
		}

		claims := jwtToken.Claims.(jwt.MapClaims)
		userID, ok := claims["user_id"].(string)
		if !ok || userID == "" {
			w.WriteHeader(401)
			json.NewEncoder(w).Encode(map[string]any{
				"success": false,
				"detail":  "Invalid token.",
			})
			return
		}

		r.Header.Set("X-User-ID", userID)
		next(w, r)
	}
}

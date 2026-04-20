package routes

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt"

	"axion/database"
	"axion/handlers"
	"axion/mail"
	"axion/models"
	"axion/schemas"
)

func AuthRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /auth", func(w http.ResponseWriter, r *http.Request) {
		var req schemas.AuthRequest
		handlers.DecodeJSON(w, r, &req)

		if req.Email == "" {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to delete messages.")
			return
		}

		var userID string
		var isVerified bool
		err := database.DB.QueryRow(
			"SELECT id, is_verified FROM users WHERE email = $1", req.Email,
		).Scan(&userID, &isVerified)

		if err != nil {
			userID = database.GenerateID(20)
			username := strings.Split(req.Email, "@")[0]
			_, err = database.DB.Exec(
				"INSERT INTO users (id, username, email) VALUES ($1, $2, $3)",
				userID, username, req.Email,
			)
			if err != nil {
				handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create user.")
				return
			}
			isVerified = false
		}

		_, err = database.DB.Exec(
			"DELETE FROM tokens WHERE user_id = $1 AND type = 'Auth'", userID,
		)
		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusBadRequest, "Failed to delete token.")
			return
		}

		token := generateToken()
		tokenID := database.GenerateID(20)
		expiresAt := time.Now().Add(15 * time.Minute)

		_, err = database.DB.Exec(
			"INSERT INTO tokens (id, token, type, user_id, expires_at) VALUES ($1, $2, $3, $4, $5)",
			tokenID, token, "Auth", userID, expiresAt,
		)
		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusBadRequest, "Failed to create token.")
			return
		}

		var templatePath string
		var subject string
		if isVerified {
			templatePath = "mail/templates/sign-in.html"
			subject = "Sign In Link"
		} else {
			templatePath = "mail/templates/sign-up.html"
			subject = "Sign Up Link"
		}

		htmlBytes, err := os.ReadFile(templatePath)
		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusInternalServerError, "Failed to load template.")
			return
		}

		html := string(htmlBytes)
		html = strings.Replace(html, "{domain}", os.Getenv("DOMAIN"), 1)
		html = strings.Replace(html, "{token}", token, 1)

		go mail.Send(mail.SendMail{
			Recipient: req.Email,
			Subject:   subject,
			Message:   html,
		})

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"detail":  "Email sent successfully",
		})
	})

	mux.HandleFunc("POST /verify-token", func(w http.ResponseWriter, r *http.Request) {
		var req schemas.CreateToken
		handlers.DecodeJSON(w, r, &req)

		var token models.Token
		err := database.DB.QueryRow(
			"SELECT id, token, type, user_id, created_at, expires_at FROM tokens WHERE token = $1", req.Token,
		).Scan(&token.ID, &token.Token, &token.Type, &token.UserID, &token.CreatedAt, &token.ExpiresAt)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Invalid or expired token.")
			return
		}

		if token.Type != "Auth" {
			handlers.WriteErrorResponse(w, http.StatusBadRequest, "Invalid or expired token.")
			return
		}

		tokenAge := time.Now().UTC().Sub(token.CreatedAt)
		if tokenAge > 15*time.Minute {
			_, err = database.DB.Exec(
				"DELETE FROM tokens WHERE token = $1", token.Token,
			)

			if err != nil {
				handlers.WriteErrorResponse(w, http.StatusBadRequest, "Failed to delete token.")
				return
			}

			handlers.WriteErrorResponse(w, http.StatusUnauthorized, "Token has expired.")
			return
		}

		var isVerified bool
		err = database.DB.QueryRow(
			"SELECT is_verified FROM users WHERE id = $1", token.UserID,
		).Scan(&isVerified)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
			return
		}

		_, err = database.DB.Exec(
			"UPDATE users SET is_verified = TRUE WHERE id = $1", token.UserID,
		)
		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusBadRequest, "Failed to update user column.")
			return
		}

		_, err = database.DB.Exec("DELETE FROM tokens WHERE token = $1", token.Token)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusBadRequest, "Failed to delete token.")
			return
		}

		payload := map[string]any{
			"user_id": token.UserID,
			"exp":     time.Now().UTC().Add(7 * 24 * time.Hour).Unix(),
		}

		jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims(payload))
		jwtTokenString, err := jwtToken.SignedString([]byte(os.Getenv("JWT_SECRET")))
		if err != nil {
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"token":   jwtTokenString,
		})
	})

	mux.HandleFunc("POST /validate-token", func(w http.ResponseWriter, r *http.Request) {
		var req schemas.ValidateToken
		handlers.DecodeJSON(w, r, &req)

		jwtToken, err := jwt.Parse(req.Token, func(token *jwt.Token) (any, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !jwtToken.Valid {
			handlers.WriteErrorResponse(w, http.StatusUnauthorized, "Invalid or expired token.")
			return
		}

		claims := jwtToken.Claims.(jwt.MapClaims)
		userID := claims["user_id"].(string)

		var user models.User
		err = database.DB.QueryRow(
			"SELECT id, username, email FROM users WHERE id = $1", userID,
		).Scan(&user.ID, &user.Username, &user.Email)

		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "User not found.")
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success":  true,
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
		})
	})
}

func generateToken() string {
	b := make([]byte, 64)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

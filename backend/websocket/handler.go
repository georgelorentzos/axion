package websocket

import (
	"fmt"
	"net/http"
	"os"

	"github.com/golang-jwt/jwt"
	ws "github.com/gorilla/websocket"
)

var upgrader = ws.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	tokenString := r.URL.Query().Get("token")
	if tokenString == "" {
		http.Error(w, "No token", http.StatusUnauthorized)
		return
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	claims := token.Claims.(jwt.MapClaims)
	userID, ok := claims["user_id"].(string)
	if !ok || userID == "" {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Upgrade error:", err)
		return
	}

	if !Manager.Connect(conn, userID) {
		return
	}

	defer Manager.Disconnect(conn, userID)
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

package main

import (
	"fmt"
	"net/http"
	"os"

	// "axion/config"
	"axion/database"
	"axion/middleware"
	"axion/routes"
	"axion/schedulers"
	ws "axion/websocket"
)

func main() {
	// config.SetEnvVariables()
	os.MkdirAll(os.Getenv("UPLOADS_FOLDER"), 0755)
	database.Connect()
	database.CreateTables()
	schedulers.StartTokenCleanup()

	mux := http.NewServeMux()
	apiMux := http.NewServeMux()
	port := os.Getenv("SERVER_PORT")

	routes.AuthRoutes(apiMux)
	routes.UserRoutes(apiMux)
	routes.FileRoutes(apiMux)
	routes.FriendRoutes(apiMux)
	routes.PendingRoutes(apiMux)
	routes.MessageRoutes(apiMux)
	routes.ConversationRoutes(apiMux)
	routes.CommunityRoutes(apiMux)
	routes.CategoryRoutes(apiMux)
	routes.ChannelRoutes(apiMux)
	routes.MemberRoutes(apiMux)
	routes.PermissionRoutes(apiMux)
	routes.LogRoutes(apiMux)
	routes.RoleRoutes(apiMux)
	routes.BanRoutes(apiMux)
	apiMux.HandleFunc("GET /ws", ws.HandleWebSocket)
	mux.Handle("/api/", http.StripPrefix("/api", apiMux))

	handler := middleware.Logger(middleware.CORS(mux))

	fmt.Printf("Server started at: %s\n", os.Getenv("SERVER_DOMAIN"))
	http.ListenAndServe(port, handler)
}

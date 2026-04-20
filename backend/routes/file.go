package routes

import (
	"axion/handlers"
	"net/http"
	"os"
	"path/filepath"
)

func FileRoutes(mux *http.ServeMux) {
	uploadsFolder := os.Getenv("UPLOADS_FOLDER")

	mux.HandleFunc("GET /serve/image/{imageName}", func(w http.ResponseWriter, r *http.Request) {
		imageName := r.PathValue("imageName")

		if imageName == "" {
			handlers.WriteErrorResponse(w, http.StatusBadRequest, "Image name is required")
			return
		}

		filePath := filepath.Join(uploadsFolder, imageName)

		_, err := os.Stat(filePath)
		if err != nil {
			handlers.WriteErrorResponse(w, http.StatusNotFound, "Image not found.")
			return
		}

		http.ServeFile(w, r, filePath)
	})
}

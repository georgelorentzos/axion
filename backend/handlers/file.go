package handlers

import (
	"axion/database"
	"io"
	"os"
	"path/filepath"
)

func SaveFile(file io.Reader, ext string) (string, error) {
	uploadsFolder := os.Getenv("UPLOADS_FOLDER")
	filename := database.GenerateID(20) + ext
	filePath := filepath.Join(uploadsFolder, filename)

	dst, err := os.Create(filePath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	io.Copy(dst, file)

	return "/api/serve/image/" + filename, nil
}

func DeleteFile(path string) {
	uploadsFolder := os.Getenv("UPLOADS_FOLDER")
	filename := filepath.Base(path)
	filePath := filepath.Join(uploadsFolder, filename)
	os.Remove(filePath)
}

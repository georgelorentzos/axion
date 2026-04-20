package schedulers

import (
	"fmt"
	"time"

	"axion/database"
)

func StartTokenCleanup() {
	ticker := time.NewTicker(5 * time.Minute)

	go func() {
		for range ticker.C {
			cleanupExpiredTokens()
		}
	}()

	fmt.Println("Token cleanup scheduler started.")
}

func cleanupExpiredTokens() {
	result, err := database.DB.Exec(
		"DELETE FROM tokens WHERE expires_at < NOW()",
	)
	if err != nil {
		fmt.Println("Cleanup error:", err)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected > 0 {
		fmt.Printf("Cleaned up %d expired tokens.\n", rowsAffected)
	}
}

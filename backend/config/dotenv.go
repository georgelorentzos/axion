package config

import (
	"fmt"
	"os"
	"strings"
)

func SetEnvVariables() {
	data, err := os.ReadFile(".env")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}

	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)

		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		os.Setenv(key, value)
	}
}

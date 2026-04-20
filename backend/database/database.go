package database

import (
	"crypto/rand"
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

const numericAlphabet = "0123456789"

func GenerateID(length int) string {
	b := make([]byte, length)
	rand.Read(b)
	id := make([]byte, length)
	for i := range b {
		id[i] = numericAlphabet[int(b[i])%len(numericAlphabet)]
	}
	return string(id)
}

func Connect() {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
	)

	var err error
	DB, err = sql.Open("postgres", dsn)
	if err != nil {
		fmt.Println("Database error:", err)
		return
	}

	err = DB.Ping()
	if err != nil {
		fmt.Println("Database ping failed:", err)
		return
	}

	fmt.Println("Database connected.")
}

func CreateTables() {
	DB.Exec(`CREATE TABLE IF NOT EXISTS users (
		id VARCHAR(20) PRIMARY KEY,
		username VARCHAR(255) UNIQUE NOT NULL,
		email VARCHAR(255) UNIQUE NOT NULL,
		image TEXT DEFAULT 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg',
		is_verified BOOLEAN NOT NULL DEFAULT FALSE,
		is_online BOOLEAN NOT NULL DEFAULT FALSE,
		last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		created_at TIMESTAMPTZ DEFAULT NOW()
	)`)

	DB.Exec(`CREATE TABLE IF NOT EXISTS tokens (
		id VARCHAR(20) PRIMARY KEY,
		token TEXT NOT NULL,
		type VARCHAR(50) NOT NULL,
		user_id VARCHAR(20) NOT NULL REFERENCES users(id),
		created_at TIMESTAMPTZ DEFAULT NOW(),
		expires_at TIMESTAMPTZ NOT NULL
	)`)

	DB.Exec(`CREATE TABLE IF NOT EXISTS friends (
    	id VARCHAR(20) PRIMARY KEY,
    	requester_id VARCHAR(20) NOT NULL REFERENCES users(id),
    	addressee_id VARCHAR(20) NOT NULL REFERENCES users(id),
    	status VARCHAR(50) NOT NULL DEFAULT 'pending',
    	created_at TIMESTAMPTZ DEFAULT NOW(),
    	updated_at TIMESTAMPTZ DEFAULT NOW()
	)`)

	DB.Exec(`CREATE TABLE IF NOT EXISTS direct_messages (
    	id VARCHAR(20) PRIMARY KEY,
    	sender_id VARCHAR(20) NOT NULL REFERENCES users(id),
    	recipient_id VARCHAR(20) NOT NULL REFERENCES users(id),
    	reply_to_id VARCHAR(20) REFERENCES direct_messages(id),
    	message TEXT NOT NULL,
    	hidden_by_sender BOOLEAN NOT NULL DEFAULT FALSE,
    	hidden_by_recipient BOOLEAN NOT NULL DEFAULT FALSE,
    	is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    	created_at TIMESTAMPTZ DEFAULT NOW()
	)`)

	DB.Exec(`CREATE TABLE IF NOT EXISTS conversations (
		id VARCHAR(20) PRIMARY KEY,
		sender_id VARCHAR(20) NOT NULL REFERENCES users(id),
		recipient_id VARCHAR(20) NOT NULL REFERENCES users(id),
		message TEXT NOT NULL,
		hidden_by_sender BOOLEAN NOT NULL DEFAULT FALSE,
		hidden_by_recipient BOOLEAN NOT NULL DEFAULT FALSE,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	)`)

	DB.Exec(`CREATE TABLE IF NOT EXISTS communities (
		id VARCHAR(20) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		image TEXT,
		owner_id VARCHAR(20) NOT NULL REFERENCES users(id),
		created_at TIMESTAMPTZ DEFAULT NOW()
	)`)

	DB.Exec(`CREATE TABLE IF NOT EXISTS community_categories (
		id VARCHAR(20) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		community_id VARCHAR(20) NOT NULL REFERENCES communities(id)
	)`)

	DB.Exec(`CREATE TABLE IF NOT EXISTS community_channels (
		id VARCHAR(20) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		type VARCHAR(50) NOT NULL,
		community_id VARCHAR(20) NOT NULL REFERENCES communities(id),
		category_id VARCHAR(20) REFERENCES community_categories(id)
	)`)

	DB.Exec(`CREATE TABLE IF NOT EXISTS channel_messages (
		id VARCHAR(20) PRIMARY KEY,
		sender_id VARCHAR(20) NOT NULL REFERENCES users(id),
		channel_id VARCHAR(20) NOT NULL REFERENCES community_channels(id),
		community_id VARCHAR(20) NOT NULL REFERENCES communities(id),
		message TEXT NOT NULL,
		is_edited BOOLEAN NOT NULL DEFAULT FALSE,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		reply_to_id VARCHAR(20) REFERENCES channel_messages(id)
	)`)

	DB.Exec(`CREATE TABLE IF NOT EXISTS community_members (
		id VARCHAR(20) PRIMARY KEY,
		user_id VARCHAR(20) NOT NULL REFERENCES users(id),
		community_id VARCHAR(20) NOT NULL REFERENCES communities(id),
		role VARCHAR(50) DEFAULT 'member',
		created_at TIMESTAMPTZ DEFAULT NOW()
	)`)

	DB.Exec(`CREATE TABLE IF NOT EXISTS community_roles (
		id VARCHAR(20) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		color VARCHAR(50),
		permissions JSONB NOT NULL DEFAULT '[]',
		community_id VARCHAR(20) NOT NULL REFERENCES communities(id),
		created_at TIMESTAMPTZ DEFAULT NOW()
	)`)

	DB.Exec(`CREATE TABLE IF NOT EXISTS member_roles (
		id VARCHAR(20) PRIMARY KEY,
		member_id VARCHAR(20) NOT NULL REFERENCES community_members(id),
		role_id VARCHAR(20) NOT NULL REFERENCES community_roles(id)
	)`)

	DB.Exec(`CREATE TABLE IF NOT EXISTS community_logs (
    	id VARCHAR(20) PRIMARY KEY,
    	community_id VARCHAR(20) NOT NULL REFERENCES communities(id),
    	user_id VARCHAR(20) NOT NULL REFERENCES users(id),
    	title TEXT NOT NULL,
    	note TEXT,
    	created_at TIMESTAMPTZ DEFAULT NOW()
	)`)

	DB.Exec(`CREATE TABLE IF NOT EXISTS community_bans (
    	id VARCHAR(20) PRIMARY KEY,
    	community_id VARCHAR(20) NOT NULL REFERENCES communities(id),
    	user_id VARCHAR(20) NOT NULL REFERENCES users(id),
    	reason TEXT,
    	created_at TIMESTAMPTZ DEFAULT NOW()
	)`)
}

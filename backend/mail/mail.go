package mail

import (
	"fmt"
	"net/smtp"
	"os"
)

type SendMail struct {
	Recipient string
	Subject   string
	Message   string
}

func Send(data SendMail) bool {
	smtpServer := "smtp.gmail.com"
	smtpPort := "587"
	username := os.Getenv("MAIL_USERNAME")
	password := os.Getenv("MAIL_PASSWORD")

	headers := fmt.Sprintf(
		"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: %s\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: text/html; charset=UTF-8\r\n"+
			"\r\n",
		username, data.Recipient, data.Subject,
	)

	msg := []byte(headers + data.Message)

	auth := smtp.PlainAuth("", username, password, smtpServer)
	err := smtp.SendMail(
		smtpServer+":"+smtpPort,
		auth,
		username,
		[]string{data.Recipient},
		msg,
	)

	if err != nil {
		fmt.Println("Mail error:", err)
		return false
	}

	return true
}

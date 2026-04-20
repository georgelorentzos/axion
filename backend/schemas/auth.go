package schemas

type AuthRequest struct {
	Email string `json:"email"`
}

type SendMail struct {
	Message   string `json:"message"`
	Recipient string `json:"recipient"`
	Subject   string `json:"subject"`
}

type CreateToken struct {
	Token string `json:"token"`
	Type  string `json:"type"`
}

type ValidateToken struct {
	Token string `json:"token"`
}

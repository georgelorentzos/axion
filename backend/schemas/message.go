package schemas

type MessageRequest struct {
	Message   string  `json:"message"`
	ReplyToID *string `json:"reply_to_id"`
}

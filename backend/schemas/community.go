package schemas

type CategoryRequest struct {
	CategoryName string `json:"category_name"`
}

type ChannelRequest struct {
	ChannelName string  `json:"channel_name"`
	CategoryID  *string `json:"category_id"`
}

type RoleRequest struct {
	Name        string `json:"name"`
	Color       string `json:"color"`
	Permissions string `json:"permissions"`
}

type KickRequest struct {
	Reason string `json:"reason"`
}

type BanRequest struct {
	Reason string `json:"reason"`
}

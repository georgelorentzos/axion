package models

import "time"

type Community struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Image     *string   `json:"image"`
	OwnerID   string    `json:"ownerId"`
	CreatedAt time.Time `json:"createdAt"`
}

type CommunityCategory struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	CommunityID string `json:"communityId"`
}

type CommunityChannel struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Type        string  `json:"type"`
	CommunityID string  `json:"communityId"`
	CategoryID  *string `json:"categoryId"`
}

type ChannelMessage struct {
	ID              string    `json:"id"`
	SenderID        string    `json:"senderId"`
	ChannelID       string    `json:"channelId"`
	CommunityID     string    `json:"communityId"`
	Message         string    `json:"message"`
	ReplyToID       *string   `json:"replyToId"`
	IsEdited        bool      `json:"isEdited"`
	CreatedAt       time.Time `json:"createdAt"`
	SenderUsername  string    `json:"senderUsername"`
	SenderImage     *string   `json:"senderImage"`
	ReplyToMessage  *string   `json:"replyToMessage"`
	ReplyToUsername *string   `json:"replyToUsername"`
	ReplyToImage    *string   `json:"replyToImage"`
}

type CommunityMember struct {
	ID          string    `json:"id"`
	UserID      string    `json:"userId"`
	CommunityID string    `json:"communityId"`
	Role        string    `json:"role"`
	CreatedAt   time.Time `json:"createdAt"`
}

type CommunityRole struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Color       string `json:"color"`
	Permissions string `json:"permissions"`
	CommunityID string `json:"communityId"`
}

type MemberRole struct {
	ID       string `json:"id"`
	MemberID string `json:"memberId"`
	RoleID   string `json:"roleId"`
}

type CommunityLog struct {
	ID          string    `json:"id"`
	CommunityID string    `json:"communityId"`
	UserID      string    `json:"userId"`
	Title       string    `json:"title"`
	Note        *string   `json:"note"`
	CreatedAt   time.Time `json:"createdAt"`
}

type CommunityBan struct {
	ID          string    `json:"id"`
	CommunityID string    `json:"communityId"`
	UserID      string    `json:"userId"`
	Reason      *string   `json:"reason"`
	CreatedAt   time.Time `json:"createdAt"`
}

package handlers

import (
	"axion/database"
	"axion/models"
)

func GetCommunities(userID string) ([]models.Community, error) {
	rows, err := database.DB.Query(`
		SELECT cs.id FROM communities cs
		JOIN community_members cm ON cm.community_id = cs.id
		WHERE cm.user_id = $1
	`, userID)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var communities []models.Community

	for rows.Next() {
		var community models.Community
		if err := rows.Scan(&community.ID); err != nil {
			return nil, err
		}
		communities = append(communities, community)
	}

	return communities, err
}

func GetCommunity(communityID string) (models.Community, error) {
	var community models.Community

	err := database.DB.QueryRow(
		"SELECT id, name, image, owner_id, created_at FROM communities WHERE id = $1", communityID,
	).Scan(&community.ID, &community.Name, &community.Image, &community.OwnerID, &community.CreatedAt)

	return community, err
}

func GetCommunityMember(communityID string, userID string) (models.CommunityMember, error) {
	var member models.CommunityMember

	err := database.DB.QueryRow(
		"SELECT id, user_id, community_id, role, created_at FROM community_members WHERE community_id = $1 AND user_id = $2", communityID, userID,
	).Scan(&member.ID, &member.UserID, &member.CommunityID, &member.Role, &member.CreatedAt)

	return member, err
}

func GetCommunityCategory(communityID string, categoryID string) (models.CommunityCategory, error) {
	var category models.CommunityCategory

	err := database.DB.QueryRow(
		"SELECT id, name, community_id FROM community_categories WHERE id = $1 AND community_id = $2", categoryID, communityID,
	).Scan(&category.ID, &category.Name, &category.CommunityID)

	return category, err
}

func GetCommunityChannel(communityID string, channelID string) (models.CommunityChannel, error) {
	var channel models.CommunityChannel

	err := database.DB.QueryRow(
		"SELECT id, name, type, community_id, category_id FROM community_channels WHERE community_id = $1 AND id = $2", communityID, channelID,
	).Scan(&channel.ID, &channel.Name, &channel.Type, &channel.CommunityID, &channel.CategoryID)

	return channel, err
}

func GetChannelMessage(communityID string, channelID string, messageID string) (models.ChannelMessage, error) {
	var message models.ChannelMessage

	err := database.DB.QueryRow(`
		SELECT 
			cm.id, cm.sender_id, cm.channel_id, cm.community_id, cm.message, 
			cm.reply_to_id, cm.is_edited, cm.created_at,
			u.username, u.image,
			rm.message, ru.username, ru.image
		FROM channel_messages cm
		JOIN users u ON u.id = cm.sender_id
		LEFT JOIN channel_messages rm ON rm.id = cm.reply_to_id
		LEFT JOIN users ru ON ru.id = rm.sender_id
		WHERE cm.id = $1 AND cm.community_id = $2 AND cm.channel_id = $3
	`, messageID, communityID, channelID).Scan(
		&message.ID,
		&message.SenderID,
		&message.ChannelID,
		&message.CommunityID,
		&message.Message,
		&message.ReplyToID,
		&message.IsEdited,
		&message.CreatedAt,
		&message.SenderUsername,
		&message.SenderImage,
		&message.ReplyToMessage,
		&message.ReplyToUsername,
		&message.ReplyToImage,
	)

	return message, err
}

func GetCommunityBan(communityID string, userID string) (models.CommunityBan, error) {
	var ban models.CommunityBan

	err := database.DB.QueryRow(
		"SELECT id, community_id, user_id, reason, created_at FROM community_bans WHERE community_id = $1 AND user_id = $2",
		communityID, userID,
	).Scan(&ban.ID, &ban.CommunityID, &ban.UserID, &ban.Reason, &ban.CreatedAt)

	return ban, err
}

func GetCommunityRole(communityID string, roleID string) (models.CommunityRole, error) {
	var role models.CommunityRole
	err := database.DB.QueryRow(
		"SELECT id, name, color, permissions, community_id FROM community_roles WHERE id = $1 AND community_id = $2", roleID, communityID,
	).Scan(&role.ID, &role.Name, &role.Color, &role.Permissions, &role.CommunityID)
	return role, err
}

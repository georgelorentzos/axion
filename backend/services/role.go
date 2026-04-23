package services

import "axion/database"

func ToggleMemberRole(communityID, memberID, roleID, roleName, actorID, actorUsername, targetUsername string) error {
	var alreadyAssigned bool
	err := database.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM member_roles
			WHERE member_id = $1 AND role_id = $2
		)
	`, memberID, roleID).Scan(&alreadyAssigned)
	if err != nil {
		return err
	}

	var logMessage string
	if alreadyAssigned {
		_, err = database.DB.Exec(
			"DELETE FROM member_roles WHERE member_id = $1 AND role_id = $2",
			memberID, roleID,
		)
		logMessage = actorUsername + " removed the role " + roleName + " from " + targetUsername
	} else {
		_, err = database.DB.Exec(
			"INSERT INTO member_roles (id, member_id, role_id) VALUES ($1, $2, $3)",
			database.GenerateID(20), memberID, roleID,
		)
		logMessage = actorUsername + " added the role " + roleName + " to " + targetUsername
	}

	if err != nil {
		return err
	}

	return CreateLog(communityID, actorID, logMessage, nil)
}

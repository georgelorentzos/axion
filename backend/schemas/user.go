package schemas

type CreateAccount struct {
	ID   string `json:"id" gorm:"primaryKey"`
	Name string `json:"name"`
}

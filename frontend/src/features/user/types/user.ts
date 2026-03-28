export type User = {
  id: string;
  username: string;
  image: string;
  isOnline: boolean;
  createdAt?: string;
  permissions?: {
    permission: string;
  }[];
};
export type User = {
  id: string;
  username: string;
  image: string;
  isOnline: boolean;
  createdAt?: string;
  roles?: {
    id: string;
    name: string;
  }[];
  permissions?: {
    permission: string;
  }[];
};
import { type Role } from "../../community/types/role";

export type User = {
  id: string;
  username: string;
  bio: string | null;
  image: string | null;
  isOnline: boolean;
  createdAt?: string;
  roles?: Role[];
  permissions?: string[];
};

export type CurrentUser = User & {
  email: string;
};
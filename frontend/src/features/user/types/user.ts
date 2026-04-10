import { type Role } from "../../community/types/role";

export type User = {
  id: string;
  username: string;
  image: string;
  isOnline: boolean;
  createdAt?: string;
  roles?: Role[];
  permissions?: string[];
};
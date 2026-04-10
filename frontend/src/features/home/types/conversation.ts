import { type User } from "../../user/types/user";

export type Conversation = {
    user: User;
    latestMessage: string;
};

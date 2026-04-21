export type Conversation = {
    id: string;
    username: string;
    image: string | null;
    isOnline: boolean;
    createdAt: string;
    unreadCount: number;
}
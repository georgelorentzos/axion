export type Message = {
  id: string;
  senderId: string;
  message: string;
  createdAt: string;
  senderUsername: string;
  senderImage: string;
  channelId?: string;
  recipientId?: string;
};
export type Message = {
  id: string;
  senderId: string;
  message: string;
  isEdited: boolean;
  createdAt: string;
  senderUsername: string;
  senderImage: string;
  channelId?: string;
  recipientId?: string;
  replyToId?: string;
  replyToUsername?: string;
  replyToImage?: string;
  replyToMessage?: string;
};
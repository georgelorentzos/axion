import { type Conversation } from './types/conversation';
import { useLocation } from 'react-router-dom';
import UserAvatar from '../avatar/UserAvatar';

type ConversationButtonProps = {
  onClick?: () => void,
  conversation: Conversation;
};

export default function ConversationButton({
  onClick,
  conversation,
}: ConversationButtonProps) {
  const location = useLocation();
  const isSelected = location.pathname.startsWith(`/chat/${conversation.id}`);

  return (
    <div className="relative flex items-center group">
      <div
        className={`absolute left-[-20px] bg-forestgreen w-[8px] rounded-full transition-all duration-200
            ${isSelected 
                ? "h-[40px] opacity-100" 
                : "h-[20px] opacity-0 group-hover:opacity-100"
            }
        `}
      />

      <button
        className={`rounded-full transition duration-300 flex justify-center items-center`}
        onClick={onClick}
      >
        <div className="relative h-[50px] w-[50px] rounded-full overflow-hidden">
          <UserAvatar 
            src={conversation.image}
            size={50}
            showStatus={false}
          />
        </div>
        <div className="absolute bottom-[-3px] right-[-3px] w-5 h-5 rounded-full bg-crimson flex items-center justify-center text-[12px] border-2 border-outline">{conversation.unreadCount}</div>
      </button>
    </div>
  );
}
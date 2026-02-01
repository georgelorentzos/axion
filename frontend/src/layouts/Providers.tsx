import { UserProvider } from '../contexts/useCurrentUser';
import { OnlineFriendsProvider } from "../contexts/useOnlineFriends";
import { AllFriendsProvider } from '../contexts/useAllFriends';
import { PendingsProvider } from '../contexts/usePendings';
import { DirectMessagesProvider } from '../contexts/useDirectMessages';

export const MainWithProviders = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>
    <OnlineFriendsProvider>
      <AllFriendsProvider>
        <PendingsProvider>
          <DirectMessagesProvider>
            {children}
          </DirectMessagesProvider>
        </PendingsProvider>
      </AllFriendsProvider>
    </OnlineFriendsProvider>
  </UserProvider>
);
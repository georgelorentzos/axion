import { UserProvider } from '../contexts/useCurrentUser';
import { OnlineFriendsProvider } from "../contexts/useOnlineFriends";
import { AllFriendsProvider } from '../contexts/useAllFriends';
import { PendingProvider } from '../contexts/usePending';
import { DirectMessagesProvider } from '../contexts/useDirectMessages';
import { CommunitiesProvider } from '../contexts/useCommunities';

export const MainWithProviders = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>
    <OnlineFriendsProvider>
      <AllFriendsProvider>
        <PendingProvider>
          <DirectMessagesProvider>
            <CommunitiesProvider>
                {children}
            </CommunitiesProvider>
          </DirectMessagesProvider>
        </PendingProvider>
      </AllFriendsProvider>
    </OnlineFriendsProvider>
  </UserProvider>
);
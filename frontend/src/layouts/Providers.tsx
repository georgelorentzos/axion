import { UserProvider } from '../contexts/useCurrentUser';
import { OnlineFriendsProvider } from "../contexts/useOnlineFriends";
import { AllFriendsProvider } from '../contexts/useAllFriends';
import { PendingProvider } from '../contexts/usePending';
import { DirectMessagesProvider } from '../contexts/useDirectMessages';
import { CommunitiesProvider } from '../contexts/useCommunities';
import { CommunitiesMembersProvider } from '../contexts/useCommunityMembers';
import { CommunityProvider } from '../contexts/useCommunity';

export const MainWithProviders = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>
    <OnlineFriendsProvider>
      <AllFriendsProvider>
        <PendingProvider>
          <DirectMessagesProvider>
            <CommunitiesProvider>
              <CommunitiesMembersProvider>
                <CommunityProvider>
                  {children}
                </CommunityProvider>
              </CommunitiesMembersProvider>
            </CommunitiesProvider>
          </DirectMessagesProvider>
        </PendingProvider>
      </AllFriendsProvider>
    </OnlineFriendsProvider>
  </UserProvider>
);
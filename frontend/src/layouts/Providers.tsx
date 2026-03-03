import { UserProvider } from '../contexts/useCurrentUser';
import { OnlineFriendsProvider } from "../contexts/useOnlineFriends";
import { AllFriendsProvider } from '../contexts/useAllFriends';
import { PendingProvider } from '../contexts/usePending';
import { DirectMessagesProvider } from '../contexts/useDirectMessages';
import { CommunitiesProvider } from '../contexts/communities/useCommunities';
import { CommunitiesMembersProvider } from '../contexts/communities/useCommunityMembers';
import { CommunityProvider } from '../contexts/communities/useCommunity';
import { CommunityRolesProvider } from '../contexts/communities/useCommunityRoles';
import { LogsProvider } from '../contexts/communities/useLogs';

export const MainWithProviders = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>
    <OnlineFriendsProvider>
      <AllFriendsProvider>
        <PendingProvider>
          <DirectMessagesProvider>
            <CommunitiesProvider>
              <CommunitiesMembersProvider>
                <CommunityProvider>
                  <CommunityRolesProvider>
                    <LogsProvider>
                      { children }
                    </LogsProvider>
                  </CommunityRolesProvider>
                </CommunityProvider>
              </CommunitiesMembersProvider>
            </CommunitiesProvider>
          </DirectMessagesProvider>
        </PendingProvider>
      </AllFriendsProvider>
    </OnlineFriendsProvider>
  </UserProvider>
);
import { UserProvider } from '../contexts/useCurrentUser';
import { OnlineFriendsProvider } from "../contexts/useOnlineFriends";
import { AllFriendsProvider } from '../contexts/useAllFriends';
import { PendingProvider } from '../contexts/usePending';
import { DirectMessagesProvider } from '../contexts/useDirectMessages';
import { CommunitiesProvider } from '../contexts/communities/useCommunities';
import { MembersProvider } from '../contexts/communities/useMembers';
import { CommunityProvider } from '../contexts/communities/useCommunity';
import { RolesProvider } from '../contexts/communities/useRoles';
import { LogsProvider } from '../contexts/communities/useLogs';
import { BansProvider } from '../contexts/communities/useBans';

export const MainWithProviders = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>
    <OnlineFriendsProvider>
      <AllFriendsProvider>
        <PendingProvider>
          <DirectMessagesProvider>
            <CommunitiesProvider>
              <MembersProvider>
                <CommunityProvider>
                  <RolesProvider>
                    <LogsProvider>
                      <BansProvider>
                        { children }
                      </BansProvider>
                    </LogsProvider>
                  </RolesProvider>
                </CommunityProvider>
              </MembersProvider>
            </CommunitiesProvider>
          </DirectMessagesProvider>
        </PendingProvider>
      </AllFriendsProvider>
    </OnlineFriendsProvider>
  </UserProvider>
);
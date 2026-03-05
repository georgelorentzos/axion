import { UserProvider as CurrentUserProvider } from '../contexts/useCurrentUser';
import { OnlineFriendsProvider } from "../contexts/friendspanel/useOnlineFriends";
import { AllFriendsProvider } from '../contexts/friendspanel/useAllFriends';
import { PendingProvider } from '../contexts/friendspanel/usePending';
import { DirectMessagesProvider } from '../contexts/chatoverview/useDirectMessages';
import { CommunitiesProvider } from '../contexts/community/useCommunities';
import { MembersProvider } from '../contexts/community/useMembers';
import { CommunityProvider } from '../contexts/community/useCommunity';
import { RolesProvider } from '../contexts/community/useRoles';
import { LogsProvider } from '../contexts/community/useLogs';
import { BansProvider } from '../contexts/community/useBans';
import { MessagesProvider } from '../contexts/conversation/useMessages';
import { UserProvider as ConversationUserProvider } from '../contexts/conversation/useUser';

export const MainWithProviders = ({ children }: { children: React.ReactNode }) => (
  <CurrentUserProvider>
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
                        <MessagesProvider>
                          <ConversationUserProvider>
                            { children }
                          </ConversationUserProvider>
                        </MessagesProvider>
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
  </CurrentUserProvider>
);
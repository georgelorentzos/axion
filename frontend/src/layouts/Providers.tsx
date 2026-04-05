import { UserProvider as CurrentUserProvider } from '../features/user/contexts/useCurrentUser';
import { OnlineFriendsProvider } from "../features/friends/contexts/useOnlineFriends";
import { AllFriendsProvider } from '../features/friends/contexts/useAllFriends';
import { PendingProvider } from '../features/friends/contexts/usePending';
import { DirectMessagesProvider } from '../features/chat/contexts/useDirectMessages';
import { CommunitiesProvider } from '../features/community/contexts/useCommunities';
import { MembersProvider } from '../features/community/contexts/useMembers';
import { CommunityProvider } from '../features/community/contexts/useCommunity';
import { RolesProvider } from '../features/community/contexts/useRoles';
import { LogsProvider } from '../features/community/contexts/useLogs';
import { BansProvider } from '../features/community/contexts/useBans';
import { MessagesProvider } from '../features/chat/contexts/useMessages';
import { UserProvider as ConversationUserProvider } from '../features/chat/contexts/useUser';
import { CategoriesProvider } from '../features/community/contexts/useCategories';
import { ChannelsProvider } from '../features/community/contexts/useChannels';

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
                            <ChannelsProvider>
                            <CategoriesProvider>
                                { children }
                                </CategoriesProvider>
                              </ChannelsProvider>
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
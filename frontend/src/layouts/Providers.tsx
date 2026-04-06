import { UserProvider as CurrentUserProvider } from '../features/user/contexts/useCurrentUser';
import { OnlineFriendsProvider } from '../features/home/contexts/useOnlineFriends';
import { AllFriendsProvider } from '../features/home/contexts/useAllFriends';
import { PendingProvider } from '../features/home/contexts/usePending';
import { ConversationsProvider } from '../features/home/contexts/useConversations';
import { CommunitiesProvider } from '../ui/sidebar/contexts/useCommunities';
import { MembersProvider } from '../features/community/contexts/useMembers';
import { CommunityProvider } from '../features/community/contexts/useCommunity';
import { RolesProvider } from '../features/community/contexts/useRoles';
import { LogsProvider } from '../features/community/contexts/useLogs';
import { BansProvider } from '../features/community/contexts/useBans';
import { DirectMessagesProvider } from '../features/direct-message/contexts/useDirectMessages';
import { ChannelMessagesProvider } from '../features/community/contexts/useChannelMessages';
import { UserProvider as ConversationUserProvider } from '../features/direct-message/contexts/useUser';
import { CategoriesProvider } from '../features/community/contexts/useCategories';
import { ChannelsProvider } from '../features/community/contexts/useChannels';

export const MainWithProviders = ({ children }: { children: React.ReactNode }) => (
  <CurrentUserProvider>
    <OnlineFriendsProvider>
      <AllFriendsProvider>
        <PendingProvider>
          <DirectMessagesProvider>
          <ConversationsProvider>
            <CommunitiesProvider>
              <MembersProvider>
                <CommunityProvider>
                  <RolesProvider>
                    <LogsProvider>
                      <BansProvider>
                        
                          <ConversationUserProvider>
                            <ChannelsProvider>
                            <CategoriesProvider>
                              <ChannelMessagesProvider>
                                { children }
                                </ChannelMessagesProvider>
                                </CategoriesProvider>
                              </ChannelsProvider>
                          </ConversationUserProvider>
                        
                      </BansProvider>
                    </LogsProvider>
                  </RolesProvider>
                </CommunityProvider>
              </MembersProvider>
            </CommunitiesProvider>
          </ConversationsProvider>
          </DirectMessagesProvider>
        </PendingProvider>
      </AllFriendsProvider>
    </OnlineFriendsProvider>
  </CurrentUserProvider>
);
import { type Community } from "../../features/community/types/community";

type CommunityAvatarProps = {
  community: Community;
};

export default function CommunityAvatar({ community }: CommunityAvatarProps) {
  const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;

  const getImageUrl = (path: string) => {
    if (path.startsWith("blob:") || path.startsWith("data:") || path.startsWith("http")) {
      return path;
    }
    return apiUrl + path;
  };

  if (community.image) {
    return (
      <div className="relative h-[50px] w-[50px] rounded-2xl overflow-hidden">
        <img
          loading="eager"
          decoding="async"
          fetchPriority="high"
          draggable="false"
          src={getImageUrl(community.image)}
          alt={community.name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="bg-basalt border border-outline h-[50px] w-[50px] rounded-2xl flex items-center justify-center text-lg font-semibold">
      {community.name?.charAt(0).toUpperCase()}
    </div>
  );
}
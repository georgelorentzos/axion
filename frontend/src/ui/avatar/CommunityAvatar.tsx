type CommunityAvatarProps = {
  src?: string;
  name?: string;
  isCommunityCard?: boolean;
};

export default function CommunityAvatar({ src, name, isCommunityCard }: CommunityAvatarProps) {

  if (src) {
    return (
      <div className="relative h-[50px] w-[50px] rounded-2xl overflow-hidden">
        <img
          loading="eager"
          decoding="async"
          fetchPriority="high"
          draggable="false"
          src={src}
          alt={name}
          className={`h-full w-full object-cover`}
        />
      </div>
    );
  }

  return (
    <div className={`${isCommunityCard ? "bg-basalt border border-outline" : ""} h-[50px] w-[50px] rounded-2xl flex items-center justify-center text-lg font-semibold`}>
      {name?.charAt(0).toUpperCase()}
    </div>
  );
}
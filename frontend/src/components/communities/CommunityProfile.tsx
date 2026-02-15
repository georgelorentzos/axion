type CommunityImageProps = {
  src?: string;
  name?: string;
  isCommunityPreview?: boolean;
};

export default function CommunityProfile({ src, name, isCommunityPreview }: CommunityImageProps) {
  if (src) {
    return (
      <img
        loading="eager"
        decoding="async"
        fetchPriority="high"
        draggable="false"
        src={src}
        alt={name}
        className="h-[50px] w-[50px] rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className={` ${isCommunityPreview ? "bg-onyx border border-outline" : ""} h-[50px] w-[50px] rounded-2xl flex items-center justify-center text-lg font-semibold`}>
      {name?.charAt(0).toUpperCase()}
    </div>
  );
}
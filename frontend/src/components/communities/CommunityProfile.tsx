import { useState } from "react";

type CommunityImageProps = {
  src?: string;
  name?: string;
  isCommunityPreview?: boolean;
};

export default function CommunityProfile({ src, name, isCommunityPreview }: CommunityImageProps) {
  const [loaded, setLoaded] = useState(false);

  if (src) {
    return (
      <div className="relative h-[50px] w-[50px] rounded-2xl overflow-hidden">
        <div 
          className={`
            absolute inset-0 bg-onyx animate-pulse
            transition-opacity duration-300
            ${loaded ? 'opacity-0' : 'opacity-100'}
          `}
        />
        
        <img
          loading="eager"
          decoding="async"
          fetchPriority="high"
          draggable="false"
          src={src}
          alt={name}
          onLoad={() => setLoaded(true)}
          className={`
            h-full w-full object-cover
            transition-all duration-300 ease-out
            ${loaded ? 'blur-0 opacity-100' : 'blur-sm opacity-50'}
          `}
        />
      </div>
    );
  }

  return (
    <div className={`${isCommunityPreview ? "bg-basalt border border-outline" : ""} h-[50px] w-[50px] rounded-2xl flex items-center justify-center text-lg font-semibold`}>
      {name?.charAt(0).toUpperCase()}
    </div>
  );
}
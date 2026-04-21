type UserAvatarProps = {
    src: string | null;
    isOnline?: boolean;
    size?: number;
    className?: string;
    showStatus?: boolean;
};

export default function UserAvatar({
    src,
    isOnline,
    size = 40,
    className,
    showStatus = true,
}: UserAvatarProps) {
    const statusSize = Math.max(size * 0.3, 14);
    const borderSize = Math.max(size * 0.06, 2);

    const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;

    const getImageUrl = (path: string | null | undefined): string => {
        if (typeof path !== "string" || !path) {
            return "";
        }

        if (
            path.startsWith("blob:") ||
            path.startsWith("data:") ||
            path.startsWith("http")
        ) {
            return path;
        }

        return apiUrl + path;
    };

    const imageUrl = getImageUrl(src);

    return (
        <div
            className={`relative rounded-full shrink-0 ${className ?? ""}`}
            style={{ width: `${size}px`, height: `${size}px` }}
        >
            {imageUrl ? (
                <img
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    src={imageUrl}
                    alt=""
                    className="w-full h-full object-cover border border-outline rounded-full"
                    draggable="false"
                />
            ) : (
                <div className="w-full h-full rounded-full bg-[#D9DCE2] flex items-center justify-center overflow-hidden">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <circle cx="50" cy="40" r="20" fill="#70777F" />
                        <circle cx="50" cy="95" r="30" fill="#70777F" />
                    </svg>
                </div>
            )}

            {showStatus && (
                <span
                    className={`absolute rounded-full ${
                        isOnline ? "bg-emerald" : "bg-red-500"
                    }`}
                    style={{
                        width: `${statusSize}px`,
                        height: `${statusSize}px`,
                        bottom: `${size * 0.03}px`,
                        right: `${size * -0.04}px`,
                        borderWidth: `${borderSize}px`,
                        borderColor:
                            "rgb(38 38 40 / var(--tw-border-opacity, 1))",
                        borderStyle: "solid",
                    }}
                />
            )}
        </div>
    );
}
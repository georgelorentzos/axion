export function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-1 animate-pulse h-full overflow-hidden">
      {[...Array(8)].map((_, i) => {
        const isCurrentUser = i % 3 === 0;
        const bubbleWidth = 120 + (i * 37) % 200;
        return (
          <div
            key={i}
            className={`flex gap-2 items-end mb-1 flex-shrink-0 ${
              isCurrentUser ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div className="w-8 h-8 bg-zinc-800 rounded-full flex-shrink-0" />
            <div
              className={`rounded-2xl px-3 py-2 ${
                isCurrentUser ? "bg-forestgreen/30" : "bg-zinc-800"
              }`}
              style={{ width: `${Math.min(bubbleWidth, 320)}px`, minWidth: '120px' }}
            >
              {!isCurrentUser && (
                <div className="w-16 h-3 bg-zinc-700 rounded mb-1.5" />
              )}
              <div className="flex flex-col gap-1">
                <div className="w-full h-3.5 bg-zinc-700/60 rounded" />
                {bubbleWidth > 180 && (
                  <div className="w-3/4 h-3.5 bg-zinc-700/60 rounded" />
                )}
              </div>
              <div className="flex justify-end mt-1">
                <div className="w-10 h-2.5 bg-zinc-700/40 rounded" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
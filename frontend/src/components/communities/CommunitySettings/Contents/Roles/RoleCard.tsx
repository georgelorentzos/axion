type RoleCardProps = {
  id?: string;
  name: string;
  onDelete?: (id: string) => void;
  onClick?: () => void;
};

export default function RoleCard({
  id,
  name,
  onDelete,
  onClick,
}: RoleCardProps) {

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    onDelete?.(id);
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition duration-300 h-[60px] px-4 flex justify-between items-center w-full rounded-lg hover:bg-basalt"
    >
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
        <div className="flex flex-col leading-none gap-1">
          <div className="text-gray-100">{name}</div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={handleDelete}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-crimson hover:text-garnet transition duration-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}
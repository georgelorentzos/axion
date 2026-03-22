type TableProps = {
    head: React.ReactNode;
    children: React.ReactNode;
}

export default function Table({ head, children }: TableProps) {
    return (
        <table className="w-full text-left text-[14px]">
            <thead>
                <tr className="text-gray-500 text-[12px] border-b border-outline">
                    {head}
                </tr>
            </thead>
            <tbody>
                {children}
            </tbody>
        </table>
    );
}
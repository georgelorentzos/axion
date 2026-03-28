import { useMembers } from "../contexts/useMembers";
import UserCard from "../../../ui/UserCard";
import MemberPreview from "./MemberPreview";
import { useState, useEffect, useRef } from "react";

export default function MemberList() {
    const { members } = useMembers();
    const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
    const memberRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            let clickedInsideAny = false;
            memberRefs.current.forEach((el) => {
                if (el.contains(e.target as Node)) {
                    clickedInsideAny = true;
                }
            });
            if (!clickedInsideAny) {
                setActiveMemberId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setActiveMemberId(null);
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, []);

    return (
        <div className="w-[370px] h-screen border-l border-outline flex flex-col">
            <div className="w-full h-[60px] border-b border-outline flex items-center px-4 gap-2 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
                Members
            </div>
            <div className="p-2">
                <div className="text-gray-500 pl-2">Online -- {members.length}</div>
                {members.map(member => (
                    <div
                        key={member.id}
                        className="relative"
                        ref={(el) => {
                            if (el) memberRefs.current.set(member.id, el);
                            else memberRefs.current.delete(member.id);
                        }}
                    >
                        <UserCard
                            title={member.username}
                            imageUrl={member.image}
                            onClick={() => {
                                setActiveMemberId(prev =>
                                    prev === member.id ? null : member.id
                                );
                            }}
                        />
                        <MemberPreview
                            member={member}
                            isOpen={activeMemberId === member.id}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
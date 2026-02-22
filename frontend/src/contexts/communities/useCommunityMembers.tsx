import { useCommunityMembers as CommunityMembers } from "../../hooks/communities/useCommunityMembers";
import React, { createContext, useContext } from "react";

type CommunitiesMembersProviderProps = {
    children: React.ReactNode;
};

const useCommunitiesMembersContext = createContext<ReturnType<typeof CommunityMembers> | null>(null);

export function CommunitiesMembersProvider({ children }: CommunitiesMembersProviderProps) {
    const state = CommunityMembers();

    return(
        <useCommunitiesMembersContext.Provider value={state}>
            { children }
        </useCommunitiesMembersContext.Provider>
    );
}

export function useCommunityMembers() {
    const context = useContext(useCommunitiesMembersContext);
    if (!context) {
        throw new Error('useCommunityMembers must be used inside UserProvider');
    }
    return context;
}

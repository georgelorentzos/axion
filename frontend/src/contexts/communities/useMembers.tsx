import { useMembers as Members } from "../../hooks/communities/useMembers";
import React, { createContext, useContext } from "react";

type MembersProviderProps = {
    children: React.ReactNode;
};

const useCommunitiesMembersContext = createContext<ReturnType<typeof Members> | null>(null);

export function MembersProvider({ children }: MembersProviderProps) {
    const state = Members();

    return(
        <useCommunitiesMembersContext.Provider value={state}>
            { children }
        </useCommunitiesMembersContext.Provider>
    );
}

export function useMembers() {
    const context = useContext(useCommunitiesMembersContext);
    if (!context) {
        throw new Error('useMembers must be used inside UserProvider');
    }
    return context;
}

import React, { createContext, useContext } from "react";
import { useCommunityRoles as CommunityRoles } from "../../hooks/communities/useCommunityRoles";

type CommunityRolesProviderProps = {
    children: React.ReactNode;
}

const useCommunityRolesContext = createContext<ReturnType<typeof CommunityRoles> | null>(null);

export function CommunityRolesProvider({ children }: CommunityRolesProviderProps){
    const state = CommunityRoles();

    return(
        <useCommunityRolesContext.Provider value={state}>
            { children }
        </useCommunityRolesContext.Provider>
    );
}

export function useCommunityRoles() {
    const context = useContext(useCommunityRolesContext);
    if (!context) {
        throw new Error('useCommunityRoles must be used inside UserProvider');
    }
    return context;
}
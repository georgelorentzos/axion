import React, { createContext, useContext } from "react";
import { useRoles as Roles } from "../hooks/useRoles";

type RolesProviderProps = {
    children: React.ReactNode;
}

const useRolesContext = createContext<ReturnType<typeof Roles> | null>(null);

export function RolesProvider({ children }: RolesProviderProps){
    const state = Roles();

    return(
        <useRolesContext.Provider value={state}>
            { children }
        </useRolesContext.Provider>
    );
}

export function useRoles() {
    const context = useContext(useRolesContext);
    if (!context) {
        throw new Error('useRoles must be used inside UserProvider');
    }
    return context;
}
import { useCategories as Categories } from "../hooks/useCategories";
import React, { createContext, useContext } from "react";

const useCategoriesContext = createContext<ReturnType<typeof Categories> | null>(null);

type CategoriesProviderProps = {
    children: React.ReactNode;
}

export function CategoriesProvider({ children }: CategoriesProviderProps) {
    const state = Categories();
    return (
        <useCategoriesContext.Provider value={state}>
            {children}
        </useCategoriesContext.Provider>
    );
}

export function useCategories() {
    const context = useContext(useCategoriesContext);
    if (!context) {
        throw new Error("useCategories must be inside a UserProvider.");
    }
    return context;
}
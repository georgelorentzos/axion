import { useState, useMemo } from 'react';

interface Searchable {
    user_id: string;
    username: string;
    [key: string]: any;
}

export function useSearch<T extends Searchable>(items: T[], searchFields: (keyof T)[] = ['username']) {
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return items;

        const query = searchQuery.toLowerCase();
        return items.filter(item =>
            searchFields.some(field =>
                String(item[field]).toLowerCase().startsWith(query)
            )
        );
    }, [items, searchQuery, searchFields]);

    return {
        searchQuery,
        setSearchQuery,
        filtered,
    };
}
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'header-character';

export const CHARACTERS = [
    { id: 'cat1', name: 'Котик', path: '/Без названия.gif' },
    { id: 'cat2', name: 'Компаньон', path: '/Без названия 2.gif' },
    { id: 'cat3', name: 'Друг', path: '/Без названия 3.gif' },
] as const;

export type CharacterId = typeof CHARACTERS[number]['id'];

export function useHeaderCharacter() {
    const [characterId, setCharacterId] = useState<CharacterId>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && CHARACTERS.some(c => c.id === saved)) {
            return saved as CharacterId;
        }
        return 'cat1'; // По умолчанию первый персонаж
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, characterId);
    }, [characterId]);

    const currentCharacter = CHARACTERS.find(c => c.id === characterId) ?? CHARACTERS[0];

    return {
        characterId,
        currentCharacter,
        setCharacterId,
        characters: CHARACTERS,
    };
}

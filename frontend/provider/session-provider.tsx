"use client";

import { authTokensSchema, authUserSchema } from '@/types/auth';
import { ReactNode, useState, useEffect, createContext, useCallback, useContext } from 'react';
import { z } from 'zod';

const STORAGE_KEY = 'plsom_session';

const sessionSchema = z.object({
    user: authUserSchema,
    tokens: authTokensSchema,
})

export type Session = z.infer<typeof sessionSchema>;

interface SessionProviderProps {
    children: ReactNode;
}

interface SessionProviderState {
    session: Session | null;
    loading: boolean;
    setSession: (session: Session) => void;
    clearSession: () => void;
}

export const SessionContext = createContext<SessionProviderState | undefined>(undefined);

export function loadSession(): Session | null {
    try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        if (!raw) return null;
        const parsed = sessionSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) {
            console.error('Invalid session data', parsed.error);
            return null;
        }
        return parsed.data;
    }
    catch {
        return null;
    }
}

export default function SessionProvider({ children }: SessionProviderProps) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const handleClearSession = useCallback(() => {
        setSession(null);
        localStorage.removeItem(STORAGE_KEY);
    }, [setSession]);

    const handleSetSession = useCallback((session: Session) => {
        setSession(session);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }, [setSession]);

    useEffect(() => {
        const s = loadSession();
        if (s) {
            handleSetSession(s);
        }
        setTimeout(() => {
            setLoading(false);
        }, 2000);
    }, [setLoading, handleSetSession]);

    return (
        <SessionContext.Provider value={{ 
            session, 
            loading, 
            setSession: handleSetSession, 
            clearSession: handleClearSession,
        }}>
            {children}
        </SessionContext.Provider>
    );
}
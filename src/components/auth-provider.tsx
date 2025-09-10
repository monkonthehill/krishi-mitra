'use client';

import {auth} from '@/lib/firebase';
import {type User, onAuthStateChanged, signInAnonymously} from 'firebase/auth';
import {createContext, useContext, useEffect, useState} from 'react';
import type {ReactNode} from 'react';
import {Skeleton} from './ui/skeleton';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          setUser(userCredential.user);
        } catch (error) {
          console.error('Anonymous sign-in failed:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 p-8 w-full max-w-md">
           <Skeleton className="h-12 w-full" />
           <Skeleton className="h-32 w-full" />
           <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={{user, loading}}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

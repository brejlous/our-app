import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface UseAuthReturn {
  user: User | null;
  status: AuthStatus;
  register: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setStatus(firebaseUser ? 'authenticated' : 'unauthenticated');
      },
      (error) => {
        console.error('Auth state error:', error);
        setStatus('unauthenticated');
      }
    );
    return unsubscribe;
  }, []);

  async function register(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(auth, email, password);
  }

  async function signIn(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logOut(): Promise<void> {
    await signOut(auth);
  }

  return { user, status, register, signIn, logOut };
}

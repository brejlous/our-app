import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShoppingList } from '../types';

type ListStatus = 'loading' | 'ready' | 'needs-setup';

interface UseListReturn {
  list: ShoppingList | null;
  status: ListStatus;
}

export function useList(userId: string | undefined): UseListReturn {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [status, setStatus] = useState<ListStatus>('loading');

  useEffect(() => {
    if (!userId) {
      setStatus('needs-setup');
      setList(null);
      return;
    }

    const q = query(
      collection(db, 'lists'),
      where('members', 'array-contains', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setList(null);
          setStatus('needs-setup');
        } else {
          const doc = snapshot.docs[0];
          setList({ id: doc.id, ...doc.data() } as ShoppingList);
          setStatus('ready');
        }
      },
      (error) => {
        console.error('List snapshot error:', error);
        setStatus('needs-setup');
      }
    );

    return unsubscribe;
  }, [userId]);

  return { list, status };
}

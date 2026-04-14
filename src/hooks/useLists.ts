import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShoppingList } from '../types';

export function useLists(userId: string) {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'lists'),
      where('members', 'array-contains', userId)
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ShoppingList));
        // Sort newest first client-side (avoids composite index requirement)
        data.sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.());
        setLists(data);
        setLoading(false);
      },
      (err) => {
        console.error('useLists error:', err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [userId]);

  return { lists, loading };
}

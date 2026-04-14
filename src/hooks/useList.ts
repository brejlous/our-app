import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShoppingList } from '../types';

export function useListById(listId: string | undefined) {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listId) {
      setLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(
      doc(db, 'lists', listId),
      (snap) => {
        setList(snap.exists() ? ({ id: snap.id, ...snap.data() } as ShoppingList) : null);
        setLoading(false);
      },
      (err) => {
        console.error('useListById error:', err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [listId]);

  return { list, loading };
}

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShoppingItem } from '../types';

interface UseItemsReturn {
  items: ShoppingItem[];
  loading: boolean;
}

export function useItems(listId: string | undefined): UseItemsReturn {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listId) {
      setItems([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'lists', listId, 'items'),
      orderBy('addedAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ShoppingItem[];
        setItems(fetched);
        setLoading(false);
      },
      (error) => {
        console.error('Items snapshot error:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [listId]);

  return { items, loading };
}

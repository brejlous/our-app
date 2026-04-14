import { Timestamp } from 'firebase/firestore';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface ShoppingList {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
  inviteCode: string;
  createdAt: Timestamp;
}

export type ItemUnit = 'ks' | 'g' | 'kg' | 'ml' | 'l';

export interface ShoppingItem {
  id: string;
  text: string;
  checked: boolean;
  addedBy: string;
  addedAt: Timestamp;
  checkedAt: Timestamp | null;
  checkedBy: string | null;
  quantity: number | null;
  unit: ItemUnit | null;
}

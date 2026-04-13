import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  arrayUnion,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';

// Generate a random 6-character alphanumeric invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusable chars (0/O, 1/I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createList(userId: string): Promise<string> {
  const inviteCode = generateInviteCode();
  const docRef = await addDoc(collection(db, 'lists'), {
    name: 'Nákupní seznam',
    createdBy: userId,
    members: [userId],
    inviteCode,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function joinListByCode(code: string, userId: string): Promise<void> {
  const q = query(
    collection(db, 'lists'),
    where('inviteCode', '==', code.toUpperCase().trim())
  );

  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error('Kód nenalezen. Zkontroluj prosím kód a zkus to znovu.');
  }

  const listDoc = snap.docs[0];

  // Use a transaction to safely enforce the 2-member cap
  await runTransaction(db, async (transaction) => {
    const freshDoc = await transaction.get(listDoc.ref);
    if (!freshDoc.exists()) {
      throw new Error('Seznam byl smazán.');
    }
    const members: string[] = freshDoc.data().members ?? [];
    if (members.includes(userId)) {
      // Already a member — nothing to do
      return;
    }
    if (members.length >= 2) {
      throw new Error('Seznam je již plný (max. 2 členové).');
    }
    transaction.update(listDoc.ref, {
      members: arrayUnion(userId),
    });
  });
}

export async function addItem(listId: string, text: string, userId: string): Promise<void> {
  await addDoc(collection(db, 'lists', listId, 'items'), {
    text: text.trim(),
    checked: false,
    addedBy: userId,
    addedAt: serverTimestamp(),
    checkedAt: null,
    checkedBy: null,
  });
}

export async function deleteItem(listId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'lists', listId, 'items', itemId));
}

export async function toggleItem(
  listId: string,
  itemId: string,
  checked: boolean,
  userId: string
): Promise<void> {
  await updateDoc(doc(db, 'lists', listId, 'items', itemId), {
    checked,
    checkedAt: checked ? serverTimestamp() : null,
    checkedBy: checked ? userId : null,
  });
}

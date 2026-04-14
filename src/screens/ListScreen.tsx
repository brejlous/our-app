import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from 'firebase/auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useListById } from '../hooks/useList';
import { useItems } from '../hooks/useItems';
import { addItem, deleteItem, toggleItem, updateItemQuantity } from '../lib/firestore';
import { ShoppingItem, ItemUnit } from '../types';
import { RootStackParamList } from '../types/navigation';
import SwipeableItemRow from '../components/SwipeableItemRow';
import AddItemBar from '../components/AddItemBar';
import InviteModal from '../components/InviteModal';

const UNITS: ItemUnit[] = ['ks', 'g', 'kg', 'ml', 'l'];

type Props = NativeStackScreenProps<RootStackParamList, 'Items'> & { user: User };

export default function ListScreen({ user, route, navigation }: Props) {
  const { listId } = route.params;
  const { list } = useListById(listId);
  const { items, loading: itemsLoading } = useItems(listId);

  const [showInvite, setShowInvite] = useState(false);

  // Undo delete state — supports multiple simultaneous pending deletes
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const pendingItems = useRef<Map<string, ShoppingItem>>(new Map());
  const pendingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const undoOpacity = useRef(new Animated.Value(0)).current;

  // Edit quantity modal state
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [editQuantityText, setEditQuantityText] = useState('');
  const [editUnit, setEditUnit] = useState<ItemUnit>('ks');

  async function handleAddItem(text: string, quantity: number | null, unit: ItemUnit | null) {
    try {
      await addItem(listId, text, user.uid, quantity, unit);
    } catch {
      Alert.alert('Chyba', 'Nepodařilo se přidat položku.');
    }
  }

  async function handleToggle(itemId: string, checked: boolean) {
    try {
      await toggleItem(listId, itemId, !checked, user.uid);
    } catch {
      Alert.alert('Chyba', 'Nepodařilo se aktualizovat položku.');
    }
  }

  async function handleDelete(item: ShoppingItem) {
    pendingItems.current.set(item.id, item);
    setPendingIds(prev => {
      if (prev.length === 0) {
        Animated.timing(undoOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      }
      return [...prev, item.id];
    });

    const timerId = setTimeout(async () => {
      pendingItems.current.delete(item.id);
      pendingTimers.current.delete(item.id);
      setPendingIds(prev => {
        const next = prev.filter(id => id !== item.id);
        if (next.length === 0) {
          Animated.timing(undoOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        }
        return next;
      });
      try {
        await deleteItem(listId, item.id);
      } catch {
        Alert.alert('Chyba', 'Nepodařilo se smazat položku.');
      }
    }, 5000);

    pendingTimers.current.set(item.id, timerId);
  }

  function handleUndo() {
    // Undo the most recently deleted item
    setPendingIds(prev => {
      if (prev.length === 0) return prev;
      const lastId = prev[prev.length - 1];
      const timerId = pendingTimers.current.get(lastId);
      if (timerId) clearTimeout(timerId);
      pendingTimers.current.delete(lastId);
      pendingItems.current.delete(lastId);
      const next = prev.slice(0, -1);
      if (next.length === 0) {
        Animated.timing(undoOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      }
      return next;
    });
  }

  function openEditQuantity(item: ShoppingItem) {
    setEditingItem(item);
    setEditQuantityText(item.quantity != null ? String(item.quantity) : '');
    setEditUnit(item.unit ?? 'ks');
  }

  async function handleSaveQuantity() {
    if (!editingItem) return;
    const quantity = editQuantityText.trim() ? parseFloat(editQuantityText) : null;
    const unit = quantity != null ? editUnit : null;
    try {
      await updateItemQuantity(listId, editingItem.id, quantity, unit);
    } catch {
      Alert.alert('Chyba', 'Nepodařilo se uložit množství.');
    }
    setEditingItem(null);
  }

  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);

  type ListRow = ShoppingItem | { type: 'separator'; count: number };
  const listData: ListRow[] = unchecked.length > 0 && checked.length > 0
    ? [...unchecked, { type: 'separator', count: checked.length }, ...checked]
    : [...unchecked, ...checked];

  const partnerCount = list ? list.members.length : 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{list?.name ?? '...'}</Text>
            <Text style={styles.headerSub}>
              {items.length === 0
                ? 'Seznam je prázdný'
                : `${checked.filter(i => !pendingIds.includes(i.id)).length} / ${items.filter(i => !pendingIds.includes(i.id)).length} hotovo`}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {partnerCount < 2 && (
            <TouchableOpacity style={styles.inviteBtn} onPress={() => setShowInvite(true)}>
              <Text style={styles.inviteBtnText}>Pozvat</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Add item input */}
      <AddItemBar onAdd={handleAddItem} />

      {/* List */}
      {itemsLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#2563eb" />
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={listData}
            keyExtractor={(item) => 'type' in item ? 'separator' : item.id}
            renderItem={({ item }) => {
              if ('type' in item) {
                return (
                  <View style={styles.separator}>
                    <View style={styles.separatorLine} />
                    <Text style={styles.separatorLabel}>Hotovo ({item.count})</Text>
                    <View style={styles.separatorLine} />
                  </View>
                );
              }
              return (
                <SwipeableItemRow
                  item={item}
                  onToggle={() => handleToggle(item.id, item.checked)}
                  onDelete={() => handleDelete(item)}
                  onEditQuantity={() => openEditQuantity(item)}
                  isPending={pendingIds.includes(item.id)}
                />
              );
            }}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Zatím nic. Přidej první položku!</Text>
              </View>
            }
          />

          {/* Undo toast */}
          <Animated.View style={[styles.undoToast, { opacity: undoOpacity }]}>
            <Text style={styles.undoText}>Položka smazána</Text>
            <TouchableOpacity onPress={handleUndo}>
              <Text style={styles.undoButton}>Vrátit zpět</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* Invite modal */}
      {showInvite && list && (
        <InviteModal mode="show" inviteCode={list.inviteCode} onClose={() => setShowInvite(false)} />
      )}

      {/* Edit quantity modal */}
      <Modal
        visible={editingItem != null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingItem(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setEditingItem(null)} activeOpacity={1} />
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editingItem?.text}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Množství (nechej prázdné pro odstranění)"
              placeholderTextColor="#999"
              value={editQuantityText}
              onChangeText={setEditQuantityText}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.unitRow}>
              {UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitBtn, editUnit === u && styles.unitBtnActive]}
                  onPress={() => setEditUnit(u)}
                >
                  <Text style={[styles.unitBtnText, editUnit === u && styles.unitBtnTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditingItem(null)}>
                <Text style={styles.modalCancelText}>Zrušit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveQuantity}>
                <Text style={styles.modalSaveText}>Uložit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  backText: { fontSize: 32, color: '#2563eb', lineHeight: 36 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  headerSub: { fontSize: 12, color: '#888' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 8 },
  inviteBtn: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inviteBtnText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  listContent: { padding: 16, paddingBottom: 0 },
  emptyBox: { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  emptyText: { color: '#bbb', fontSize: 15 },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  separatorLine: { flex: 1, height: 1, backgroundColor: '#e5e5e5' },
  separatorLabel: { fontSize: 12, color: '#aaa', fontWeight: '500' },
  undoToast: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  undoText: { color: '#fff', fontSize: 15 },
  undoButton: { color: '#60a5fa', fontSize: 15, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 14 },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a' },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  unitRow: { flexDirection: 'row', gap: 8 },
  unitBtn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, backgroundColor: '#f5f5f5' },
  unitBtnActive: { backgroundColor: '#2563eb' },
  unitBtnText: { fontSize: 14, color: '#555', fontWeight: '500' },
  unitBtnTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  modalCancelText: { color: '#888', fontSize: 15 },
  modalSaveBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  modalSaveText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

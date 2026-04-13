import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from 'firebase/auth';
import { useList } from '../hooks/useList';
import { useItems } from '../hooks/useItems';
import { createList, addItem, deleteItem, toggleItem } from '../lib/firestore';
import { ShoppingItem } from '../types';
import ItemRow from '../components/ItemRow';
import AddItemBar from '../components/AddItemBar';
import InviteModal from '../components/InviteModal';

interface Props {
  user: User;
  onLogOut: () => void;
}

export default function ListScreen({ user, onLogOut }: Props) {
  const { list, status: listStatus } = useList(user.uid);
  const { items, loading: itemsLoading } = useItems(list?.id);

  const [showInvite, setShowInvite] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [creatingList, setCreatingList] = useState(false);

  const flatListRef = useRef<FlatList<ShoppingItem>>(null);

  // Scroll to bottom when keyboard opens so the input stays visible
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    return () => sub.remove();
  }, []);

  async function handleCreateList() {
    setCreatingList(true);
    try {
      await createList(user.uid);
    } catch (error) {
      Alert.alert('Chyba', 'Nepodařilo se vytvořit seznam.');
    } finally {
      setCreatingList(false);
    }
  }

  async function handleAddItem(text: string) {
    if (!list) return;
    try {
      await addItem(list.id, text, user.uid);
      // Scroll to bottom after adding so the input stays in view
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      Alert.alert('Chyba', 'Nepodařilo se přidat položku.');
    }
  }

  async function handleToggle(itemId: string, checked: boolean) {
    if (!list) return;
    try {
      await toggleItem(list.id, itemId, !checked, user.uid);
    } catch {
      Alert.alert('Chyba', 'Nepodařilo se aktualizovat položku.');
    }
  }

  async function handleDelete(itemId: string) {
    if (!list) return;
    try {
      await deleteItem(list.id, itemId);
    } catch {
      Alert.alert('Chyba', 'Nepodařilo se smazat položku.');
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (listStatus === 'loading') {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  // ── Setup state — no list yet ──────────────────────────────────────────────
  if (listStatus === 'needs-setup') {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.setupTitle}>Vítej! 👋</Text>
        <Text style={styles.setupBody}>
          Vytvoř nový seznam nebo se připoj k existujícímu pomocí kódu od partnera.
        </Text>

        <TouchableOpacity
          style={[styles.setupButton, creatingList && styles.buttonDisabled]}
          onPress={handleCreateList}
          disabled={creatingList}
        >
          {creatingList ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.setupButtonText}>Vytvořit nový seznam</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.setupButtonSecondary}
          onPress={() => setShowJoin(true)}
        >
          <Text style={styles.setupButtonSecondaryText}>Mám kód od partnera</Text>
        </TouchableOpacity>

        {showJoin && (
          <InviteModal
            mode="join"
            userId={user.uid}
            onClose={() => setShowJoin(false)}
          />
        )}
      </SafeAreaView>
    );
  }

  // ── Main list view ─────────────────────────────────────────────────────────
  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const partnerCount = list ? list.members.length : 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🛒 Nákupní seznam</Text>
          <Text style={styles.headerSub}>
            {totalCount === 0
              ? 'Seznam je prázdný'
              : `${checkedCount} / ${totalCount} hotovo`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {partnerCount < 2 && (
            <TouchableOpacity
              style={styles.inviteBtn}
              onPress={() => setShowInvite(true)}
            >
              <Text style={styles.inviteBtnText}>Pozvat</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onLogOut} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Odhlásit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List + input as footer */}
      {itemsLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#2563eb" />
      ) : (
        <FlatList
          ref={flatListRef}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemRow
              item={item}
              onToggle={() => handleToggle(item.id, item.checked)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Zatím nic. Přidej první položku níže!
              </Text>
            </View>
          }
          ListFooterComponent={
            <AddItemBar onAdd={handleAddItem} />
          }
        />
      )}

      {/* Invite modal */}
      {showInvite && list && (
        <InviteModal
          mode="show"
          inviteCode={list.inviteCode}
          onClose={() => setShowInvite(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 28,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSub: {
    fontSize: 13,
    color: '#888',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inviteBtn: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inviteBtnText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutBtn: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  logoutText: {
    color: '#aaa',
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    paddingBottom: 0,
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  emptyText: {
    color: '#bbb',
    fontSize: 15,
  },
  // Setup screen
  setupTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  setupBody: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  setupButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  setupButtonSecondary: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  setupButtonSecondaryText: {
    color: '#2563eb',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

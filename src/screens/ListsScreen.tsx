import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from 'firebase/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLists } from '../hooks/useLists';
import { createList, deleteList, renameList } from '../lib/firestore';
import { ShoppingList } from '../types';
import InviteModal from '../components/InviteModal';
import { RootStackParamList } from '../types/navigation';

interface Props {
  user: User;
  onLogOut: () => void;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Lists'>;
}

export default function ListsScreen({ user, onLogOut, navigation }: Props) {
  const { lists, loading } = useLists(user.uid);

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [renameText, setRenameText] = useState('');

  const [showJoin, setShowJoin] = useState(false);

  async function handleCreate() {
    const name = createName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const id = await createList(user.uid, name);
      setShowCreate(false);
      setCreateName('');
      navigation.navigate('Items', { listId: id });
    } catch {
      Alert.alert('Chyba', 'Nepodařilo se vytvořit seznam.');
    } finally {
      setCreating(false);
    }
  }

  async function handleRename() {
    if (!editingList) return;
    const name = renameText.trim();
    if (!name) return;
    try {
      await renameList(editingList.id, name);
    } catch {
      Alert.alert('Chyba', 'Nepodařilo se přejmenovat seznam.');
    }
    setEditingList(null);
  }

  function handleLongPress(list: ShoppingList) {
    Alert.alert(list.name, undefined, [
      {
        text: 'Přejmenovat',
        onPress: () => {
          setEditingList(list);
          setRenameText(list.name);
        },
      },
      {
        text: 'Smazat',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Smazat seznam', `Opravdu smazat „${list.name}"?`, [
            { text: 'Zrušit', style: 'cancel' },
            {
              text: 'Smazat',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteList(list.id);
                } catch {
                  Alert.alert('Chyba', 'Nepodařilo se smazat seznam.');
                }
              },
            },
          ]),
      },
      { text: 'Zrušit', style: 'cancel' },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Moje seznamy</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.joinBtn} onPress={() => setShowJoin(true)}>
            <Text style={styles.joinBtnText}>Připojit se</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.newBtnText}>+ Nový</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogOut} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Odhlásit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#2563eb" />
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('Items', { listId: item.id })}
              onLongPress={() => handleLongPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardMeta}>
                  {item.members.length > 1 ? '👫 Sdílený' : '👤 Vlastní'}
                </Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Zatím žádné seznamy.</Text>
              <Text style={styles.emptyHint}>Vytvoř nový nebo se připoj ke sdílenému.</Text>
            </View>
          }
        />
      )}

      {/* Create modal */}
      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowCreate(false)} activeOpacity={1} />
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nový seznam</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Název seznamu"
              placeholderTextColor="#999"
              value={createName}
              onChangeText={setCreateName}
              autoFocus
              onSubmitEditing={handleCreate}
              returnKeyType="done"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={styles.modalCancelText}>Zrušit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, (!createName.trim() || creating) && styles.modalSaveBtnDisabled]}
                onPress={handleCreate}
                disabled={!createName.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Vytvořit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rename modal */}
      <Modal visible={editingList != null} transparent animationType="fade" onRequestClose={() => setEditingList(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setEditingList(null)} activeOpacity={1} />
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Přejmenovat</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nový název"
              placeholderTextColor="#999"
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              onSubmitEditing={handleRename}
              returnKeyType="done"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditingList(null)}>
                <Text style={styles.modalCancelText}>Zrušit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, !renameText.trim() && styles.modalSaveBtnDisabled]}
                onPress={handleRename}
                disabled={!renameText.trim()}
              >
                <Text style={styles.modalSaveText}>Uložit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join modal */}
      {showJoin && (
        <InviteModal mode="join" userId={user.uid} onClose={() => setShowJoin(false)} />
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  joinBtn: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  joinBtnText: { color: '#16a34a', fontSize: 13, fontWeight: '600' },
  newBtn: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  newBtnText: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  logoutBtn: { paddingHorizontal: 4, paddingVertical: 6 },
  logoutText: { color: '#aaa', fontSize: 13 },
  listContent: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardContent: { flex: 1, gap: 4 },
  cardName: { fontSize: 17, fontWeight: '600', color: '#1a1a1a' },
  cardMeta: { fontSize: 13, color: '#888' },
  cardArrow: { fontSize: 22, color: '#ccc', marginLeft: 8 },
  emptyBox: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 17, color: '#888', fontWeight: '500' },
  emptyHint: { fontSize: 14, color: '#bbb', textAlign: 'center' },
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
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  modalCancelText: { color: '#888', fontSize: 15 },
  modalSaveBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  modalSaveBtnDisabled: { backgroundColor: '#c7d7f8' },
  modalSaveText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

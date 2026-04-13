import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { joinListByCode } from '../lib/firestore';

interface CreateProps {
  mode: 'show';
  inviteCode: string;
  onClose: () => void;
}

interface JoinProps {
  mode: 'join';
  userId: string;
  onClose: () => void;
}

type Props = CreateProps | JoinProps;

export default function InviteModal(props: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    if (props.mode !== 'show') return;
    await Share.share({
      message: `Připoj se k našemu nákupnímu seznamu! Kód: ${props.inviteCode}`,
    });
  }

  async function handleJoin() {
    if (props.mode !== 'join') return;
    if (code.trim().length !== 6) {
      Alert.alert('Chyba', 'Kód musí mít 6 znaků.');
      return;
    }
    setLoading(true);
    try {
      await joinListByCode(code.trim(), props.userId);
      props.onClose();
    } catch (error: any) {
      Alert.alert('Chyba', error.message ?? 'Nepodařilo se připojit.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={props.onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {props.mode === 'show' ? (
            <>
              <Text style={styles.title}>Sdílej seznam</Text>
              <Text style={styles.body}>
                Pošli přítelkyni tento kód — zadá ho při prvním spuštění aplikace.
              </Text>
              <View style={styles.codeBox}>
                <Text style={styles.code}>{props.inviteCode}</Text>
              </View>
              <TouchableOpacity style={styles.button} onPress={handleShare}>
                <Text style={styles.buttonText}>Sdílet kód</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={props.onClose}>
                <Text style={styles.secondaryText}>Zavřít</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Připojit se k seznamu</Text>
              <Text style={styles.body}>
                Zadej 6-místný kód, který ti poslal tvůj partner.
              </Text>
              <TextInput
                style={styles.codeInput}
                placeholder="XXXXXX"
                placeholderTextColor="#ccc"
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleJoin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Připojit se</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={props.onClose}
                disabled={loading}
              >
                <Text style={styles.secondaryText}>Zpět</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    gap: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },
  codeBox: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginVertical: 4,
  },
  code: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 8,
    color: '#2563eb',
  },
  codeInput: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    paddingVertical: 20,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 8,
    color: '#2563eb',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryText: {
    color: '#888',
    fontSize: 15,
  },
});

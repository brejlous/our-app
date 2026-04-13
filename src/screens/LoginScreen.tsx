import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function LoginScreen() {
  const { signIn, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Chyba', 'Vyplň prosím email a heslo.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Chyba', 'Heslo musí mít alespoň 6 znaků.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
    } catch (error: any) {
      const msg = friendlyError(error.code);
      Alert.alert('Chyba', msg);
    } finally {
      setLoading(false);
    }
  }

  function friendlyError(code: string): string {
    switch (code) {
      case 'auth/invalid-email':
        return 'Neplatný email.';
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return 'Špatný email nebo heslo.';
      case 'auth/wrong-password':
        return 'Špatné heslo.';
      case 'auth/email-already-in-use':
        return 'Tento email je již zaregistrován.';
      case 'auth/weak-password':
        return 'Heslo musí mít alespoň 6 znaků.';
      case 'auth/too-many-requests':
        return 'Příliš mnoho pokusů. Zkus to za chvíli.';
      default:
        return 'Něco se pokazilo. Zkus to znovu.';
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>🛒 Náš seznam</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'Přihlášení' : 'Registrace'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Heslo (min. 6 znaků)"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {mode === 'login' ? 'Přihlásit se' : 'Zaregistrovat se'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setEmail('');
            setPassword('');
          }}
          disabled={loading}
        >
          <Text style={styles.switchText}>
            {mode === 'login'
              ? 'Nemáš účet? Zaregistruj se'
              : 'Už máš účet? Přihlásit se'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#1a1a1a',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    textAlign: 'center',
    color: '#2563eb',
    fontSize: 14,
    marginTop: 8,
  },
});

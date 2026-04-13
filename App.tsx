import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from './src/hooks/useAuth';
import LoginScreen from './src/screens/LoginScreen';
import ListScreen from './src/screens/ListScreen';

export default function App() {
  const { user, status, logOut } = useAuth();

  // Wait for Firebase to resolve persisted auth state before rendering anything.
  // This prevents a flash of the login screen for already-logged-in users.
  if (status === 'loading') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {user ? (
        <ListScreen user={user} onLogOut={logOut} />
      ) : (
        <LoginScreen />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
});

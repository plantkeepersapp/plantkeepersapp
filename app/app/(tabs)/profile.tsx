import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, Alert, ScrollView } from 'react-native';
import { ThemedView } from '../../components/ThemedView';
import { useAuth } from '../../context/AuthContext';
import { FIREBASE_AUTH } from '@/firebase.config';
import { useRouter } from 'expo-router';

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await FIREBASE_AUTH.signOut();
      router.replace('/login');
    } catch (error) {
      Alert.alert('Logout Error', 'Something went wrong during logout.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Avatar + Basic Info */}
        <View style={styles.header}>
          <Image
            source={{
              uri: user?.photoURL || 'https://i.pravatar.cc/150?u=' + user?.uid,
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user?.displayName || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>User ID:</Text>
            <Text style={styles.value}>{user?.uid}</Text>
          </View>
          {/* Add more fields here later if needed */}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#93C572',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B4D2B',
  },
  email: {
    fontSize: 14,
    color: '#555',
  },
  card: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontWeight: '500',
    color: '#666',
  },
  value: {
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#93C572',
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 999,
    marginTop: 20,
    elevation: 3,
  },
  logoutText: {
    color: '#1B4D2B',
    fontSize: 16,
    fontWeight: '600',
  },
});

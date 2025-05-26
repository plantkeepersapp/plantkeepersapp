import { FIREBASE_AUTH } from '@/firebase.config';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemedView } from '../../components/ThemedView';
import { useAuth } from '../../context/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function Profile() {
    const { user } = useAuth();
    const router = useRouter();
    const [emailSendingStage, setEmailSendingStage] = useState('');

    const handleLogout = async () => {
        try {
            await FIREBASE_AUTH.signOut();
            router.replace('/login');
        } catch (error) {
            Alert.alert('Logout Error', 'Something went wrong during logout.');
        }
    };

    const passwordReset = async () => {
        if (user?.email) {
            setEmailSendingStage('sending');
            await sendPasswordResetEmail(FIREBASE_AUTH, user.email);
            setEmailSendingStage('sent');
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Avatar + Basic Info */}
                <View style={styles.header}>
                    <Image
                        source={{ uri: user?.photoURL || 'https://i.pravatar.cc/150?u=' + user?.uid }}
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
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Password:</Text>
                        {emailSendingStage ?
                            <Text style={styles.resetSent}>{emailSendingStage == 'sending' ? 'Sending...' : 'Email sent.'}</Text>
                            :
                            <Text style={styles.reset} onPress={passwordReset}>Reset</Text>
                        }
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
    container: { flex: 1 },
    scrollContainer: {
        flexGrow: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
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
        padding: 24,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        gap: 24,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: {
        fontWeight: '500',
        color: '#666',
    },
    value: { color: '#333' },
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
    reset: { color: '#93C572' },
    resetSent: { color: '#333' },
});

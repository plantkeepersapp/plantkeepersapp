import { FIREBASE_AUTH } from '@/firebase.config';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useNotification } from '@/context/NotificationContext';
import { usePlants } from '@/context/PlantContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Profile() {
    const { user } = useAuth();
    const router = useRouter();
    const [showTimePicker, setShowTimePicker] = useState(false);
    const { notificationTime, setNotificationTime, scheduleAggregatedNotificationIfNeeded } = useNotification();
    const { plants } = usePlants();
    const [emailSendingStage, setEmailSendingStage] = useState('');

    useEffect(() => {
        scheduleAggregatedNotificationIfNeeded(plants);
    }, [notificationTime, setNotificationTime]);

    const handleLogout = async () => {
        try {
            await FIREBASE_AUTH.signOut();
            router.replace('/auth/login');
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

    const subTextColor = useThemeColor({}, 'subText');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');
    const linkColor = useThemeColor({}, 'link');
    const cardBackground = useThemeColor({}, 'cardBackground');
    const shadowColor = useThemeColor({}, 'shadow');

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
            borderColor: tintColor,
        },
        name: {
            fontSize: 20,
            fontWeight: '600',
            color: linkColor,
        },
        email: {
            fontSize: 14,
            color: subTextColor,
        },
        card: {
            width: '100%',
            backgroundColor: cardBackground,
            padding: 24,
            borderRadius: 12,
            elevation: 2,
            shadowColor: shadowColor,
            shadowOpacity: 0.06,
            shadowRadius: 6,
            gap: 24,
        },
        infoRow: {
            flexDirection: 'row',
            gap: 12,
        },
        label: {
            fontWeight: '500',
            color: textColor,
            flex: 1,
        },
        value: { color: subTextColor },
        logoutButton: {
            backgroundColor: tintColor,
            paddingVertical: 12,
            paddingHorizontal: 50,
            borderRadius: 999,
            marginTop: 20,
            elevation: 3,
        },
        logoutText: {
            color: linkColor,
            fontSize: 16,
            fontWeight: '600',
        },
        reset: { color: tintColor },
    });

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
                            <Text style={styles.value}>{emailSendingStage == 'sending' ? 'Sending...' : 'Email sent.'}</Text>
                            :
                            <Text style={styles.reset} onPress={passwordReset}>Reset</Text>
                        }
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Notification Time:</Text>
                        <Text style={styles.value}>
                            {notificationTime.hour.toString().padStart(2, '0')}:
                            {notificationTime.minute.toString().padStart(2, '0')}
                        </Text>
                        <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                            <Text style={styles.reset}>Change</Text>
                        </TouchableOpacity>
                        {showTimePicker && (
                            <DateTimePicker
                                value={new Date(2000, 0, 1, notificationTime.hour, notificationTime.minute)}
                                mode="time"
                                is24Hour
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(_, selectedDate) => {
                                    setShowTimePicker(false);
                                    if (selectedDate) {
                                        setNotificationTime({
                                            hour: selectedDate.getHours(),
                                            minute: selectedDate.getMinutes(),
                                        });
                                    }
                                }}
                            />
                        )}
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </ThemedView>
    );
}

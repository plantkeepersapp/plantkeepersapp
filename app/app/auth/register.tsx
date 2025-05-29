import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { FIREBASE_AUTH } from '@/firebase.config';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.replace('/');
        }
    }, [loading, user]);

    const handleRegister = async () => {
        if (!email || !email.includes('@')) {
            setError('An email address is required.');
            return;
        }
        if (!password) {
            setError('Please select a password.');
            return;
        }
        if (!confirmPassword) {
            setError('Please confirm your password.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            setLoading(true);
            await createUserWithEmailAndPassword(FIREBASE_AUTH, email.trim(), password);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const errorColor = useThemeColor({}, 'error');
    const subTextColor = useThemeColor({}, 'subText');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');
    const linkColor = useThemeColor({}, 'link');
    const inputBackground = useThemeColor({}, 'cardBackground');
    const shadowColor = useThemeColor({}, 'shadow');

    const styles = StyleSheet.create({
        inputError: {
            borderColor: errorColor,
            borderWidth: 1,
        },
        formContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
            gap: 16,
        },
        input: {
            width: '100%',
            padding: 12,
            backgroundColor: inputBackground,
            borderRadius: 8,
            fontSize: 16,
            color: textColor,
        },
        button: {
            backgroundColor: tintColor,
            paddingVertical: 10,
            paddingHorizontal: 50,
            borderRadius: 999,
            shadowColor: shadowColor,
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 3,
            marginTop: 12,
        },
        buttonText: {
            color: linkColor,
            fontWeight: '600',
            fontSize: 16,
        },
        loginRedirect: {
            flexDirection: 'row',
            marginTop: 20,
        },
        redirectText: { color: subTextColor },
        loginLink: {
            color: tintColor,
            fontWeight: '600',
        },
    });

    return (
        <ThemedView style={styles.formContainer}>
            <ThemedText type="title">Register</ThemedText>
            <TextInput
                style={[styles.input, error && styles.inputError]}
                keyboardType="email-address"
                placeholder="Email"
                placeholderTextColor={error ? errorColor : subTextColor}
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Password"
                placeholderTextColor={error ? errorColor : subTextColor}
                autoCapitalize="none"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Confirm Password"
                placeholderTextColor={error ? errorColor : subTextColor}
                autoCapitalize="none"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />
            {error ? <Text style={{ color: errorColor }}>{error}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={loading ? () => { } : handleRegister}>
                <Text style={styles.buttonText}>{loading ? 'Loading' : 'Register'}</Text>
            </TouchableOpacity>
            <View style={styles.loginRedirect}>
                <Text style={styles.redirectText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => router.replace('/auth/login')}>
                    <Text style={styles.loginLink}> Login</Text>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}

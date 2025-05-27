import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { FIREBASE_AUTH } from '@/firebase.config';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.replace('/');
        }
    }, [loading, user]);

    const handleLogin = async () => {
        try {
            setLoading(true);
            await signInWithEmailAndPassword(FIREBASE_AUTH, email.trim(), password);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={styles.formContainer}>
            <ThemedText type="title">Login</ThemedText>
            <TextInput
                style={[
                    styles.input,
                    error && styles.inputError,
                ]}
                keyboardType="email-address"
                placeholder="Email"
                placeholderTextColor={error ? '#FA5F55' : '#888'}
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail} />
            <TextInput
                style={[
                    styles.input,
                    error && styles.inputError,
                ]}
                placeholder="Password"
                placeholderTextColor={error ? '#FA5F55' : '#888'}
                autoCapitalize="none"
                value={password}
                secureTextEntry
                onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.button} onPress={loading ? () => { } : handleLogin}>
                <Text style={styles.buttonText}>{loading ? 'Loading' : 'Login'}</Text>
            </TouchableOpacity>
            {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}

            <View style={styles.loginRedirect}>
                <Text style={styles.redirectText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => router.replace('/register')}>
                    <Text style={styles.loginLink}> Register</Text>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    inputError: {
        borderColor: '#FA5F55',
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
        backgroundColor: '#2e2e2e',
        borderRadius: 8,
        fontSize: 16,
        color: '#ffffff',
    },
    button: {
        backgroundColor: '#93C572',
        paddingVertical: 10,
        paddingHorizontal: 50,
        borderRadius: 999,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        marginTop: 12,
    },
    buttonText: {
        color: '#1B4D2B',
        fontWeight: '600',
        fontSize: 16,
    },
    loginRedirect: {
        flexDirection: 'row',
        marginTop: 20,
    },
    redirectText: { color: '#888' },
    loginLink: {
        color: '#1B4D2B',
        fontWeight: '600',
    },
});

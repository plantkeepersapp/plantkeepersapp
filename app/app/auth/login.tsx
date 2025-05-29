import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { FIREBASE_AUTH } from '@/firebase.config';
import { useThemeColor } from '@/hooks/useThemeColor';
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

    const errorColor = useThemeColor({}, 'error');
    const textColor = useThemeColor({}, 'subText');
    const subTextColor = useThemeColor({}, 'subText');
    const inputBackground = useThemeColor({}, 'cardBackground');
    const tintColor = useThemeColor({}, 'tint');
    const linkColor = useThemeColor({}, 'link');
    const shadowColor = useThemeColor({}, 'shadow');

    const styles = StyleSheet.create({
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
            borderWidth: 1,
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
        forgotPassword: {
            flexDirection: 'row',
            width: '100%',
            justifyContent: 'flex-end',
        },
        redirectText: { color: subTextColor },
        loginLink: {
            color: tintColor,
            fontWeight: '600',
        },
    });

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
                    error && { borderColor: errorColor },
                ]}
                keyboardType="email-address"
                placeholder="Email"
                placeholderTextColor={error ? errorColor : subTextColor}
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail} />
            <TextInput
                style={[
                    styles.input,
                    error && { borderColor: errorColor },
                ]}
                placeholder="Password"
                placeholderTextColor={error ? errorColor : subTextColor}
                autoCapitalize="none"
                value={password}
                secureTextEntry
                onChangeText={setPassword}
            />
            <View style={styles.forgotPassword}>
                <Text style={styles.redirectText}>Forgot?</Text>
                <TouchableOpacity onPress={() => router.push('/auth/passReset')}>
                    <Text style={styles.loginLink}> Reset password</Text>
                </TouchableOpacity>
            </View>
            {error ? <Text style={{ color: errorColor }}>{error}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={loading ? () => { } : handleLogin}>
                <Text style={styles.buttonText}>{loading ? 'Loading' : 'Login'}</Text>
            </TouchableOpacity>
            <View style={styles.loginRedirect}>
                <Text style={styles.redirectText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => router.replace('/auth/register')}>
                    <Text style={styles.loginLink}> Register</Text>
                </TouchableOpacity>
            </View>

        </ThemedView>
    );
}

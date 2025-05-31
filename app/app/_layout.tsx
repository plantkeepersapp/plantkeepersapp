import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { Platform, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { PlantProvider } from '@/context/PlantContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AndroidImportance, setNotificationChannelAsync, setNotificationHandler } from 'expo-notifications';
import { useEffect } from 'react';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Style of notifications
setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowAlert: true,
    }),
});

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const backgroundColor = useThemeColor({}, 'background');
    const tintColor = useThemeColor({}, 'tint');
    const [loaded] = useFonts({ SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf') });

    useEffect(() => {
        if (Platform.OS === 'android') {
            setNotificationChannelAsync('plants', {
                name: 'Watering Reminders',
                importance: AndroidImportance.HIGH,
                sound: 'default',
                vibrationPattern: [0, 250, 250, 250],
                lightColor: tintColor,
            });
        }
    }, []);

    if (!loaded) {
        return null;
    }

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <View style={{ flex: 1, backgroundColor }}>
                <AuthProvider>
                    <PlantProvider>
                        <Stack initialRouteName="auth/login">
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
                            <Stack.Screen name="auth/register" options={{ headerShown: false }} />
                            <Stack.Screen name="auth/passReset" options={{ headerShown: false }} />
                            <Stack.Screen name="plant" options={{ headerShown: false }} />
                            <Stack.Screen name="+not-found" />
                        </Stack>
                    </PlantProvider>
                </AuthProvider>
                <StatusBar style="auto" />
            </View>
        </ThemeProvider>
    );
}

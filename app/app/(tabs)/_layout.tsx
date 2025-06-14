import { Tabs, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const [tabVisible, setTabVisible] = useState(true);
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) SplashScreen.hideAsync();
    }, [loading]);

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/auth/login');
        }
    }, [loading, user]);

    useEffect(() => {
        const show = Keyboard.addListener('keyboardDidShow', () => setTabVisible(false));
        const hide = Keyboard.addListener('keyboardDidHide', () => setTabVisible(true));

        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    if (loading) return null;

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarBackground: TabBarBackground,
                tabBarStyle: [
                    Platform.select({
                        ios: { position: 'absolute' },
                        default: {},
                    }),
                    !tabVisible && { display: 'none' },
                ],
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="addPlant"
                options={{
                    title: 'Add plant',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle" color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
                }}
            />
        </Tabs>
    );
}

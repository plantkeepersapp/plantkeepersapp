import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Plant } from '@/context/PlantContext';

export interface NotificationTime {
    hour: number;
    minute: number;
}

interface NotificationContextType {
    notificationTime: NotificationTime;
    setNotificationTime: (time: NotificationTime) => Promise<void>;
    scheduleAggregatedNotificationIfNeeded: (plants: Plant[]) => Promise<void>;
}

const DEFAULT_NOTIFICATION_TIME: NotificationTime = { hour: 18, minute: 0 };
const NOTIFICATION_PREFIX = 'aggregated_notification_';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notificationTime, setNotificationTimeState] = useState<NotificationTime>(DEFAULT_NOTIFICATION_TIME);

    useEffect(() => {
        (async () => {
            if (Platform.OS !== 'web') {
                await Notifications.requestPermissionsAsync();
            }
            const stored = await AsyncStorage.getItem('notificationTime');
            if (stored) {
                setNotificationTimeState(JSON.parse(stored));
            }
        })();
    }, []);

    const setNotificationTime = async (time: NotificationTime) => {
        setNotificationTimeState(time);
        await AsyncStorage.setItem('notificationTime', JSON.stringify(time));
    };

    const clearAllAggregatedNotifications = async () => {
        const keys = await AsyncStorage.getAllKeys();
        const relevantKeys = keys.filter(k => k.startsWith(NOTIFICATION_PREFIX));

        for (const key of relevantKeys) {
            try {
                const id = await AsyncStorage.getItem(key);
                if (id) {
                    await Notifications.cancelScheduledNotificationAsync(id);
                    await AsyncStorage.removeItem(key);
                }
            } catch (err) {
                console.warn(`Failed to cancel notification ${key}:`, err);
            }
        }
    };

    const scheduleAggregatedNotificationIfNeeded = async (plants: Plant[]) => {
        await clearAllAggregatedNotifications();

        const plantsByDate = new Map<string, Plant[]>();
        const now = new Date();

        for (const plant of plants) {
            if (plant.nextWatering == null || plant.nextWatering < 0) continue;

            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() + plant.nextWatering);
            targetDate.setHours(notificationTime.hour, notificationTime.minute, 0, 0);

            const isToday = plant.nextWatering === 0;
            const notificationHasPassedToday = isToday && (
                now.getHours() > notificationTime.hour ||
                (now.getHours() === notificationTime.hour && now.getMinutes() >= notificationTime.minute)
            );

            if (isToday && notificationHasPassedToday) {
                targetDate.setDate(targetDate.getDate() + 1);
            }

            const dateKey = targetDate.toISOString().split('T')[0];

            if (!plantsByDate.has(dateKey)) {
                plantsByDate.set(dateKey, []);
            }
            plantsByDate.get(dateKey)?.push(plant);
        }

        for (const [dateKey, dayPlants] of plantsByDate.entries()) {
            const dateParts = dateKey.split('-').map(Number);
            const [year, month, day] = dateParts;
            const triggerDate = new Date(year, month - 1, day, notificationTime.hour, notificationTime.minute);

            const plantNames = dayPlants.map(p => p.name).join(', ');
            const key = `${NOTIFICATION_PREFIX}${dateKey}`;

            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Time to water your plants!',
                    body: `The following need water: ${plantNames}`,
                    sound: true,
                },
                trigger: triggerDate as any,
            });

            await AsyncStorage.setItem(key, id);
        }

        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        console.log('Updated scheduled notifications:', scheduled);
    };

    return (
        <NotificationContext.Provider
            value={{
                notificationTime,
                setNotificationTime,
                scheduleAggregatedNotificationIfNeeded,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

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

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notificationTime, setNotificationTimeState] = useState<NotificationTime>(DEFAULT_NOTIFICATION_TIME);

    useEffect(() => {
        (async () => {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') {
                const { status: newStatus } = await Notifications.requestPermissionsAsync({
                    ios: {
                        allowAlert: true,
                        allowSound: true,
                        allowBadge: true,
                    },
                });

                if (newStatus !== 'granted') {
                    console.warn('Notification permissions not granted');
                    return;
                }
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            if (Platform.OS !== 'web') {
                await Notifications.setNotificationCategoryAsync('WATER_PLANT_CATEGORY', [
                    {
                        identifier: 'WATERED',
                        buttonTitle: 'Watered',
                        options: { isDestructive: false, opensAppToForeground: true },
                    },
                    {
                        identifier: 'SNOOZE',
                        buttonTitle: 'Remind me tomorrow',
                        options: { isDestructive: false, opensAppToForeground: true },
                    },
                ]);
            }
        })();
    }, []);

    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener(async response => {
            const action = response.actionIdentifier;
            const notificationId = response.notification.request.identifier;
            await Notifications.dismissNotificationAsync(notificationId);

            const data = response.notification.request.content.data as { plantIds?: number[] };
            const plantIds: number[] = Array.isArray(data.plantIds) ? data.plantIds : [];
            if (plantIds.length === 0) return;

            try {
                const stored = await AsyncStorage.getItem('plants');
                if (!stored) return;

                const allPlants: Plant[] = JSON.parse(stored);
                const updatedPlants = allPlants.map(plant => {
                    if (!plantIds.includes(plant.id)) return plant;

                    if (action === 'WATERED') {
                        return {
                            ...plant,
                            nextWatering: plant.nextWatering + (plant.wateringFrequency ?? 7),
                        };
                    }

                    if (action === 'SNOOZE') {
                        return {
                            ...plant,
                            nextWatering: plant.nextWatering + 1,
                        };
                    }

                    return plant;
                });

                await AsyncStorage.setItem('plants', JSON.stringify(updatedPlants));
            } catch (err) {
                console.error('Failed to update plants after notification action:', err);
            }
        });

        return () => subscription.remove();
    }, []);

    useEffect(() => {
        (async () => {
            const storedTime = await AsyncStorage.getItem('notificationTime');
            if (storedTime) {
                try {
                    const parsed = JSON.parse(storedTime);
                    if (
                        typeof parsed.hour === 'number' &&
                        typeof parsed.minute === 'number'
                    ) {
                        setNotificationTimeState(parsed);
                    }
                } catch (e) {
                    console.warn('Failed to parse stored notification time:', e);
                }
            }
        })();
    }, []);

    const setNotificationTime = async (time: NotificationTime) => {
        setNotificationTimeState(time);
        await AsyncStorage.setItem('notificationTime', JSON.stringify(time));
    };

    const scheduleAggregatedNotificationIfNeeded = async (plants: Plant[]) => {
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('Plants:', plants);

        const plantsByDate = new Map<string, Plant[]>();
        const now = new Date();

        for (const plant of plants) {
            if (plant.nextWatering == null) continue;

            const targetDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + plant.nextWatering,
                notificationTime.hour,
                notificationTime.minute,
                0,
                0,
            );

            const isToday = plant.nextWatering === 0;
            const notificationHasPassedToday = isToday && (
                now.getHours() > notificationTime.hour ||
                (now.getHours() === notificationTime.hour && now.getMinutes() >= notificationTime.minute)
            );

            if (isToday && notificationHasPassedToday) {
                targetDate.setDate(targetDate.getDate() + 1);
            }

            if (targetDate <= now) {
                targetDate.setDate(targetDate.getDate() + 1);
            }

            const dateKey = targetDate.getFullYear() + '-' +
                String(targetDate.getMonth() + 1).padStart(2, '0') + '-' +
                String(targetDate.getDate()).padStart(2, '0');

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

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Time to water your plants!',
                    body: `The following need water: ${plantNames}`,
                    sound: true,
                    categoryIdentifier: 'WATER_PLANT_CATEGORY',
                    data: { plantIds: dayPlants.map(p => p.id) },
                },
                trigger: new Date(triggerDate) as any,
            });

        }
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        console.log('Scheduled notifications:', scheduled);
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

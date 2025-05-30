import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface Plant {
    name: string;
    type: string;
    waterNeeds: string;
    lightNeeds: string;
    careSummary: string;
    nextWatering?: string;
    wateringFrequency?: number;
}

interface NotificationTime {
    hour: number;
    minute: number;
}

interface PlantContextType {
    plants: Plant[];
    addPlant: (plant: Plant) => Promise<void>;
    deletePlant: (index: number) => Promise<void>;
    refreshPlants: () => Promise<void>;
    setNextWatering: (index: number, date: Date) => Promise<void>;
    setWateringFrequency: (index: number, frequency: number) => Promise<void>;
    notificationTime: NotificationTime;
    setNotificationTime: (time: NotificationTime) => Promise<void>;
}

const DEFAULT_NOTIFICATION_TIME = { hour: 18, minute: 0 };

const PlantContext = createContext<PlantContextType | undefined>(undefined);

export const PlantProvider = ({ children }: { children: ReactNode; }) => {
    const [plants, setPlants] = useState<Plant[]>([]);
    const [notificationTime, setNotificationTimeState] = useState<NotificationTime>(DEFAULT_NOTIFICATION_TIME);

    useEffect(() => {
        (async () => {
            if (Platform.OS !== 'web') {
                await Notifications.requestPermissionsAsync();
            }
            const stored = await AsyncStorage.getItem('notificationTime');
            if (stored) setNotificationTimeState(JSON.parse(stored));
        })();
    }, []);

    const setNotificationTime = async (time: NotificationTime) => {
        setNotificationTimeState(time);
        await AsyncStorage.setItem('notificationTime', JSON.stringify(time));
        plants.forEach((plant, i) => scheduleWateringNotification(plant, i, time));
    };

    const scheduleWateringNotification = async (
        plant: Plant,
        index: number,
        notifTime: NotificationTime = notificationTime,
    ) => {
        if (!plant.nextWatering) return;

        const nextWateringDate = new Date(plant.nextWatering);
        nextWateringDate.setHours(notifTime.hour, notifTime.minute, 0, 0);

        const notificationIdKey = `plant_notification_${index}`;
        const prevId = await AsyncStorage.getItem(notificationIdKey);
        if (prevId) {
            try {
                await Notifications.cancelScheduledNotificationAsync(prevId);
            } catch { }
        }

        if (nextWateringDate > new Date()) {
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `Time to water ${plant.name}!`,
                    body: `Don't forget to water your ${plant.type} today.`,
                    sound: true,
                },
                trigger: {
                    hour: notifTime.hour,
                    minute: notifTime.minute,
                    repeats: false,
                } as any,
            });
            await AsyncStorage.setItem(notificationIdKey, id);
        }
    };

    const loadPlants = async () => {
        try {
            const data = await AsyncStorage.getItem('plants');
            if (data) {
                const loadedPlants = JSON.parse(data);
                setPlants(loadedPlants);
                loadedPlants.forEach((plant: Plant, i: number) => {
                    scheduleWateringNotification(plant, i);
                });
            } else {
                setPlants([]);
            }
        } catch (error) {
            console.error('Failed to load plants:', error);
        }
    };

    const addPlant = async (plant: Plant) => {
        try {
            const updatedPlants = [...plants, plant];
            await AsyncStorage.setItem('plants', JSON.stringify(updatedPlants));
            setPlants(updatedPlants);
        } catch (error) {
            console.error('Failed to add plant:', error);
        }
    };

    const deletePlant = async (index: number) => {
        try {
            const updatedPlants = plants.filter((_, i) => i != index);
            await AsyncStorage.setItem('plants', JSON.stringify(updatedPlants));
            setPlants(updatedPlants);
        } catch (error) {
            console.error('Failed to delete plant:', error);
        }
    };

    const setNextWatering = async (index: number, date: Date) => {
        try {
            const updatedPlants = plants.map((plant, i) =>
                i === index ? { ...plant, nextWatering: date.toISOString() } : plant,
            );
            await AsyncStorage.setItem('plants', JSON.stringify(updatedPlants));
            setPlants(updatedPlants);

            // Schedule notification for this plant
            await scheduleWateringNotification(updatedPlants[index], index, notificationTime);
        } catch (error) {
            console.error('Failed to set next watering:', error);
        }
    };

    const setWateringFrequency = async (index: number, frequency: number) => {
        try {
            const updatedPlants = plants.map((plant, i) =>
                i === index ? { ...plant, wateringFrequency: frequency } : plant,
            );
            await AsyncStorage.setItem('plants', JSON.stringify(updatedPlants));
            setPlants(updatedPlants);
        } catch (error) {
            console.error('Failed to set watering frequency:', error);
        }
    };

    useEffect(() => {
        loadPlants();
    }, []);

    return (
        <PlantContext.Provider value={{
            plants,
            addPlant,
            deletePlant,
            refreshPlants: loadPlants,
            setNextWatering,
            setWateringFrequency,
            notificationTime,
            setNotificationTime,
        }}>
            {children}
        </PlantContext.Provider>
    );
};

export const usePlants = () => {
    const context = useContext(PlantContext);
    if (!context) {
        throw new Error('usePlants must be used within a PlantProvider');
    }
    return context;
};

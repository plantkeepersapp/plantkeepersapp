import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotification } from '@/context/NotificationContext';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import * as API from '@/API/plantApi';
import { onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from '@/firebase.config';

export interface PlantCareItem {
    id: number;
    name: string;
    scientific_name: string;
}

export interface PlantCare extends PlantCareItem {
    water_frequency: number;
    light_requirements: string;
    humidity_level: string;
    temperature_range: string;
    soil_type: string;
    fertilizer_frequency: number;
    care_summary: string;
}

export interface Plant {
    id: number;
    name: string;
    care?: PlantCare;
    description: string;
    image_url: string;
    last_watered: string | null;
    last_fertilized: string | null;
    plantcare_id?: number;
    wateringFrequency: number; // when overriden locally
    nextWatering: number;
}

interface PlantContextType {
    plants: Plant[];
    addPlant: (plant: Partial<Plant>) => Promise<void>;
    deletePlant: (index: number) => Promise<void>;
    refreshPlants: () => Promise<void>;
    markAsWatered: (index: number) => Promise<void>;
    setNextWatering: (index: number, daysLeft: number) => Promise<void>;
    setWateringFrequency: (index: number, frequency: number) => Promise<void>;
}

const PlantContext = createContext<PlantContextType | undefined>(undefined);

export const PlantProvider = ({ children }: { children: ReactNode; }) => {
    const [plants, setPlants] = useState<Plant[]>([]);
    const { scheduleAggregatedNotificationIfNeeded } = useNotification();

    useEffect(() => {
        scheduleAggregatedNotificationIfNeeded(plants);
    }, [plants, setPlants]);

    useEffect(() => {
        onAuthStateChanged(FIREBASE_AUTH, loadPlants);
    }, []);

    const loadPlants = async () => {
        try {
            const onlineData = await API.getPlants();
            if (onlineData) {
                // Set initial values for nextWatering and wateringFrequency if missing
                const loadedPlants: Plant[] = onlineData.map((plant: Plant) => {
                    const freq = plant.care?.water_frequency ?? 7;
                    return {
                        ...plant,
                        wateringFrequency: plant.wateringFrequency ?? freq,
                        nextWatering: plant.nextWatering ?? freq,
                    };
                });
                setPlants(loadedPlants);
            }
        } catch (err) {
            console.error(err);
            console.warn('Using offline data');
            try {
                const offlineData = await AsyncStorage.getItem('plants');
                if (offlineData) {
                    const loadedPlants: Plant[] = JSON.parse(offlineData).map((plant: Plant) => {
                        const freq = plant.care?.water_frequency ?? 7;
                        return {
                            ...plant,
                            wateringFrequency: plant.wateringFrequency ?? freq,
                            nextWatering: plant.nextWatering ?? freq,
                        };
                    });
                    setPlants(loadedPlants);
                } else {
                    setPlants([]);
                }
            } catch (error) {
                console.error('Failed to load plants:', error);
            }
        }
    };

    const addPlant = async (plant: Partial<Plant>) => {
        try {
            await API.createPlant(plant);
            await loadPlants();
        } catch (error) {
            console.error('Failed to add plant:', error);
        }
    };

    const deletePlant = async (index: number) => {
        try {
            await API.deletePlant(index);
            await loadPlants();
        } catch (error) {
            console.error('Failed to delete plant:', error);
        }
    };

    const markAsWatered = async (index: number) => {
        await API.markWatered(index);
        await loadPlants();
    };

    const setNextWatering = async (plantId: number, daysLeft: number) => {
        try {
            const updatedPlants = plants.map(plant =>
                plant.id === plantId
                    ? { ...plant, nextWatering: daysLeft }
                    : plant,
            );
            await AsyncStorage.setItem('plants', JSON.stringify(updatedPlants));
            setPlants(updatedPlants);
        } catch (error) {
            console.error('Failed to set next watering:', error);
        }
    };

    const setWateringFrequency = async (plantId: number, frequency: number) => {
        try {
            const updatedPlants = plants.map(plant =>
                plant.id === plantId
                    ? { ...plant, wateringFrequency: frequency }
                    : plant,
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
        <PlantContext.Provider
            value={{
                plants,
                addPlant,
                deletePlant,
                refreshPlants: loadPlants,
                markAsWatered,
                setNextWatering,
                setWateringFrequency,
            }}
        >
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

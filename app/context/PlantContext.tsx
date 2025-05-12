import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface Plant {
  name: string;
  type: string;
}

interface PlantContextType {
  plants: Plant[];
  addPlant: (plant: Plant) => Promise<void>;
  refreshPlants: () => Promise<void>;
}

const PlantContext = createContext<PlantContextType | undefined>(undefined);

export const PlantProvider = ({ children }: { children: ReactNode; }) => {
    const [plants, setPlants] = useState<Plant[]>([]);

    const loadPlants = async () => {
        try {
            const data = await AsyncStorage.getItem('plants');
            if (data) {
                setPlants(JSON.parse(data));
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

    useEffect(() => {
        loadPlants();
    }, []);

    return (
        <PlantContext.Provider value={{ plants, addPlant, refreshPlants: loadPlants }}>
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

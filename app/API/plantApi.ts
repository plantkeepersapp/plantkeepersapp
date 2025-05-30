import apiFetch from '@/API/api';
import { Plant } from '@/context/PlantContext';

export const createPlant = async (plant: Plant) => {
    return apiFetch('/plant-care/', {
        method: 'POST',
        body: JSON.stringify(plant),
    });
};

export const getPlants = async () => {
    return apiFetch('/plants/', { method: 'GET' });
};

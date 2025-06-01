import apiFetch from '@/API/api';
import { Plant, PlantCare, PlantCareItem } from '@/context/PlantContext';

// PLANTS

export const createPlant = async (plant: Partial<Plant>) => {
    return apiFetch('/plants/', {
        method: 'POST',
        body: JSON.stringify(plant),
    });
};

export const getPlants = async () => {
    return apiFetch('/plants/', { method: 'GET' });
};

export const updatePlant = async (id: number, updates: Partial<Plant>) => {
    return apiFetch(`/plants/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
};

export const deletePlant = async (id: number) => {
    return apiFetch(`/plants/${id}/`, { method: 'DELETE' });
};

// Actions: Mark as watered/fertilized now
export const markWatered = async (id: number) => {
    return apiFetch(`/plants/${id}/`, { method: 'PUT', body: JSON.stringify({ 'mark_watered': true }) });
};

export const markFertilized = async (id: number) => {
    return apiFetch(`/plants/${id}/`, { method: 'PATCH' });
};

// PLANT CARE TYPES

export const getPlantCareTypes = async () => {
    return apiFetch('/plant-care/', { method: 'GET' }); // List with name and scientific_name
};

export const createPlantCareType = async (plantCare: Partial<PlantCare>) => {
    return apiFetch('/plant-care/', {
        method: 'POST',
        body: JSON.stringify(plantCare),
    });
};

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { usePlants } from '@/context/PlantContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

export default function AddPlantForm(): JSX.Element {
    const { addPlant } = usePlants();
    const [plantName, setPlantName] = useState('');
    const [plantType, setPlantType] = useState('');
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);

    const router = useRouter();

    const handleSubmit = async () => {
        setAttemptedSubmit(true);

        if (!plantName.trim() || !plantType.trim()) return;

        const newPlant = {
            name: plantName.trim(),
            type: plantType.trim(),
        };

        await addPlant(newPlant);

        setPlantName('');
        setPlantType('');
        setAttemptedSubmit(false);

        router.back();
    };

    return (
        <ThemedView style={styles.formContainer}>
            <ThemedText type="subtitle">Add a new plant 🌿</ThemedText>

            <TextInput
                style={[
                    styles.input,
                    attemptedSubmit && !plantName.trim() && styles.inputError,
                ]}
                placeholder="Plant name"
                placeholderTextColor={attemptedSubmit && !plantName.trim() ? '#FA5F55' : '#888'}
                value={plantName}
                maxLength={30}
                onChangeText={setPlantName}
            />
            <TextInput
                style={[
                    styles.input,
                    attemptedSubmit && !plantType.trim() && styles.inputError,
                ]}
                placeholder="Plant type"
                placeholderTextColor={attemptedSubmit && !plantType.trim() ? '#FA5F55' : '#888'}
                value={plantType}
                maxLength={30}
                onChangeText={setPlantType}
            />

            <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
                <Text style={styles.addButtonText}>Save Plant</Text>
            </TouchableOpacity>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    inputError: {
        borderColor: '#FA5F55',
        borderWidth: 1,
    },
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
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        fontSize: 16,
        color: '#333',
    },
    addButton: {
        backgroundColor: '#93C572',
        paddingVertical: 10,
        paddingHorizontal: 50,
        borderRadius: 999,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        marginTop: 12,
    },
    addButtonText: {
        color: '#1B4D2B',
        fontWeight: '600',
        fontSize: 16,
    },
});

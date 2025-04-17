import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

/**
 * Props for the AddPlantForm component.
 * 
 * @typedef {Object} AddPlantFormProps
 * @property {(plantName: string, plantType: string) => void} onSubmit - Callback to handle submission of plant data.
 * @property {() => void} onCancel - Callback to handle form cancellation.
 */
interface AddPlantFormProps {
    onSubmit: (plantName: string, plantType: string) => void;
    onCancel: () => void;
};

/**
 * A form component that allows the user to add a new plant by entering a name and type.
 *
 * @param {AddPlantFormProps} props - The props for the component.
 * @returns {JSX.Element} The rendered form component.
 */
export const AddPlantForm = ({ onSubmit, onCancel }: AddPlantFormProps): JSX.Element => {
    const [plantName, setPlantName] = useState('');
    const [plantType, setPlantType] = useState('');
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);

    /**
     * Handles form submission by validating inputs and invoking the onSubmit callback.
     * Highlights fields if any required input is missing.
     */
    const handleSubmit = () => {
        setAttemptedSubmit(true);

        if (!plantName.trim() || !plantType.trim()) return;

        onSubmit(plantName.trim(), plantType.trim());
        setPlantName('');
        setPlantType('');
        setAttemptedSubmit(false);
    };

    return (
        <ThemedView style={styles.formContainer}>
            <TouchableOpacity style={styles.closeIcon} onPress={onCancel}>
                <IconSymbol name="xmark" size={28} color={"#FFFFFF"} />
            </TouchableOpacity>

            <ThemedText type="subtitle">Add a new plant 🌿</ThemedText>

            <TextInput
                style={[
                    styles.input,
                    attemptedSubmit && !plantName.trim() && styles.inputError
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
                    attemptedSubmit && !plantType.trim() && styles.inputError
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

};

const styles = StyleSheet.create({
    inputError: {
        borderColor: '#FA5F55',
        borderWidth: 1,
    },
    closeIcon: {
        position: 'absolute',
        top: -20,
        right: 5,
        padding: 3,
        zIndex: 1,
        backgroundColor: '#333',
        borderRadius: 999,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 12,
    },
    cancelButton: {
        backgroundColor: '#ccc',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 999,
    },
    cancelButtonText: {
        color: '#333',
        fontWeight: '600',
        fontSize: 16,
    },

    formContainer: {
        gap: 16,
        alignItems: 'center',
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

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

import { createPlant, createPlantCareType, getPlantCareTypes } from '@/API/plantApi';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { PlantCareItem } from '@/context/PlantContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import DropdownSelect from 'react-native-input-select';

export default function AddPlantForm(): JSX.Element {
    const [plantName, setPlantName] = useState('');
    const [plantCareId, setPlantCareId] = useState('');
    const [plantCareOptions, setPlantCareOptions] = useState<PlantCareItem[]>([]);
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const fetchCareOptions = async () => {
            const careTypes = await getPlantCareTypes();
            setPlantCareOptions(careTypes);
        };
        fetchCareOptions();
    }, []);

    const handleSubmit = async () => {
        setAttemptedSubmit(true);

        if (!plantName.trim() || !plantCareId) return;

        const newPlant = await createPlant({
            name: plantName.trim(),
            plantcare_id: plantCareId,
        });

        setPlantName('');
        setPlantCareId('');
        setAttemptedSubmit(false);
        router.back();
    };

    const errorColor = useThemeColor({}, 'error');
    const subTextColor = useThemeColor({}, 'subText');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');
    const linkColor = useThemeColor({}, 'link');
    const inputBackground = useThemeColor({}, 'cardBackground');
    const shadowColor = useThemeColor({}, 'shadow');

    const styles = StyleSheet.create({
        inputError: {
            borderColor: errorColor,
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
            backgroundColor: inputBackground,
            borderRadius: 8,
            fontSize: 16,
            color: textColor,
        },
        addButton: {
            backgroundColor: tintColor,
            paddingVertical: 10,
            paddingHorizontal: 50,
            borderRadius: 999,
            shadowColor: shadowColor,
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 3,
            marginTop: 12,
        },
        addButtonText: {
            color: linkColor,
            fontWeight: '600',
            fontSize: 16,
        },
    });

    return (
        <ThemedView style={styles.formContainer}>
            <ThemedText type="subtitle">Add a new plant 🌿</ThemedText>

            <TextInput
                style={[
                    styles.input,
                    attemptedSubmit && !plantName.trim() && styles.inputError,
                ]}
                placeholder="Plant name"
                placeholderTextColor={attemptedSubmit && !plantName.trim() ? errorColor : subTextColor}
                value={plantName}
                maxLength={30}
                onChangeText={setPlantName}
            />

            <DropdownSelect
                label="Plant type"
                placeholder="Select an option..."
                options={plantCareOptions.map(plantCare => ({ label: `${plantCare.name} (${plantCare.scientific_name})`, value: plantCare.id }))
                    .concat([{ label: 'Add new...', value: '__add__' }])}
                selectedValue=""
                onValueChange={value => {
                    if (value === '__add__') {
                        // TODO
                    }
                    setPlantCareId(value?.toString() || '');
                }}
                primaryColor={tintColor}
                isMultiple={false}
            />

            <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
                <Text style={styles.addButtonText}>Save Plant</Text>
            </TouchableOpacity>
        </ThemedView>
    );
}

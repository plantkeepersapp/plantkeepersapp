import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';

import { createPlantCareType, getPlantCareTypes } from '@/API/plantApi';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { PlantCareItem, usePlants } from '@/context/PlantContext';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function AddPlantForm(): JSX.Element {
    const { addPlant } = usePlants();
    const [plantName, setPlantName] = useState('');
    const [plantCareId, setPlantCareId] = useState<number | null>(null);
    const [plantCareOptions, setPlantCareOptions] = useState<PlantCareItem[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [addingNewType, setAddingNewType] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [newTypeScientificName, setNewTypeScientificName] = useState('');
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [attemptedCreate, setAttemptedCreate] = useState(false);
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const fetchPlantCareOptions = async () => {
            const options = await getPlantCareTypes();
            setPlantCareOptions(options);
        };
        fetchPlantCareOptions();
    }, []);

    const handleSubmit = async () => {
        setAttemptedSubmit(true);
        if (!plantName.trim() || !plantCareId) return;

        await addPlant({
            name: plantName.trim(),
            plantcare_id: plantCareId,
        });

        setPlantName('');
        setPlantCareId(null);
        setAttemptedSubmit(false);
        router.back();
    };

    const handleCreateNewType = async () => {
        if (!newTypeName.trim()) {
            setAttemptedCreate(true);
            return;
        }
        setLoading(true);
        const created = await createPlantCareType({
            name: newTypeName.trim(),
            scientific_name: newTypeScientificName.trim(),
        });
        setLoading(false);

        if (created?.id) {
            setPlantCareOptions(prev => [...prev, created]);
            setPlantCareId(created.id);
            setModalVisible(false);
            setAddingNewType(false);
            setNewTypeName('');
            setNewTypeScientificName('');
            setAttemptedCreate(false);
        }
    };

    const errorColor = useThemeColor({}, 'error');
    const subTextColor = useThemeColor({}, 'subText');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');
    const linkColor = useThemeColor({}, 'link');
    const inputBackground = useThemeColor({}, 'cardBackground');
    const elevatedBackground = useThemeColor({}, 'elevatedBackground');
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
            alignItems: 'center',
        },
        addButtonText: {
            color: linkColor,
            fontWeight: '600',
            fontSize: 16,
        },
        pickerWrapper: {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            borderRadius: 8,
            backgroundColor: inputBackground,
            justifyContent: 'space-between',
            gap: 8,
        },
        pickerText: {
            fontSize: 16,
            color: textColor,
            flex: 1,
        },
        pickerIcon: {
            fontSize: 18,
            color: subTextColor,
        },
        modalContainer: {
            flex: 1,
            backgroundColor: '#00000066',
            justifyContent: 'flex-end',
        },
        modalContent: {
            backgroundColor: elevatedBackground,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 24,
        },
        buttonRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 12,
        },
        flexButton: { flex: 1 },
    });

    return (
        <ThemedView style={styles.formContainer}>
            <ThemedText type="subtitle">Add a new plant 🌿</ThemedText>

            <TextInput
                style={[styles.input, attemptedSubmit && !plantName.trim() && styles.inputError]}
                placeholder="Plant name"
                placeholderTextColor={attemptedSubmit && !plantName.trim() ? errorColor : subTextColor}
                value={plantName}
                maxLength={30}
                onChangeText={setPlantName}
            />

            <TouchableOpacity
                style={[styles.pickerWrapper, attemptedSubmit && !plantCareId && styles.inputError]}
                onPress={() => { setAddingNewType(false); setModalVisible(true); }}
            >
                <Text style={styles.pickerText}>
                    {plantCareId
                        ? plantCareOptions.find(p => p.id === plantCareId)?.name
                        : 'Select plant type'}
                </Text>
                <Text style={styles.pickerIcon}>
                    <IconSymbol name="chevron.down" color={subTextColor} />
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
                <Text style={styles.addButtonText}>Save Plant</Text>
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.modalContainer}
                    activeOpacity={1}
                    onPressOut={() => !loading && setModalVisible(false)}
                >
                    <KeyboardAvoidingView
                        style={styles.modalContent}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    >
                        {!addingNewType ? (
                            <>
                                <FlatList
                                    data={plantCareOptions}
                                    keyExtractor={item => item.id.toString()}
                                    renderItem={({ item }) => (
                                        <Pressable
                                            style={[styles.pickerWrapper, { backgroundColor: elevatedBackground }]}
                                            onPress={() => {
                                                setPlantCareId(item.id);
                                                setModalVisible(false);
                                            }}
                                        >
                                            <Text style={styles.pickerText}>
                                                🌱 {item.name} {item.scientific_name ? `(${item.scientific_name})` : ''}
                                            </Text>
                                        </Pressable>
                                    )}
                                />
                                <KeyboardAvoidingView style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={[styles.addButton, { marginTop: 16, backgroundColor: inputBackground }]}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={[styles.addButtonText, { color: textColor }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.addButton, { marginTop: 16 }]}
                                        onPress={() => {
                                            setAddingNewType(true);
                                            setAttemptedCreate(false);
                                        }}
                                    >
                                        <Text style={styles.addButtonText}>Add New</Text>
                                    </TouchableOpacity>
                                </KeyboardAvoidingView>
                            </>
                        ) : (
                            <>
                                <TextInput
                                    style={[styles.input, { backgroundColor: elevatedBackground }, attemptedCreate && !newTypeName.trim() && styles.inputError]}
                                    placeholder="Plant type name"
                                    placeholderTextColor={subTextColor}
                                    value={newTypeName}
                                    onChangeText={setNewTypeName}
                                />
                                <TextInput
                                    style={[styles.input, { backgroundColor: elevatedBackground }]}
                                    placeholder="Scientific name (optional)"
                                    placeholderTextColor={subTextColor}
                                    value={newTypeScientificName}
                                    onChangeText={setNewTypeScientificName}
                                />
                                {loading ? (
                                    <ActivityIndicator size="large" color={tintColor} style={{ marginTop: 12 }} />
                                ) : (
                                    <KeyboardAvoidingView style={styles.buttonRow}>
                                        <TouchableOpacity
                                            style={[styles.addButton, styles.flexButton, { backgroundColor: inputBackground }]}
                                            onPress={() => {
                                                setAddingNewType(false);
                                                setNewTypeName('');
                                                setNewTypeScientificName('');
                                            }}
                                        >
                                            <Text style={[styles.addButtonText, { color: textColor }]}>Back</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.addButton, styles.flexButton]}
                                            onPress={handleCreateNewType}
                                        >
                                            <Text style={styles.addButtonText}>Add</Text>
                                        </TouchableOpacity>
                                    </KeyboardAvoidingView>
                                )}
                            </>
                        )}
                    </KeyboardAvoidingView>
                </TouchableOpacity>
            </Modal>
        </ThemedView>
    );
}

import { FallingDrops } from '@/components/FallingDrops';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { usePlants } from '@/context/PlantContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function getDaysLeft(nextWatering: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(nextWatering);
    target.setHours(0, 0, 0, 0);
    const diff = target.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function PlantSummary() {
    const { id } = useLocalSearchParams();
    const [showDropAnim, setShowDropAnim] = useState(false);
    const [showWaterSettings, setShowWaterSettings] = useState(false);
    const { plants, deletePlant, setNextWatering, setWateringFrequency } = usePlants();

    const plantId = parseInt(id.toString());
    const plant = plants[plantId];
    const nextWatering = plant.nextWatering;
    const [showPicker, setShowPicker] = useState(false);

    const [wateringFrequency, setWateringFrequencyState] = useState<number>(
        plant.wateringFrequency,
    );
    const [showFreqInput, setShowFreqInput] = useState(false);

    const router = useRouter();

    const handleDelete = async () => {
        await deletePlant(plantId);
        router.back();
    };

    const handleWaterToday = async () => {
        setShowDropAnim(true);
        await setNextWatering(plantId, wateringFrequency);
    };

    const handleSetWateringDate = async (_: any, selectedDate?: Date) => {
        if (selectedDate) {
            await setNextWatering(plantId, getDaysLeft(selectedDate));
        }
        setShowPicker(false);
    };

    const cardBackground = useThemeColor({}, 'cardBackground');
    const elevatedBackground = useThemeColor({}, 'elevatedBackground');
    const tintColor = useThemeColor({}, 'tint');
    const textColor = useThemeColor({}, 'text');
    const subTextColor = useThemeColor({}, 'subText');
    const errorColor = useThemeColor({}, 'error');
    const shadowColor = useThemeColor({}, 'shadow');

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            padding: 24,
        },
        subtitle: {
            color: subTextColor,
            fontSize: 16,
            marginTop: 4,
            marginBottom: 16,
        },
        cardRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 24,
        },
        infoCard: {
            flex: 1,
            backgroundColor: cardBackground,
            padding: 16,
            borderRadius: 12,
            elevation: 2,
            shadowColor: shadowColor,
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 2 },
        },
        cardTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: tintColor,
            marginBottom: 8,
        },
        cardContent: {
            fontSize: 14,
            color: textColor,
        },
        summaryContainer: {
            backgroundColor: elevatedBackground,
            padding: 16,
            borderRadius: 12,
            shadowColor: shadowColor,
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 2 },
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: tintColor,
            marginBottom: 8,
        },
        summaryText: {
            fontSize: 14,
            color: textColor,
            lineHeight: 20,
        },
        header: { marginBottom: 16 },
        titleContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        iconRow: {
            flexDirection: 'row',
            gap: 12,
        },
        iconButton: {
            padding: 6,
            alignItems: 'center',
            justifyContent: 'center',
        },
        settingsButton: {
            padding: 6,
            marginTop: -30,
            alignItems: 'center',
            justifyContent: 'center',
        },
        freqButton: {
            backgroundColor: tintColor,
            paddingVertical: 4,
            paddingHorizontal: 14,
            borderRadius: 8,
        },
        freqButtonText: {
            color: '#fff',
            fontWeight: '900',
        },
        modalOverlay: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
        },
        modalContainer: {
            width: '90%',
            backgroundColor: elevatedBackground,
            padding: 20,
            paddingTop: 40,
            borderRadius: 12,
            shadowColor: shadowColor,
            shadowOpacity: 0.2,
            shadowOffset: { width: 0, height: 2 },
        },
        closeIcon: {
            position: 'absolute',
            top: 5,
            right: 5,
            padding: 3,
            zIndex: 1,
            backgroundColor: '#333',
            borderRadius: 999,
        },
        settingsList: {
            marginTop: 12,
            gap: 12,
        },

        settingsItem: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: cardBackground,
            padding: 12,
            borderRadius: 10,
            elevation: 2,
            shadowColor: shadowColor,
            shadowOpacity: 0.05,
            shadowOffset: { width: 0, height: 1 },
            gap: 12,
        },
        settingsText: {
            fontSize: 16,
            color: textColor,
        },

    });

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <ThemedText type="title">{plant.name}</ThemedText>
                    <View style={styles.iconRow}>
                        <TouchableOpacity onPress={() => setShowWaterSettings(true)} style={styles.iconButton}>
                            <IconSymbol name="gear" size={24} color={tintColor} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
                            <IconSymbol name="trash" size={30} color={errorColor} />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.subtitle}>{plant.type}</Text>
            </View>
            <Modal
                animationType="slide"
                transparent
                visible={showWaterSettings}
                onRequestClose={() => setShowWaterSettings(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.settingsList}>
                            <TouchableOpacity style={styles.settingsItem} onPress={handleWaterToday}>
                                <IconSymbol name="drop.fill" size={20} color={tintColor} />
                                <Text style={styles.settingsText}>Mark as Watered Today</Text>
                            </TouchableOpacity>
                            <FallingDrops
                                visible={showDropAnim}
                                onEnd={() => setShowDropAnim(false)}
                            />

                            <TouchableOpacity style={styles.settingsItem} onPress={() => setShowPicker(true)}>
                                <IconSymbol name="calendar" size={20} color={tintColor} />
                                <Text style={styles.settingsText}>Set Next Watering Date</Text>
                            </TouchableOpacity>

                            <View
                                style={[
                                    styles.settingsItem,
                                    { flexDirection: 'column', alignItems: 'flex-start' },
                                ]}
                            >
                                <TouchableOpacity
                                    onPress={() => setShowFreqInput(!showFreqInput)}
                                    style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}
                                >
                                    <IconSymbol name="timer.circle" size={20} color={tintColor} />
                                    <Text style={[styles.settingsText, { flex: 1, marginLeft: 8 }]}>
                                        Change Watering Frequency
                                    </Text>
                                    <IconSymbol
                                        name={showFreqInput ? 'arrowtriangle.up.fill' : 'arrowtriangle.down.fill'}
                                        size={24}
                                        color={tintColor}
                                    />
                                </TouchableOpacity>

                                {showFreqInput && (
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 12,
                                            marginTop: 12,
                                            marginLeft: 28,
                                        }}
                                    >
                                        <Text style={{ color: textColor, fontSize: 16 }}>Water every</Text>

                                        <TouchableOpacity
                                            onPress={async () => {
                                                const newFreq = Math.max(1, wateringFrequency - 1);
                                                setWateringFrequencyState(newFreq);
                                                await setWateringFrequency(plantId, newFreq);
                                            }}
                                            style={[styles.freqButton, { minWidth: 36 }]}
                                        >
                                            <Text style={styles.freqButtonText}>−</Text>
                                        </TouchableOpacity>

                                        <Text style={{ fontSize: 16, color: textColor }}>
                                            {wateringFrequency} day{wateringFrequency !== 1 ? 's' : ''}
                                        </Text>

                                        <TouchableOpacity
                                            onPress={async () => {
                                                const newFreq = wateringFrequency + 1;
                                                setWateringFrequencyState(newFreq);
                                                await setWateringFrequency(plantId, newFreq);
                                            }}
                                            style={[styles.freqButton, { minWidth: 36 }]}
                                        >
                                            <Text style={styles.freqButtonText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                        </View>
                        {showPicker && (
                            <DateTimePicker
                                value={new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleSetWateringDate}
                            />
                        )}

                        <TouchableOpacity style={styles.closeIcon} onPress={() => setShowWaterSettings(false)}>
                            <IconSymbol name="xmark" size={28} color={'#FFFFFF'} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.cardRow}>
                <View style={styles.infoCard}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.cardTitle}>💧 Water Needs</Text>
                    </View>
                    <Text style={styles.cardContent}>
                        Water every {wateringFrequency} day{wateringFrequency == 1 ? ', ' : 's, '}
                        {nextWatering === 0
                            ? 'water today!'
                            : `${nextWatering} day${nextWatering === 1 ? '' : 's'} left until next watering.`}
                    </Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.cardTitle}>☀️ Light Needs</Text>
                    <Text style={styles.cardContent}>{plant.lightNeeds}</Text>
                </View>
            </View>

            <ScrollView style={styles.summaryContainer}>
                <Text style={styles.sectionTitle}>Plant Care Summary</Text>
                <Text style={styles.summaryText}>{plant.careSummary}</Text>
            </ScrollView>
        </ThemedView>
    );
}

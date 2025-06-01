import { FallingDrops } from '@/components/FallingDrops';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { usePlants } from '@/context/PlantContext';
import { useNotification } from '@/context/NotificationContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    const { notificationTime } = useNotification();
    const [showDropAnim, setShowDropAnim] = useState(false);
    const [showWaterSettings, setShowWaterSettings] = useState(false);
    const { plants, deletePlant, markAsWatered, setNextWatering, setWateringFrequency } = usePlants();

    const plantId = parseInt(id.toString());

    const plant = plants.find(p => p.id == plantId);
    if (!plant) return <ThemedText>Plant not found!</ThemedText>;

    const nextWateringDate = plant.last_watered ? new Date(new Date(plant.last_watered).getTime() + (plant.wateringFrequency || plant.care?.water_frequency || 7) * 24 * 60 * 60 * 1000) : new Date();
    const nextWatering = getDaysLeft(nextWateringDate);
    const [showPicker, setShowPicker] = useState(false);

    const [wateringFrequency, setWateringFrequencyState] = useState<number>(plant.care?.water_frequency || 7);
    const [showFreqInput, setShowFreqInput] = useState(false);

    const router = useRouter();

    const handleDelete = async () => {
        await deletePlant(plantId);
        router.back();
    };

    const handleWaterToday = async () => {
        setShowDropAnim(true);
        await markAsWatered(plantId);
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
    const linkColor = useThemeColor({}, 'link');

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
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            width: '100%',
            minWidth: 0,
        },
        iconRow: {
            flexDirection: 'row',
            gap: 12,
            flexShrink: 0,
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
            paddingHorizontal: 12,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: shadowColor,
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 3,
            minWidth: 36,
        },
        freqButtonText: {
            color: linkColor,
            fontWeight: '600',
            fontSize: 20,
        },
        modalOverlay: {
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: '#00000066',
        },
        modalContainer: {
            backgroundColor: elevatedBackground,
            padding: 24,
            shadowColor: shadowColor,
            shadowOpacity: 0.2,
            shadowOffset: { width: 0, height: 2 },
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            gap: 12,
        },
        closeIcon: {
            position: 'absolute',
            top: 8,
            right: 8,
            padding: 3,
            zIndex: 1,
            backgroundColor: cardBackground,
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
            gap: 8,
        },
        settingsText: {
            fontSize: 16,
            color: textColor,
        },
        freqContainer: {
            flexDirection: 'column',
            alignItems: 'flex-start',
        },
        freqToggle: {
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
        },
        freqToggleText: {
            flex: 1,
            marginLeft: 8,
        },
        freqInputRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginTop: 12,
            marginLeft: 28,
        },
        freqLabel: {
            color: textColor,
            fontSize: 16,
        },
        freqCount: {
            fontSize: 16,
            color: textColor,
        },
        buttonRow: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 16,
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
            alignItems: 'center',
        },
        addButtonText: {
            color: linkColor,
            fontWeight: '600',
            fontSize: 16,
        },
        flexButton: {
            flex: 1,
            marginHorizontal: 4,
        },
    });

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <ThemedText
                            type="title"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={{ fontSize: 22 }}
                        >
                            {plant.name}
                        </ThemedText>
                        <Text
                            style={[styles.subtitle, { fontSize: 16 }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {plant.care?.name || '<unknown>'}
                        </Text>
                    </View>
                    <View style={styles.iconRow}>
                        <TouchableOpacity onPress={() => setShowWaterSettings(true)} style={styles.iconButton}>
                            <IconSymbol name="gear" size={24} color={tintColor} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
                            <IconSymbol name="trash" size={30} color={errorColor} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            <Modal
                animationType="slide"
                transparent
                visible={showWaterSettings}
                onRequestClose={() => setShowWaterSettings(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.modalOverlay}
                    // onPressOut={() => setShowWaterSettings(false)} TODO: fix
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.modalContainer}
                    >
                        <View style={styles.settingsList}>
                            <TouchableOpacity style={styles.settingsItem} onPress={handleWaterToday}>
                                <IconSymbol name="drop.fill" size={20} color={tintColor} />
                                <Text style={styles.settingsText}>Mark as Watered Today</Text>
                            </TouchableOpacity>

                            <FallingDrops visible={showDropAnim} onEnd={() => setShowDropAnim(false)} />

                            <TouchableOpacity style={styles.settingsItem} onPress={() => setShowPicker(true)}>
                                <IconSymbol name="calendar" size={20} color={tintColor} />
                                <Text style={styles.settingsText}>Set Next Watering Date</Text>
                            </TouchableOpacity>

                            <View style={[styles.settingsItem, styles.freqContainer]}>
                                <TouchableOpacity
                                    onPress={() => setShowFreqInput(!showFreqInput)}
                                    style={styles.freqToggle}
                                >
                                    <IconSymbol name="timer.circle" size={20} color={tintColor} />
                                    <Text style={[styles.settingsText, styles.freqToggleText]}>
                                        Change Watering Frequency
                                    </Text>
                                    <IconSymbol
                                        name={showFreqInput ? 'arrowtriangle.up.fill' : 'arrowtriangle.down.fill'}
                                        size={24}
                                        color={tintColor}
                                    />
                                </TouchableOpacity>

                                {showFreqInput && (
                                    <View style={styles.freqInputRow}>
                                        <Text style={styles.freqLabel}>Water every</Text>

                                        <TouchableOpacity
                                            onPress={async () => {
                                                const newFreq = Math.max(1, wateringFrequency - 1);
                                                setWateringFrequencyState(newFreq);
                                                await setWateringFrequency(plantId, newFreq);
                                            }}
                                            style={[styles.freqButton]}
                                        >
                                            <Text style={styles.freqButtonText}>−</Text>
                                        </TouchableOpacity>

                                        <Text style={styles.freqCount}>
                                            {wateringFrequency} day{wateringFrequency !== 1 ? 's' : ''}
                                        </Text>

                                        <TouchableOpacity
                                            onPress={async () => {
                                                const newFreq = wateringFrequency + 1;
                                                setWateringFrequencyState(newFreq);
                                                await setWateringFrequency(plantId, newFreq);
                                            }}
                                            style={[styles.freqButton]}
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

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.addButton, styles.flexButton]}
                                onPress={() => setShowWaterSettings(false)}
                            >
                                <Text style={styles.addButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </TouchableOpacity>
            </Modal>

            <View style={styles.cardRow}>
                <View style={styles.infoCard}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.cardTitle}>💧 Water Needs</Text>
                    </View>
                    <Text style={styles.cardContent}>
                        Water every {wateringFrequency == 1 ? 'day, ' : wateringFrequency + ' days, '}
                        {nextWatering === 0
                            ? (
                                (() => {
                                    const now = new Date();
                                    if (
                                        now.getHours() > notificationTime.hour ||
                                        (now.getHours() === notificationTime.hour && now.getMinutes() >= notificationTime.minute)
                                    ) {
                                        return 'water tomorrow!';
                                    }
                                    return 'water today!';
                                })()
                            )
                            : nextWatering === 1
                                ? 'water tomorrow!'
                                : `${nextWatering} days left until next watering.`}
                    </Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.cardTitle}>☀️ Light Needs</Text>
                    <Text style={styles.cardContent}>{plant.care?.light_requirements}</Text>
                </View>
            </View>

            <ScrollView style={styles.summaryContainer}>
                <Text style={styles.sectionTitle}>Plant Care Summary</Text>
                <Text style={styles.summaryText}>{plant.care?.care_summary}</Text>
            </ScrollView>
        </ThemedView>
    );
}

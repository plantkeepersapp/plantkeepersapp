import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { usePlants } from '@/context/PlantContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function PlantSummary() {
    const { id } = useLocalSearchParams();
    const { plants, deletePlant } = usePlants();

    const plantId = parseInt(id.toString());
    const plant = plants[plantId];

    const router = useRouter();

    const handleDelete = async () => {
        await deletePlant(plantId);
        router.back();
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
    });

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <ThemedText type="title">{plant.name}</ThemedText>
                    <View style={styles.iconRow}>
                        <TouchableOpacity onPress={() => console.log('Edit')} style={styles.iconButton}>
                            <IconSymbol name="pencil" size={30} color={tintColor} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
                            <IconSymbol name="trash" size={30} color={errorColor} />
                        </TouchableOpacity>
                    </View>

                </View>
                <Text style={styles.subtitle}>{plant.type}</Text>
            </View>

            <View style={styles.cardRow}>
                <View style={styles.infoCard}>
                    <Text style={styles.cardTitle}>💧 Water Needs</Text>
                    <Text style={styles.cardContent}>{plant.waterNeeds}</Text>
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

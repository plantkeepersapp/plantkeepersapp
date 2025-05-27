import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { usePlants } from '@/context/PlantContext';
import { IconSymbol } from '@/components/ui/IconSymbol';

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

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <ThemedText type="title">{plant.name}</ThemedText>
                    <View style={styles.iconRow}>
                        <TouchableOpacity onPress={() => console.log('Edit')} style={styles.iconButton}>
                            <IconSymbol name="pencil" size={30} color="#93C572" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
                            <IconSymbol name="trash" size={30} color="#FA5F55" />
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    subtitle: {
        color: '#666',
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
        backgroundColor: '#2e2e2e', // toned down for dark mode
        padding: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#93C572', // readable green
        marginBottom: 8,
    },
    cardContent: {
        fontSize: 14,
        color: '#e0e0e0', // soft light gray
    },
    summaryContainer: {
        backgroundColor: '#1e1e1e', // darker for dark mode
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#93C572',
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 14,
        color: '#ccc',
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
        // borderRadius: 8,
        // backgroundColor: '#2e2e2e',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

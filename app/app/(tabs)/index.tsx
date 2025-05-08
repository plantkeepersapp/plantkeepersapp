import { useMemo } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Platform } from 'react-native';

import { Colors } from '@/constants/Colors';
import { usePlants } from '@/components/PlantContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ParallaxScrollView from '@/components/ParallaxScrollView';

/**
 * Represents a randomly placed leaf icon in the header.
 * @typedef {Object} Leaf
 * @property {number} top - The top position of the leaf in pixels.
 * @property {number} left - The left position of the leaf in pixels.
 * @property {{ rotate: string }[]} transform - Rotation transformation.
 * @property {string} color - Hex color of the leaf.
 */
interface Leaf {
    top: number;
    left: number;
    transform: { rotate: string }[];
    color: string;
};

/**
 * Home screen component that displays a header and a list of user-added plants.
 * Users can add new plants using a form, and the plant data is persistent.
 *
 * @component
 * @returns {JSX.Element} The rendered home screen UI.
 */
export default function HomeScreen(): JSX.Element {
    const { plants } = usePlants();
    
    /**
     * Checks if the given leaf overlaps with any existing ones.
     *
     * @param {Leaf} newLeaf - The leaf to check for overlap.
     * @param {Leaf[]} leafPositions - Existing leaf positions.
     * @returns {boolean} True if overlap is detected, otherwise false.
     */
    const checkOverlap = (newLeaf: Leaf, leafPositions: Leaf[]): boolean => {
        return leafPositions.some(leaf => {
            const distance = Math.sqrt(
                Math.pow(newLeaf.left - leaf.left, 2) + Math.pow(newLeaf.top - leaf.top, 2)
            );
            return distance < 30;
        });
    };

    /**
     * Generates a list of unique, randomly positioned leaf icons with no overlaps.
     *
     * @param {number} num - Maximum number of leaf icons to generate. It generates less than that, since
     * leafs are simply discarded if they could not be placed because of overlapping with an other one.
     * @returns {Leaf[]} Array of non-overlapping leaf icon data.
     */
    const generateRandomLeafs = (num: number): Leaf[] => {
        const leafs: Leaf[] = [];
        const colors = ['#93C572', '#009E60', '#40826D'];
        for (let i = 0; i < num; i++) {
            const randomTop = Math.pow(Math.random(), 2) * 190 + 30;
            const randomLeft = Math.random() * 350;
            const randomRotation = Math.random() * 360;
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            const newLeaf: Leaf = {
                top: randomTop,
                left: randomLeft,
                transform: [{ rotate: `${randomRotation}deg` }],
                color: randomColor,
            };

            if (!checkOverlap(newLeaf, leafs)) {
                leafs.push(newLeaf);
            }
        }
        return leafs;
    };

    const LEAF_POSITIONS = useMemo(() => generateRandomLeafs(100), []);

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: Colors['light'].background, dark: Colors['dark'].background }}
            headerImage={
                <View style={styles.leafHeader}>
                    {LEAF_POSITIONS.map((style, index) => (
                        <IconSymbol
                            key={index}
                            name="leaf"
                            size={36}
                            color={style.color}
                            style={[styles.leafIcon, style]}
                        />
                    ))}
                </View>
            }>
            <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.container}>
                <ThemedView style={styles.emptyStateContainer}>
                    {plants.length === 0 ? (
                        <>
                            <ThemedText type="subtitle">No plants yet 🌱</ThemedText>
                            <ThemedText style={styles.emptyStateText}>
                                You haven’t added any plants yet. Tap the 'Add plant' button to add your first one!
                            </ThemedText>
                        </>
                    ) : (
                        <>
                            <View style={styles.cardsContainer}>
                                {plants.map((plant, index) => {
                                    const isRightColumn = (index + 1) % 2 === 0;
                                    const isOnlyOneCard = plants.length === 1;
                                    return (
                                        <View
                                            key={index}
                                            style={[
                                                styles.card,
                                                isRightColumn && { marginRight: 0 },
                                                isOnlyOneCard && styles.singleCardCentered,
                                            ]}
                                        >
                                            <Text style={styles.cardTitle}>{plant.name}</Text>
                                            <Text style={styles.cardSubtitle}>{plant.type}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </>
                    )}
                </ThemedView>
            </KeyboardAvoidingView>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        paddingHorizontal: 16,
    },
    card: {
        backgroundColor: '#f0f0f0',
        padding: 16,
        borderRadius: 12,
        width: '47%',
        marginRight: '6%',
        marginBottom: 16,
    },
    singleCardCentered: {
        alignSelf: 'center',
        width: '60%',
        marginRight: 0,
    },
    cardTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    leafHeader: {
        position: 'relative',
        height: 250,
        width: '100%',
    },
    leafIcon: {
        position: 'absolute',
    },
    container: {
        flex: 1,
        paddingTop: 0,
    },
    emptyStateContainer: {
        marginTop: 0,
        gap: 16,
        alignItems: 'center',
        paddingHorizontal: 0,
        width: '100%',
    },
    emptyStateText: {
        textAlign: 'center',
        maxWidth: 300,
        fontSize: 16,
        opacity: 0.8,
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
    },
    addButtonText: {
        color: '#1B4D2B',
        fontWeight: '600',
        fontSize: 16,
    },
});

import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Leaves from '@/components/Leaves';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { usePlants } from '@/context/PlantContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRouter } from 'expo-router';

/**
 * Home screen component that displays a header and a list of user-added plants.
 * Users can add new plants using a form, and the plant data is persistent.
 *
 * @component
 * @returns {JSX.Element} The rendered home screen UI.
 */
export default function HomeScreen(): JSX.Element {
    const { plants } = usePlants();
    const router = useRouter();

    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');
    const linkColor = useThemeColor({}, 'link');
    const cardBackground = useThemeColor({}, 'cardBackground');
    const shadowColor = useThemeColor({}, 'shadow');

    const styles = StyleSheet.create({
        cardsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            paddingHorizontal: 16,
        },
        card: {
            backgroundColor: cardBackground,
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
            color: tintColor,
        },
        cardSubtitle: {
            fontSize: 14,
            color: textColor,
            fontStyle: 'italic',
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
            backgroundColor: tintColor,
            paddingVertical: 10,
            paddingHorizontal: 50,
            borderRadius: 999,
            shadowColor: shadowColor,
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 3,
        },
        addButtonText: {
            color: linkColor,
            fontWeight: '600',
            fontSize: 16,
        },
    });

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: Colors['light'].background, dark: Colors['dark'].background }}
            headerImage={<Leaves />}>
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
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.card,
                                                isRightColumn && { marginRight: 0 },
                                                isOnlyOneCard && styles.singleCardCentered,
                                            ]}
                                            onPress={() => router.push({ pathname: '/plant', params: { id: index } })}
                                        >
                                            <Text style={styles.cardTitle}>{plant.name}</Text>
                                            <Text style={styles.cardSubtitle}>{plant.type}</Text>
                                        </TouchableOpacity>
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

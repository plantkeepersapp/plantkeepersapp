import React, { useState, useEffect } from 'react';
import { View, Animated, Easing } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

export function FallingDrops({ visible, onEnd }: { visible: boolean; onEnd?: () => void }) {
    const drops = Array.from({ length: 5 });
    const [animations] = useState(drops.map(() => new Animated.Value(0)));

    useEffect(() => {
        let finished = false;
        if (visible) {
            Animated.stagger(
                100,
                animations.map(anim =>
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 1400,
                        easing: Easing.bounce,
                        useNativeDriver: true,
                    }),
                ),
            ).start(() => {
                animations.forEach(anim => anim.setValue(0));
                if (onEnd && !finished) {
                    finished = true;
                    onEnd();
                }
            });
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <View
            pointerEvents="none"
            style={{
                position: 'absolute',
                left: -10,
                right: 0,
                top: 40,
                alignItems: 'center',
                zIndex: 100,
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
                {animations.map((anim, i) => (
                    <Animated.View
                        key={i}
                        style={{
                            opacity: anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
                            transform: [
                                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 60] }) },
                                { scale: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 1.2, 0.7] }) },
                            ],
                        }}
                    >
                        <IconSymbol name="drop.fill" size={28} color="#3fa7f7" />
                    </Animated.View>
                ))}
            </View>
        </View>
    );
}

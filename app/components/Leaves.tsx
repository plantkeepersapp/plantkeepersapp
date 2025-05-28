import { useMemo } from 'react';
import { Dimensions, View } from 'react-native';
import { StyleSheet } from 'react-native';
import { IconSymbol } from './ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function Leaves(): JSX.Element {

    /**
     * Represents a randomly placed leaf icon in the header.
     * @property {number} top - The top position of the leaf in pixels.
     * @property {number} left - The left position of the leaf in pixels.
     * @property {{ rotate: string }[]} transform - Rotation transformation.
     * @property {string} color - Hex color of the leaf.
     */
    interface Leaf {
        top: number;
        left: number;
        transform: { rotate: string; }[];
        color: string;
    };

    /**
     * Checks if the given leaf overlaps with any existing ones.
     *
     * @param {Leaf} newLeaf - The leaf to check for overlap.
     * @param {Leaf[]} leafPositions - Existing leaf positions.
     * @returns {boolean} True if overlap is detected, otherwise false.
     */
    const checkOverlap = (newLeaf: Leaf, leafPositions: Leaf[]): boolean => {
        return leafPositions.some(leaf => {
            const distance = Math.sqrt(Math.pow(newLeaf.left - leaf.left, 2) + Math.pow(newLeaf.top - leaf.top, 2));
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
        const maxLeft = Dimensions.get('window').width - 30;
        for (let i = 0; i < num; i++) {
            const randomTop = Math.pow(Math.random(), 2) * 190 + 30;
            const randomLeft = Math.random() * maxLeft;
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

    return <View style={styles.leafHeader}>
        {LEAF_POSITIONS.map((style, index) => (
            <IconSymbol
                key={index}
                name="leaf"
                size={36}
                color={style.color}
                style={[styles.leafIcon, style]}
            />
        ))}
    </View>;
}

const styles = StyleSheet.create({
    leafHeader: {
        position: 'relative',
        height: 250,
        width: '100%',
    },
    leafIcon: { position: 'absolute' },
});

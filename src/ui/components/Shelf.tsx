import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { GAME } from '../../game/config';
import type { Section } from '../../content';
import { C, RADIUS } from '../theme';

export type ShelfFlash = { kind: 'correct' | 'wrong'; nonce: number } | null;

type Props = {
  section: Section;
  count: number;
  bonusEarned: boolean;
  flash: ShelfFlash;
  disabled: boolean;
  onPress: () => void;
};

export function Shelf({ section, count, bonusEarned, flash, disabled, onPress }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!flash) return;
    if (flash.kind === 'correct') {
      pulse.setValue(1);
      Animated.timing(pulse, { toValue: 0, duration: 420, useNativeDriver: false }).start();
    } else {
      shake.setValue(0);
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0.6, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 55, useNativeDriver: true }),
      ]).start();
    }
  }, [flash, pulse, shake]);

  const progress = section.scoring ? Math.min(1, count / GAME.sectionGoal) : 0;

  return (
    <Animated.View
      style={{
        flex: 1,
        transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-7, 7] }) }],
      }}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Shelve in ${section.name}`}
        style={({ pressed }) => [styles.shelf, pressed && !disabled && styles.pressed]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: RADIUS.md,
              backgroundColor: flash?.kind === 'wrong' ? C.bad : section.color,
              opacity: flash?.kind === 'wrong' ? 0.16 : pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.22],
              }),
            },
          ]}
        />
        <View style={[styles.swatch, { backgroundColor: section.color }]}>
          <Text style={styles.swatchIcon}>{section.icon}</Text>
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {section.short}
        </Text>

        {section.scoring ? (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%`, backgroundColor: section.color },
                ]}
              />
            </View>
            <Text style={styles.count}>
              {bonusEarned ? '✓' : `${count}/${GAME.sectionGoal}`}
            </Text>
          </View>
        ) : (
          <Text style={styles.hint}>break</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shelf: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.line,
    padding: 10,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  pressed: { transform: [{ scale: 0.97 }] },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchIcon: { fontSize: 18 },
  name: { fontSize: 13, fontWeight: '700', color: C.ink, lineHeight: 16 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.bgDeep,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  count: {
    fontSize: 10,
    fontWeight: '700',
    color: C.muted,
    fontVariant: ['tabular-nums'],
    minWidth: 26,
    textAlign: 'right',
  },
  hint: { fontSize: 10, fontWeight: '600', color: C.muted, textTransform: 'uppercase' },
});

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { C, money } from '../theme';
import { StaminaBar } from './StaminaBar';

export type Toast = { id: number; text: string; tone: 'good' | 'bad' | 'gold' } | null;

type Props = {
  cashCents: number;
  multiplier: number;
  streak: number;
  stamina: number;
  maxStamina: number;
  toast: Toast;
};

export function Hud({ cashCents, multiplier, streak, stamina, maxStamina, toast }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    fade.setValue(1);
    lift.setValue(0);
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 750, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 1, duration: 750, useNativeDriver: true }),
    ]).start();
  }, [toast, fade, lift]);

  const toneColor = toast?.tone === 'bad' ? C.bad : toast?.tone === 'gold' ? C.gold : C.good;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>This shift</Text>
          <Text style={styles.cash}>{money(cashCents)}</Text>
        </View>

        <View style={styles.right}>
          {toast && (
            <Animated.Text
              style={[
                styles.toast,
                {
                  color: toneColor,
                  opacity: fade,
                  transform: [
                    { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -22] }) },
                  ],
                },
              ]}
            >
              {toast.text}
            </Animated.Text>
          )}
          <Text style={[styles.multiplier, multiplier > 1 && { color: C.accent }]}>
            {multiplier.toFixed(2)}×
          </Text>
          <Text style={styles.streak}>{streak > 0 ? `${streak} in a row` : 'no streak'}</Text>
        </View>
      </View>

      <StaminaBar stamina={stamina} max={maxStamina} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cash: { fontSize: 28, fontWeight: '800', color: C.ink, fontVariant: ['tabular-nums'] },
  multiplier: { fontSize: 22, fontWeight: '800', color: C.muted, fontVariant: ['tabular-nums'] },
  streak: { fontSize: 10, fontWeight: '700', color: C.muted },
  toast: { position: 'absolute', top: -18, right: 0, fontSize: 15, fontWeight: '800' },
});

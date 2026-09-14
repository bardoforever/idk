import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { C, RADIUS } from '../theme';

type Props = { stamina: number; max: number };

export function StaminaBar({ stamina, max }: Props) {
  const ratio = Math.max(0, Math.min(1, stamina / max));
  const width = useRef(new Animated.Value(ratio)).current;

  useEffect(() => {
    Animated.spring(width, {
      toValue: ratio,
      useNativeDriver: false,
      speed: 18,
      bounciness: 4,
    }).start();
  }, [ratio, width]);

  const low = ratio <= 0.2;

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: low ? C.staminaLow : C.stamina,
              width: width.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={[styles.label, low && { color: C.staminaLow }]}>
        {Math.ceil(stamina)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: {
    flex: 1,
    height: 12,
    borderRadius: RADIUS.sm,
    backgroundColor: C.bgDeep,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: RADIUS.sm },
  label: {
    width: 34,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
    fontSize: 13,
    fontWeight: '700',
    color: C.inkSoft,
  },
});

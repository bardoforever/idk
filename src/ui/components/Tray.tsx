import { Pressable, StyleSheet, Text, View } from 'react-native';

import { itemByKey } from '../../content';
import type { Instance as ShiftInstance } from '../../game/shift';
import { C, RADIUS } from '../theme';

type Props = {
  tray: ShiftInstance[];
  heldIds: number[];
  disabled: boolean;
  onPick: (instanceId: number) => void;
};

export function Tray({ tray, heldIds, disabled, onPick }: Props) {
  return (
    <View style={styles.grid}>
      {tray.map((instance) => {
        const item = itemByKey(instance.itemKey);
        const held = heldIds.includes(instance.id);
        return (
          <Pressable
            key={instance.id}
            onPress={() => onPick(instance.id)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`Pick up ${item.name}`}
            style={({ pressed }) => [
              styles.chip,
              item.rarity === 'premium' && styles.premium,
              held && styles.held,
              pressed && !disabled && styles.pressed,
            ]}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  chip: {
    width: '31.5%',
    minHeight: 62,
    backgroundColor: C.card,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: C.line,
    paddingVertical: 6,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  premium: { borderColor: C.gold, backgroundColor: '#FFFBEF' },
  held: { opacity: 0.35 },
  pressed: { transform: [{ scale: 0.95 }] },
  icon: { fontSize: 20 },
  name: {
    fontSize: 9.5,
    lineHeight: 11,
    fontWeight: '600',
    color: C.inkSoft,
    textAlign: 'center',
  },
});

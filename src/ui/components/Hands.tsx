import { Pressable, StyleSheet, Text, View } from 'react-native';

import { itemByKey } from '../../content';
import type { Instance } from '../../game/shift';
import { C, RADIUS } from '../theme';

type Props = {
  hands: Instance[];
  capacity: number;
  onReturn: () => void;
};

export function Hands({ hands, capacity, onReturn }: Props) {
  if (hands.length === 0) {
    return (
      <View style={[styles.wrap, styles.empty]}>
        <Text style={styles.emptyText}>Tap something from the pile</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onReturn}
      accessibilityRole="button"
      accessibilityLabel="Put back what you're holding"
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      {hands.map((instance) => {
        const item = itemByKey(instance.itemKey);
        return (
          <View key={instance.id} style={styles.held}>
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={styles.text}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.hint}>
                {item.stamina > 0
                  ? `break item · +${item.stamina} stamina`
                  : item.rarity === 'premium'
                    ? 'premium · worth more'
                    : 'where does it go?'}
              </Text>
            </View>
          </View>
        );
      })}
      {capacity > 1 && (
        <Text style={styles.capacity}>
          {hands.length}/{capacity}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 68,
    backgroundColor: C.card,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: C.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pressed: { opacity: 0.8 },
  empty: {
    borderStyle: 'dashed',
    borderColor: C.line,
    borderWidth: 2,
    justifyContent: 'center',
  },
  emptyText: { color: C.muted, fontSize: 13, fontWeight: '600', textAlign: 'center', flex: 1 },
  held: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  icon: { fontSize: 30 },
  text: { flex: 1, gap: 1 },
  name: { fontSize: 16, fontWeight: '800', color: C.ink },
  hint: { fontSize: 11, color: C.muted, fontWeight: '600' },
  capacity: { fontSize: 12, fontWeight: '700', color: C.muted },
});

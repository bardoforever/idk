import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SECTIONS } from '../content';
import type { ShopState } from '../storage';
import { C, RADIUS, money } from './theme';

type Props = {
  shop: ShopState;
  onStart: () => void;
  onReset: () => void;
};

export function StartScreen({ shop, onStart, onReset }: Props) {
  const last = shop.lastShift;

  return (
    <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.kicker}>paint · paper · records</Text>
        <Text style={styles.title}>The Corner Shop</Text>
      </View>

      <View style={styles.bank}>
        <Text style={styles.bankLabel}>In the till</Text>
        <Text style={styles.bankValue}>{money(shop.bankCents)}</Text>
        <Text style={styles.bankMeta}>
          {shop.shiftsWorked} {shop.shiftsWorked === 1 ? 'shift' : 'shifts'} worked ·{' '}
          {shop.lifetimeCorrect.toLocaleString()} items shelved
        </Text>
      </View>

      {last && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Last shift</Text>
          <View style={styles.statRow}>
            <Stat label="earned" value={money(last.cashCents)} />
            <Stat label="sorted" value={`${last.correct}`} />
            <Stat label="accuracy" value={`${Math.round(last.accuracy * 100)}%`} />
            <Stat label="best" value={`${last.bestMultiplier.toFixed(2)}×`} />
          </View>
        </View>
      )}

      <Pressable
        onPress={onStart}
        accessibilityRole="button"
        style={({ pressed }) => [styles.start, pressed && styles.startPressed]}
      >
        <Text style={styles.startText}>Start shift</Text>
        <Text style={styles.startHint}>2–4 minutes</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's sections</Text>
        {SECTIONS.map((section) => (
          <View key={section.key} style={styles.sectionRow}>
            <View style={[styles.dot, { backgroundColor: section.color }]} />
            <Text style={styles.sectionName}>{section.name}</Text>
            <Text style={styles.sectionIcon}>{section.icon}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How it works</Text>
        <Text style={styles.body}>
          Tap an item from the pile to pick it up, then tap the shelf it belongs on. Five right in a
          row steps your multiplier up; a wrong shelf costs you time and one step, never money.
        </Text>
        <Text style={styles.body}>
          Ten items onto one shelf finishes it for the shift and pays a bonus. Coffee and snacks go
          in the Back Room — shelve them correctly and you get the stamina back.
        </Text>
      </View>

      <Pressable onPress={onReset} hitSlop={10} style={styles.reset}>
        <Text style={styles.resetText}>reset shop</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 16, paddingBottom: 40 },
  header: { gap: 2, marginTop: 8 },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  title: { fontSize: 34, fontWeight: '800', color: C.ink, letterSpacing: -0.5 },
  bank: {
    backgroundColor: C.ink,
    borderRadius: RADIUS.lg,
    padding: 20,
    gap: 2,
  },
  bankLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A79C8D',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bankValue: { fontSize: 40, fontWeight: '800', color: C.bg, fontVariant: ['tabular-nums'] },
  bankMeta: { fontSize: 12, color: '#A79C8D', fontWeight: '600', marginTop: 4 },
  card: {
    backgroundColor: C.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.line,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 17, fontWeight: '800', color: C.ink, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 10, color: C.muted, fontWeight: '600' },
  start: {
    backgroundColor: C.accent,
    borderRadius: RADIUS.lg,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 2,
  },
  startPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  startText: { fontSize: 20, fontWeight: '800', color: '#FFF8F0' },
  startHint: { fontSize: 11, fontWeight: '600', color: '#F6D5CB' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  sectionName: { flex: 1, fontSize: 14, fontWeight: '600', color: C.ink },
  sectionIcon: { fontSize: 15 },
  body: { fontSize: 13, lineHeight: 19, color: C.inkSoft },
  reset: { alignSelf: 'center', padding: 8 },
  resetText: { fontSize: 11, color: C.muted, fontWeight: '600' },
});

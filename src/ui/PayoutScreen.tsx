import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SECTION_BY_KEY } from '../content';
import type { ShiftSummary } from '../game/shift';
import { C, RADIUS, money } from './theme';

type Props = {
  summary: ShiftSummary;
  bankCents: number;
  onAgain: () => void;
  onHome: () => void;
};

/** A little warmth instead of a grade. Nothing here is a failure state. */
function remark(summary: ShiftSummary): string {
  if (summary.correct === 0) return 'A short one. The pile will wait.';
  if (summary.accuracy >= 0.97) return 'Barely a thing out of place.';
  if (summary.bestMultiplier >= 2.5) return 'You got into a real rhythm there.';
  if (summary.bonuses.length >= 3) return 'Three shelves finished. The place looks good.';
  if (summary.accuracy < 0.75) return 'Messy, but the shelves are fuller than they were.';
  return 'Steady shift. The shop is a little more sorted.';
}

export function PayoutScreen({ summary, bankCents, onAgain, onHome }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.kicker}>shift over</Text>
        <Text style={styles.earned}>{money(summary.cashCents)}</Text>
        <Text style={styles.remark}>{remark(summary)}</Text>
      </View>

      <View style={styles.card}>
        <Row label="Items shelved" value={`${summary.correct}`} />
        <Row label="Mistakes" value={`${summary.wrong}`} />
        <Row label="Accuracy" value={`${Math.round(summary.accuracy * 100)}%`} />
        <Row label="Best multiplier" value={`${summary.bestMultiplier.toFixed(2)}×`} />
        {summary.staminaRestored > 0 && (
          <Row label="Stamina from breaks" value={`+${summary.staminaRestored}`} />
        )}
      </View>

      {summary.bonuses.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shelves finished</Text>
          {summary.bonuses.map((key) => (
            <View key={key} style={styles.bonusRow}>
              <View style={[styles.dot, { backgroundColor: SECTION_BY_KEY[key].color }]} />
              <Text style={styles.bonusName}>{SECTION_BY_KEY[key].name}</Text>
              <Text style={styles.bonusValue}>bonus paid</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.tillCard}>
        <Text style={styles.tillLabel}>In the till</Text>
        <Text style={styles.tillValue}>{money(bankCents)}</Text>
      </View>

      <Pressable
        onPress={onAgain}
        accessibilityRole="button"
        style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.primaryText}>Another shift</Text>
      </Pressable>

      <Pressable onPress={onHome} accessibilityRole="button" style={styles.secondary}>
        <Text style={styles.secondaryText}>Back to the shop</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 14, paddingBottom: 40, justifyContent: 'center', flexGrow: 1 },
  header: { gap: 4, alignItems: 'center', marginBottom: 6 },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  earned: { fontSize: 46, fontWeight: '800', color: C.ink, fontVariant: ['tabular-nums'] },
  remark: { fontSize: 14, color: C.inkSoft, textAlign: 'center', fontWeight: '600' },
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 14, color: C.inkSoft, fontWeight: '600' },
  rowValue: { fontSize: 15, fontWeight: '800', color: C.ink, fontVariant: ['tabular-nums'] },
  bonusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  bonusName: { flex: 1, fontSize: 14, fontWeight: '700', color: C.ink },
  bonusValue: { fontSize: 11, fontWeight: '700', color: C.gold },
  tillCard: {
    backgroundColor: C.ink,
    borderRadius: RADIUS.md,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A79C8D',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tillValue: { fontSize: 22, fontWeight: '800', color: C.bg, fontVariant: ['tabular-nums'] },
  primary: {
    backgroundColor: C.accent,
    borderRadius: RADIUS.lg,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryText: { fontSize: 17, fontWeight: '800', color: '#FFF8F0' },
  secondary: { alignItems: 'center', paddingVertical: 10 },
  secondaryText: { fontSize: 13, fontWeight: '700', color: C.inkSoft },
});

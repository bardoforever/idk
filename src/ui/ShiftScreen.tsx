import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { SECTIONS, SECTION_BY_KEY, type SectionKey } from '../content';
import { multiplierOf, reduce, startShift, type ShiftState } from '../game/shift';
import { Hands } from './components/Hands';
import { Hud, type Toast } from './components/Hud';
import { Shelf, type ShelfFlash } from './components/Shelf';
import { Tray } from './components/Tray';
import { C, RADIUS, money } from './theme';

type Props = {
  seed: number;
  onFinished: (state: ShiftState) => void;
};

/** Shelves render two-up, so pair them for the grid. */
const SHELF_ROWS = [SECTIONS.slice(0, 2), SECTIONS.slice(2, 4), SECTIONS.slice(4, 6)];

export function ShiftScreen({ seed, onFinished }: Props) {
  const [state, setState] = useState<ShiftState>(() => startShift({ seed }));
  const [flashes, setFlashes] = useState<Partial<Record<SectionKey, ShelfFlash>>>({});
  const [toast, setToast] = useState<Toast>(null);
  const nonce = useRef(0);

  const heldIds = useMemo(() => state.hands.map((h) => h.id), [state.hands]);
  const multiplier = multiplierOf(state);

  const pick = useCallback(
    (instanceId: number) => {
      Haptics.selectionAsync().catch(() => {});
      setState((prev) => reduce(prev, { type: 'pick', instanceId }));
    },
    [],
  );

  const returnToTray = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setState((prev) => reduce(prev, { type: 'returnToTray' }));
  }, []);

  const place = useCallback(
    (section: SectionKey) => {
      if (state.status !== 'running' || state.hands.length === 0) return;

      const next = reduce(state, { type: 'place', section });
      setState(next);

      // The reducer reports what it just did, so the UI never re-derives rules.
      const batch = next.lastBatch;
      const wrong = batch.find((e) => e.kind === 'wrong');
      const bonus = batch.find((e) => e.kind === 'bonus');
      const earned = batch.reduce((sum, e) => (e.kind === 'correct' ? sum + e.cents : sum), 0);
      const restored = batch.reduce((sum, e) => (e.kind === 'stamina' ? sum + e.amount : sum), 0);

      nonce.current += 1;
      setFlashes({ [section]: { kind: wrong ? 'wrong' : 'correct', nonce: nonce.current } });

      if (wrong && wrong.kind === 'wrong') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        setToast({
          id: nonce.current,
          text: `${SECTION_BY_KEY[wrong.correctSection].short}, not here`,
          tone: 'bad',
        });
      } else if (bonus && bonus.kind === 'bonus') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setToast({
          id: nonce.current,
          text: `${SECTION_BY_KEY[bonus.section].short} done  +${money(bonus.cents)}`,
          tone: 'gold',
        });
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setToast({
          id: nonce.current,
          text: restored > 0 ? `+${money(earned)}  +${restored} stamina` : `+${money(earned)}`,
          tone: 'good',
        });
      }

      if (next.status === 'ended') setTimeout(() => onFinished(next), 500);
    },
    [state, onFinished],
  );

  const ended = state.status !== 'running';

  return (
    <View style={styles.wrap}>
      <Hud
        cashCents={state.cashCents}
        multiplier={multiplier}
        streak={state.streak}
        stamina={state.stamina}
        maxStamina={state.maxStamina}
        toast={toast}
      />

      <View style={styles.shelves}>
        {SHELF_ROWS.map((row, i) => (
          <View key={i} style={styles.shelfRow}>
            {row.map((section) => (
              <Shelf
                key={section.key}
                section={section}
                count={state.sectionCounts[section.key]}
                bonusEarned={state.bonusesEarned.includes(section.key)}
                flash={flashes[section.key] ?? null}
                disabled={ended || state.hands.length === 0}
                onPress={() => place(section.key)}
              />
            ))}
          </View>
        ))}
      </View>

      <Hands hands={state.hands} capacity={state.capacity} onReturn={returnToTray} />

      <View style={styles.trayWrap}>
        <View style={styles.trayHeader}>
          <Text style={styles.trayLabel}>The pile</Text>
          <Pressable
            onPress={() => onFinished(reduce(state, { type: 'endShift' }))}
            hitSlop={10}
            accessibilityRole="button"
          >
            <Text style={styles.clockOut}>clock out</Text>
          </Pressable>
        </View>
        <Tray tray={state.tray} heldIds={heldIds} disabled={ended} onPick={pick} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 14, gap: 12 },
  shelves: { flex: 1, gap: 8, minHeight: 240 },
  shelfRow: { flex: 1, flexDirection: 'row', gap: 8 },
  trayWrap: { gap: 8 },
  trayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  clockOut: { fontSize: 11, fontWeight: '700', color: C.accent },
});

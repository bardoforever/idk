import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import { summarize, type ShiftState, type ShiftSummary } from './src/game/shift';
import { applyShift, EMPTY_SHOP, loadShop, resetShop, saveShop, type ShopState } from './src/storage';
import { PayoutScreen } from './src/ui/PayoutScreen';
import { ShiftScreen } from './src/ui/ShiftScreen';
import { StartScreen } from './src/ui/StartScreen';
import { C } from './src/ui/theme';

type Screen =
  | { name: 'loading' }
  | { name: 'start' }
  | { name: 'shift'; seed: number }
  | { name: 'payout'; summary: ShiftSummary };

export default function App() {
  const [shop, setShop] = useState<ShopState>(EMPTY_SHOP);
  const [screen, setScreen] = useState<Screen>({ name: 'loading' });

  useEffect(() => {
    loadShop().then((loaded) => {
      setShop(loaded);
      setScreen({ name: 'start' });
    });
  }, []);

  const startShift = useCallback(() => {
    // Slice 3 replaces this with a server-issued shift id so both players can
    // be handed the same board.
    setScreen({ name: 'shift', seed: Math.floor(Math.random() * 0xffffffff) });
  }, []);

  const finishShift = useCallback((state: ShiftState) => {
    const summary = summarize(state);
    setShop((prev) => {
      const next = applyShift(prev, summary);
      void saveShop(next);
      return next;
    });
    setScreen({ name: 'payout', summary });
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ExpoStatusBar style="dark" />
        <View style={styles.body}>
          {screen.name === 'loading' && (
            <View style={styles.center}>
              <ActivityIndicator color={C.accent} />
            </View>
          )}

          {screen.name === 'start' && (
            <StartScreen
              shop={shop}
              onStart={startShift}
              onReset={() => resetShop().then(setShop)}
            />
          )}

          {screen.name === 'shift' && (
            <ShiftScreen key={screen.seed} seed={screen.seed} onFinished={finishShift} />
          )}

          {screen.name === 'payout' && (
            <PayoutScreen
              summary={screen.summary}
              bankCents={shop.bankCents}
              onAgain={startShift}
              onHome={() => setScreen({ name: 'start' })}
            />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  body: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

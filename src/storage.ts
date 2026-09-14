import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ShiftSummary } from './game/shift';

/**
 * Slice 1 keeps the shop's running total on the device. Slice 3 replaces this
 * with the server-authoritative ledger; the shape is deliberately close to the
 * ledger row so the migration is a straight mapping.
 */
export type ShopState = {
  bankCents: number;
  shiftsWorked: number;
  lifetimeCorrect: number;
  lastShift: ShiftSummary | null;
};

const KEY = 'corner-shop/v1';

export const EMPTY_SHOP: ShopState = {
  bankCents: 0,
  shiftsWorked: 0,
  lifetimeCorrect: 0,
  lastShift: null,
};

export async function loadShop(): Promise<ShopState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY_SHOP;
    return { ...EMPTY_SHOP, ...(JSON.parse(raw) as Partial<ShopState>) };
  } catch {
    return EMPTY_SHOP;
  }
}

export async function saveShop(state: ShopState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // A failed write costs the last shift, never the shop. Slice 3 adds the
    // outbox that makes this durable.
  }
}

export function applyShift(shop: ShopState, summary: ShiftSummary): ShopState {
  return {
    bankCents: shop.bankCents + summary.cashCents,
    shiftsWorked: shop.shiftsWorked + 1,
    lifetimeCorrect: shop.lifetimeCorrect + summary.correct,
    lastShift: summary,
  };
}

export async function resetShop(): Promise<ShopState> {
  await AsyncStorage.removeItem(KEY).catch(() => {});
  return EMPTY_SHOP;
}

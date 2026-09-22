import { storage } from 'wxt/utils/storage';
import type { FillSettings } from '@/core/types';

export const DEFAULT_SETTINGS: FillSettings = {
  highlight: true,
  overwrite: true,
  fillLeftovers: true,
  reuseValues: true,
};

/** Настройки маленькие — храним в sync, чтобы они переезжали между устройствами. */
export const settingsItem = storage.defineItem<FillSettings>('sync:settings', {
  fallback: DEFAULT_SETTINGS,
});

/** Недостающие ключи (после обновления расширения) берутся из значений по умолчанию. */
export async function getSettings(): Promise<FillSettings> {
  return { ...DEFAULT_SETTINGS, ...(await settingsItem.getValue()) };
}

import { useCallback, useEffect, useState } from 'react';
import type { WxtStorageItem } from 'wxt/utils/storage';

/**
 * Значение из chrome.storage как React-состояние.
 * Подписывается на изменения, поэтому правки из других частей расширения видны сразу.
 * `undefined` — значение ещё загружается.
 */
export function useStorageItem<T>(item: WxtStorageItem<T, Record<string, unknown>>) {
  const [value, setValue] = useState<T>();

  useEffect(() => {
    let active = true;
    void item.getValue().then((v) => active && setValue(v));
    const unwatch = item.watch((v) => setValue(v));
    return () => {
      active = false;
      unwatch();
    };
  }, [item]);

  const update = useCallback((next: T) => item.setValue(next), [item]);
  return [value, update] as const;
}

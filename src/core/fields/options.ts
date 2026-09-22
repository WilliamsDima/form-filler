import { normalize } from '../text';

/**
 * Ищет в выпадающем списке вариант, соответствующий значению:
 * сначала точное совпадение, затем вхождение одного в другое.
 * Возвращает индекс варианта или -1.
 */
export function findOption(options: readonly string[], value: string): number {
  const target = normalize(value);
  if (!target) return -1;
  const normalized = options.map(normalize);

  const exact = normalized.indexOf(target);
  if (exact !== -1) return exact;

  return normalized.findIndex(
    (option) => option.length > 1 && (option.includes(target) || target.includes(option)),
  );
}

/**
 * Приводит строку к виду, удобному для сравнения:
 * «lastName» → «last name», «user_e-mail» → «user e mail», «Ф.И.О.» → «ф и о».
 */
export function normalize(input: string): string {
  return input
    .replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\d]+/gu, ' ')
    .trim();
}

export function tokens(input: string): string[] {
  return normalize(input)
    .split(' ')
    .filter((t) => t.length > 1);
}

export function digitsOnly(input: string): string {
  return input.replace(/\D/g, '');
}

const WORD_START = '(?<![\\p{L}\\d])';
const WORD_END = '(?![\\p{L}\\d])';

/**
 * Целое слово или фраза. Встроенный `\b` в JS не понимает кириллицу,
 * поэтому границы слова задаются через Unicode-классы.
 */
export function word(...alternatives: string[]): RegExp {
  return new RegExp(`${WORD_START}(?:${alternatives.join('|')})${WORD_END}`, 'u');
}

/** Начало слова — для основ вроде «фамил» (фамилия, фамилию…). */
export function stem(...alternatives: string[]): RegExp {
  return new RegExp(`${WORD_START}(?:${alternatives.join('|')})`, 'u');
}

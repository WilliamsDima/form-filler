import { normalize } from '../text';
import type { ClassifiedField, FieldDescriptor, FieldKind } from '../types';
import { FIELD_RULES } from './field-rules';

/** Насколько разным источникам текста можно доверять. */
const SOURCE_WEIGHTS = {
  label: 3,
  ariaLabel: 3,
  placeholder: 2,
  name: 2,
  id: 1.5,
  context: 1,
} as const satisfies Partial<Record<keyof FieldDescriptor, number>>;

type TextSource = keyof typeof SOURCE_WEIGHTS;

/** Атрибут autocomplete — самый надёжный признак, если сайт его указал. */
const AUTOCOMPLETE_WEIGHT = 20;

/**
 * Определяет тип поля: складывает веса всех совпавших признаков
 * из подписи, атрибутов и соседнего текста, побеждает тип с наибольшей суммой.
 */
export function classifyField(field: FieldDescriptor): ClassifiedField {
  const scores = scoreField(field);
  let best: FieldKind = 'text';
  let bestScore = 0;
  for (const [kind, score] of scores) {
    if (score > bestScore) {
      best = kind;
      bestScore = score;
    }
  }
  return { ...field, kind: best, confidence: bestScore };
}

export function scoreField(field: FieldDescriptor): Map<FieldKind, number> {
  const texts = (Object.keys(SOURCE_WEIGHTS) as TextSource[]).map(
    (source) => [normalize(field[source]), SOURCE_WEIGHTS[source]] as const,
  );
  const autocompleteTokens = field.autocomplete.toLowerCase().split(/\s+/);
  const scores = new Map<FieldKind, number>();

  for (const rule of FIELD_RULES) {
    let score = rule.inputTypes?.[field.type] ?? 0;

    if (rule.autocomplete?.some((token) => autocompleteTokens.includes(token))) {
      score += AUTOCOMPLETE_WEIGHT;
    }

    for (const [text, sourceWeight] of texts) {
      if (!text || rule.exclude?.test(text)) continue;
      for (const [pattern, weight] of rule.patterns) {
        if (pattern.test(text)) score += weight * sourceWeight;
      }
    }

    if (score > 0) scores.set(rule.kind, score);
  }
  return scores;
}

/** Классифицирует произвольную подпись — например, метку из строки шаблона «Фамилия: …». */
export function classifyLabel(label: string): FieldKind | undefined {
  const { kind, confidence } = classifyField({
    index: -1,
    tag: 'input',
    type: 'text',
    name: '',
    id: '',
    autocomplete: '',
    placeholder: '',
    label,
    ariaLabel: '',
    context: '',
  });
  return confidence > 0 ? kind : undefined;
}

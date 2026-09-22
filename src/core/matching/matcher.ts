import { findOption } from '../fields/options';
import { normalize, tokens } from '../text';
import type {
  Assignment,
  ClassifiedField,
  FieldKind,
  MatchReason,
  TemplateEntry,
} from '../types';

export interface MatchOptions {
  /** Раскладывать оставшиеся значения по нераспознанным полям по порядку. */
  fillLeftovers: boolean;
  /** Повторять значения по кругу, если однотипных полей больше, чем значений. */
  reuseValues?: boolean;
  /** Индексы полей, подходящих под CSS-селектор (DOM знает только вызывающая сторона). */
  resolveSelector?: (selector: string) => number[];
}

const SCORE = {
  selector: 1000,
  label: 500,
  kind: 100,
  /** Второе прочтение значения: «4510 123456» — скорее паспорт, но может быть и ВУ. */
  alternativeKind: 90,
  numeric: 40,
  fallback: 10,
} as const;

const LABEL_THRESHOLD = 0.5;

/** Части составных значений: ФИО можно разложить по трём полям, паспорт — по двум. */
const PART_OF: Partial<Record<FieldKind, FieldKind>> = {
  lastName: 'fullName',
  firstName: 'fullName',
  middleName: 'fullName',
  passportSeries: 'passport',
  passportNumber: 'passport',
};

/** Поля, куда подходит «просто число», если тип значения не удалось уточнить. */
const NUMERIC_KINDS = new Set<FieldKind>([
  'number',
  'phone',
  'inn',
  'snils',
  'passport',
  'passportSeries',
  'passportNumber',
]);

interface Candidate {
  entry: TemplateEntry;
  field: ClassifiedField;
  score: number;
  kind: FieldKind;
  value: string;
  reason: MatchReason;
}

/**
 * Сопоставляет значения шаблона с полями формы.
 *
 * Для каждой пары «значение × поле» считается оценка — от явного CSS-селектора
 * до «положить куда-нибудь по порядку». Затем пары разбираются жадно, от лучших к худшим,
 * а при равной оценке сохраняется порядок: первая дата из шаблона — в первое поле даты.
 */
export function matchEntries(
  entries: readonly TemplateEntry[],
  fields: readonly ClassifiedField[],
  options: MatchOptions,
): Assignment[] {
  const candidates = entries
    .flatMap((entry) => candidatesFor(entry, fields, options))
    .sort(
      (a, b) =>
        b.score - a.score || a.entry.id - b.entry.id || a.field.index - b.field.index,
    );

  const filledFields = new Set<number>();
  const usage = new Map<number, Set<FieldKind | '*'>>();
  const assignments: Assignment[] = [];

  for (const candidate of candidates) {
    const { entry, field, kind } = candidate;
    const used = usage.get(entry.id) ?? new Set();
    if (filledFields.has(field.index) || !canUse(used, kind)) continue;

    used.add(PART_OF[kind] || kind === 'password' ? kind : '*');
    usage.set(entry.id, used);
    filledFields.add(field.index);
    assignments.push({
      fieldIndex: field.index,
      entryId: entry.id,
      value: candidate.value,
      kind,
      reason: candidate.reason,
    });
  }

  if (options.reuseValues) {
    assignments.push(...repeatValues(entries, fields, filledFields));
  }

  return assignments.sort((a, b) => a.fieldIndex - b.fieldIndex);
}

/**
 * Второй проход: поля известного типа, которым не хватило значений
 * (например, ФИО и дата рождения второго человека в анкете), получают значения того же типа по кругу.
 * Строки с меткой или селектором не повторяются — они адресованы конкретному полю.
 */
function repeatValues(
  entries: readonly TemplateEntry[],
  fields: readonly ClassifiedField[],
  filledFields: ReadonlySet<number>,
): Assignment[] {
  const repeats = new Map<FieldKind, number>();
  const assignments: Assignment[] = [];

  for (const field of fields) {
    if (filledFields.has(field.index) || field.confidence === 0) continue;
    const sources = entries.filter(
      (entry) =>
        !entry.label &&
        !entry.selector &&
        entry.parts[field.kind] !== undefined &&
        fits(field, entry.parts[field.kind]!),
    );
    if (sources.length === 0) continue;

    const round = repeats.get(field.kind) ?? 0;
    repeats.set(field.kind, round + 1);
    const entry = sources[round % sources.length]!;
    assignments.push({
      fieldIndex: field.index,
      entryId: entry.id,
      value: entry.parts[field.kind]!,
      kind: field.kind,
      reason: 'repeat',
    });
  }
  return assignments;
}

/** В выпадающий список можно записать только то, что в нём есть. */
function fits(field: ClassifiedField, value: string): boolean {
  return field.tag !== 'select' || findOption(field.options ?? [], value) !== -1;
}

/**
 * Значение используется один раз. Исключения: части составного значения
 * (фамилия, имя и отчество из одного ФИО) и пароль — его обычно вводят дважды.
 */
function canUse(used: Set<FieldKind | '*'>, kind: FieldKind): boolean {
  if (used.has('*')) return false;
  if (kind === 'password') return true;
  if (PART_OF[kind]) return !used.has(kind);
  return used.size === 0;
}

function candidatesFor(
  entry: TemplateEntry,
  fields: readonly ClassifiedField[],
  options: MatchOptions,
): Candidate[] {
  if (entry.selector) {
    const matched = new Set(options.resolveSelector?.(entry.selector) ?? []);
    return fields
      .filter((field) => matched.has(field.index))
      .map((field) => candidate(entry, field, SCORE.selector, 'selector'));
  }

  return fields.flatMap((field) => {
    const result: Candidate[] = [];

    if (entry.label) {
      const similarity = labelSimilarity(entry.label, field);
      if (similarity >= LABEL_THRESHOLD) {
        result.push(candidate(entry, field, SCORE.label + similarity * 100, 'label'));
      }
    }

    if (entry.parts[field.kind] !== undefined && field.confidence > 0) {
      const score = isPrimaryKind(entry, field.kind) ? SCORE.kind : SCORE.alternativeKind;
      result.push(candidate(entry, field, score, 'kind', field.kind));
    } else if (entry.kind === 'number' && NUMERIC_KINDS.has(field.kind)) {
      result.push(candidate(entry, field, SCORE.numeric, 'kind'));
    } else if (options.fillLeftovers && field.confidence === 0 && !entry.label) {
      // Строка с меткой адресована конкретному полю: если его нет, в случайное поле она не идёт.
      result.push(candidate(entry, field, SCORE.fallback, 'fallback'));
    }

    return result.filter((c) => fits(field, c.value));
  });
}

function isPrimaryKind(entry: TemplateEntry, kind: FieldKind): boolean {
  return kind === entry.labelKind || kind === entry.kind || PART_OF[kind] === entry.kind;
}

function candidate(
  entry: TemplateEntry,
  field: ClassifiedField,
  score: number,
  reason: MatchReason,
  partKind?: FieldKind,
): Candidate {
  // Для поля «Фамилия» берём из ФИО только фамилию, для остальных — значение целиком.
  const kind = partKind ?? field.kind;
  const value = entry.parts[kind] ?? entry.value;
  return { entry, field, score, kind, value, reason };
}

/** Похожесть метки из шаблона на подписи поля: 1 — совпадают, 0 — ничего общего. */
export function labelSimilarity(label: string, field: ClassifiedField): number {
  const target = normalize(label);
  const targetTokens = new Set(tokens(label));
  if (!target) return 0;

  const texts = [field.label, field.ariaLabel, field.placeholder, field.name, field.id, field.context];
  let best = 0;

  for (const raw of texts) {
    const text = normalize(raw);
    if (!text) continue;
    if (text === target) return 1;
    if (text.length >= 3 && (text.includes(target) || target.includes(text))) {
      best = Math.max(best, 0.8);
      continue;
    }
    const textTokens = tokens(raw);
    const common = textTokens.filter((t) => targetTokens.has(t)).length;
    const union = new Set([...textTokens, ...targetTokens]).size;
    if (union > 0) best = Math.max(best, common / union);
  }
  return best;
}

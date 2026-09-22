const pad = (n: number) => String(n).padStart(2, '0');

/** Date → «дд.мм.гггг». */
export function formatDate(date: Date): string {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

/** Понимает «дд.мм.гггг», «дд/мм/гг», «дд-мм-гггг» и ISO «гггг-мм-дд». */
export function parseDate(value: string): DateParts | null {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(value.trim());
  if (iso) return toParts(iso[1], iso[2], iso[3]);

  const local = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})$/.exec(value.trim());
  if (!local) return null;
  const year = local[3]!.length === 2 ? `20${local[3]}` : local[3];
  return toParts(year, local[2], local[1]);
}

function toParts(year?: string, month?: string, day?: string): DateParts | null {
  const parts = { year: Number(year), month: Number(month), day: Number(day) };
  const valid = parts.month >= 1 && parts.month <= 12 && parts.day >= 1 && parts.day <= 31;
  return valid ? parts : null;
}

/**
 * Приводит дату к формату, который понимает нативный <input> нужного типа.
 * Для текстовых полей значение остаётся как в шаблоне.
 */
export function toInputDateValue(value: string, inputType: string): string {
  const parts = parseDate(value);
  if (!parts) return value;
  const { year, month, day } = parts;
  switch (inputType) {
    case 'date':
      return `${year}-${pad(month)}-${pad(day)}`;
    case 'datetime-local':
      return `${year}-${pad(month)}-${pad(day)}T00:00`;
    case 'month':
      return `${year}-${pad(month)}`;
    default:
      return value;
  }
}

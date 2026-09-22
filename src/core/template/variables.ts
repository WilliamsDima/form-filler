import { formatDate } from '../format';

/**
 * Переменные шаблона — подставляются при каждом заполнении,
 * чтобы, например, e-mail был уникальным для каждой тестовой регистрации.
 */
export interface TemplateVariable {
  syntax: string;
  description: string;
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { syntax: '{{today}}', description: 'сегодняшняя дата в формате дд.мм.гггг' },
  { syntax: '{{today+30}}', description: 'дата со сдвигом в днях (можно и −)' },
  { syntax: '{{ts}}', description: 'метка времени — для уникальных логинов и e-mail' },
  { syntax: '{{rand:6}}', description: 'случайные цифры заданной длины' },
  { syntax: '{{uuid}}', description: 'случайный UUID' },
];

const VARIABLE = /\{\{\s*([a-z]+)\s*(?:([+-])\s*(\d+)|:\s*(\d+))?\s*\}\}/gi;

export interface ExpandContext {
  now: Date;
  random: () => number;
  uuid: () => string;
}

const defaultContext = (): ExpandContext => ({
  now: new Date(),
  random: Math.random,
  uuid: () => crypto.randomUUID(),
});

export function expandVariables(text: string, context: ExpandContext = defaultContext()): string {
  return text.replace(VARIABLE, (match, rawName: string, sign?: string, offset?: string, size?: string) => {
    switch (rawName.toLowerCase()) {
      case 'today': {
        const days = offset ? Number(offset) * (sign === '-' ? -1 : 1) : 0;
        const date = new Date(context.now);
        date.setDate(date.getDate() + days);
        return formatDate(date);
      }
      case 'ts':
        return String(context.now.getTime());
      case 'rand': {
        const length = Math.min(Number(size ?? 6), 32);
        return Array.from({ length }, () => Math.floor(context.random() * 10)).join('');
      }
      case 'uuid':
        return context.uuid();
      default:
        return match;
    }
  });
}

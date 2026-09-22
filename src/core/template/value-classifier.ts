import { digitsOnly } from '../text';
import { parseDate } from '../format';
import type { FieldKind, ValueKind } from '../types';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_LIKE = /^(https?:\/\/|www\.)\S+$/i;
const PASSPORT = /^\d{2}\s?\d{2}\s?\d{6}$/;
const DIVISION_CODE = /^\d{3}-\d{3}$/;
const SNILS_FORMATTED = /^\d{3}-\d{3}-\d{3}[\s-]?\d{2}$/;
const PHONE_CHARS = /^\+?[\d\s()\-.]+$/;
const NUMBER = /^-?\d+([.,]\d+)?$/;
/** 2–3 слова с заглавной буквы: «Иванов Иван Иванович», «John Smith», «Анна-Мария Петрова». */
const PERSON_NAME = /^\p{Lu}\p{Ll}+(?:-\p{Lu}\p{Ll}+)?(?:\s+\p{Lu}\p{Ll}+(?:-\p{Lu}\p{Ll}+)?){1,2}$/u;
const ADDRESS_MARKER =
  /(?:^|[\s,])(?:ул|улица|д|дом|кв|корп|стр|г|гор|пгт|пос|с|р-н|район|край|обл|область|пр-т|проспект|пер|переулок|ш|шоссе|мкр|street|st|ave|avenue|road|rd|apt|city)\.?(?=[\s,]|$)/iu;

/** Определяет, что за данные записаны в строке шаблона. */
export function classifyValue(raw: string): ValueKind {
  const value = raw.trim();
  const digits = digitsOnly(value);

  if (EMAIL.test(value)) return 'email';
  if (URL_LIKE.test(value)) return 'url';
  if (parseDate(value)) return 'date';
  if (DIVISION_CODE.test(value)) return 'divisionCode';
  if (SNILS_FORMATTED.test(value)) return 'snils';
  if (PHONE_CHARS.test(value) && looksLikePhone(value, digits)) return 'phone';
  if (PASSPORT.test(value) && /\s/.test(value)) return 'passport';
  if (/^\d+$/.test(value)) {
    if (isValidInn(value)) return 'inn';
    if (isValidSnils(value)) return 'snils';
  }
  if (NUMBER.test(value)) return 'number';
  if (PERSON_NAME.test(value)) return 'fullName';
  if (ADDRESS_MARKER.test(value) && (value.includes(',') || /\d/.test(value))) return 'address';
  return 'text';
}

function looksLikePhone(value: string, digits: string): boolean {
  if (digits.length < 10 || digits.length > 15) return false;
  if (value.startsWith('+') || value.includes('(')) return true;
  // 8 (999) 123-45-67, 89991234567, 7 999 123 45 67
  return digits.length === 11 && /^[78]/.test(digits);
}

export function isValidInn(value: string): boolean {
  const d = [...value].map(Number);
  const checksum = (weights: number[]) =>
    (weights.reduce((sum, w, i) => sum + w * d[i]!, 0) % 11) % 10;

  if (d.length === 10) return checksum([2, 4, 10, 3, 5, 9, 4, 6, 8]) === d[9];
  if (d.length === 12) {
    return (
      checksum([7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === d[10] &&
      checksum([3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === d[11]
    );
  }
  return false;
}

export function isValidSnils(value: string): boolean {
  const d = digitsOnly(value);
  if (d.length !== 11) return false;
  const sum = [...d.slice(0, 9)].reduce((acc, digit, i) => acc + Number(digit) * (9 - i), 0);
  const control = sum < 100 ? sum : sum % 101 === 100 ? 0 : sum % 101;
  return control === Number(d.slice(9));
}

/**
 * Во что превращается значение для полей разных типов.
 * Составные значения (ФИО, паспорт) раскладываются на части,
 * чтобы заполнить раздельные поля «Фамилия / Имя / Отчество» или «Серия / Номер».
 */
export function valueParts(value: string, kind: ValueKind): Partial<Record<FieldKind, string>> {
  switch (kind) {
    case 'fullName':
      return { fullName: value, ...splitName(value) };
    case 'passport': {
      const digits = digitsOnly(value);
      // У водительского удостоверения тот же формат «4510 123456».
      return {
        passport: value,
        passportSeries: digits.slice(0, 4),
        passportNumber: digits.slice(4),
        driverLicense: value,
      };
    }
    default:
      return { [kind]: value };
  }
}

function splitName(value: string): Partial<Record<FieldKind, string>> {
  const words = value.split(/\s+/);
  const isCyrillic = /[а-яё]/i.test(value);

  // Русский порядок — «Фамилия Имя Отчество», латиница — «First Last».
  if (isCyrillic) {
    const [lastName, firstName, middleName] = words;
    return { lastName, firstName, ...(middleName && { middleName }) };
  }
  const [firstName, ...rest] = words;
  return { firstName, lastName: rest.at(-1), ...(rest.length > 1 && { middleName: rest[0] }) };
}

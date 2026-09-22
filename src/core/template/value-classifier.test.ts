import { describe, expect, it } from 'vitest';
import { classifyValue, isValidInn, isValidSnils, valueParts } from './value-classifier';

describe('classifyValue', () => {
  it.each([
    ['Иванов Иван Иванович', 'fullName'],
    ['John Smith', 'fullName'],
    ['01.08.2000', 'date'],
    ['2000-08-01', 'date'],
    ['qa-test@example.dev', 'email'],
    ['+7 (900) 555-01-02', 'phone'],
    ['8 999 123-45-67', 'phone'],
    ['4510 123456', 'passport'],
    ['770-001', 'divisionCode'],
    ['112-233-445 95', 'snils'],
    ['7707083893', 'inn'],
    ['https://example.com', 'url'],
    ['42', 'number'],
    ['Московская обл., г. Химки, ул. Ленина, д 2', 'address'],
    ['г. Москва, ул. Тверская, д. 1', 'address'],
    ['просто комментарий', 'text'],
  ])('%s → %s', (value, kind) => {
    expect(classifyValue(value)).toBe(kind);
  });
});

describe('checksums', () => {
  it('validates INN', () => {
    expect(isValidInn('7707083893')).toBe(true);
    expect(isValidInn('500100732259')).toBe(true);
    expect(isValidInn('7707083890')).toBe(false);
  });

  it('validates SNILS', () => {
    expect(isValidSnils('112-233-445 95')).toBe(true);
    expect(isValidSnils('112-233-445 96')).toBe(false);
  });
});

describe('valueParts', () => {
  it('splits Russian full name as «Фамилия Имя Отчество»', () => {
    expect(valueParts('Иванов Иван Иванович', 'fullName')).toMatchObject({
      lastName: 'Иванов',
      firstName: 'Иван',
      middleName: 'Иванович',
    });
  });

  it('splits Latin name as «First Last»', () => {
    expect(valueParts('John Smith', 'fullName')).toMatchObject({ firstName: 'John', lastName: 'Smith' });
  });

  it('splits passport into series and number', () => {
    expect(valueParts('4510 123456', 'passport')).toMatchObject({
      passportSeries: '4510',
      passportNumber: '123456',
    });
  });
});

import { describe, expect, it } from 'vitest';
import type { FieldDescriptor } from '../types';
import { classifyField } from './field-classifier';

const field = (overrides: Partial<FieldDescriptor>): FieldDescriptor => ({
  index: 0,
  tag: 'input',
  type: 'text',
  name: '',
  id: '',
  autocomplete: '',
  placeholder: '',
  label: '',
  ariaLabel: '',
  context: '',
  ...overrides,
});

describe('classifyField', () => {
  it.each<[Partial<FieldDescriptor>, string]>([
    [{ label: 'Фамилия' }, 'lastName'],
    [{ name: 'firstName' }, 'firstName'],
    [{ label: 'Имя' }, 'firstName'],
    [{ label: 'Отчество (при наличии)' }, 'middleName'],
    [{ label: 'ФИО' }, 'fullName'],
    [{ label: 'Фамилия, имя, отчество' }, 'fullName'],
    [{ type: 'email' }, 'email'],
    [{ label: 'Адрес электронной почты' }, 'email'],
    [{ placeholder: '+7 (___) ___-__-__', name: 'phone' }, 'phone'],
    [{ label: 'Дата рождения' }, 'date'],
    [{ label: 'Серия и номер паспорта' }, 'passport'],
    [{ label: 'Серия' }, 'passportSeries'],
    [{ label: 'Номер паспорта' }, 'passportNumber'],
    [{ label: 'Код подразделения' }, 'divisionCode'],
    [{ label: 'СНИЛС' }, 'snils'],
    [{ name: 'inn' }, 'inn'],
    [{ label: 'Адрес регистрации' }, 'address'],
    [{ label: 'Почтовый адрес' }, 'address'],
    [{ type: 'password' }, 'password'],
    [{ autocomplete: 'shipping family-name', label: 'Something' }, 'lastName'],
    [{ label: 'Имя пользователя' }, 'text'],
    [{ label: 'Комментарий' }, 'text'],
  ])('%o → %s', (overrides, kind) => {
    expect(classifyField(field(overrides)).kind).toBe(kind);
  });
});

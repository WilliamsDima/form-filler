import { describe, expect, it } from 'vitest';
import { classifyField } from '../fields/field-classifier';
import { parseTemplate } from '../template/parse';
import type { ClassifiedField, FieldDescriptor } from '../types';
import { matchEntries } from './matcher';

function fields(...overrides: Partial<FieldDescriptor>[]): ClassifiedField[] {
  return overrides.map((o, index) =>
    classifyField({
      index,
      tag: 'input',
      type: 'text',
      name: '',
      id: '',
      autocomplete: '',
      placeholder: '',
      label: '',
      ariaLabel: '',
      context: '',
      ...o,
    }),
  );
}

function fill(template: string, form: ClassifiedField[], fillLeftovers = true) {
  const result = matchEntries(parseTemplate(template), form, { fillLeftovers });
  return Object.fromEntries(result.map((a) => [form[a.fieldIndex]!.label, a.value]));
}

describe('matchEntries', () => {
  it('matches values by type regardless of order', () => {
    const form = fields({ label: 'Email' }, { label: 'Телефон' }, { label: 'ФИО' });
    expect(fill('+7 999 123-45-67\nИванов Иван Иванович\na@b.ru', form)).toEqual({
      Email: 'a@b.ru',
      Телефон: '+7 999 123-45-67',
      ФИО: 'Иванов Иван Иванович',
    });
  });

  it('splits one full name across separate name fields', () => {
    const form = fields({ label: 'Фамилия' }, { label: 'Имя' }, { label: 'Отчество' });
    expect(fill('Иванов Иван Иванович', form)).toEqual({
      Фамилия: 'Иванов',
      Имя: 'Иван',
      Отчество: 'Иванович',
    });
  });

  it('keeps the order for values of the same type', () => {
    const form = fields({ label: 'Дата рождения' }, { label: 'Дата выдачи' });
    expect(fill('01.08.2000\n01.08.2026', form)).toEqual({
      'Дата рождения': '01.08.2000',
      'Дата выдачи': '01.08.2026',
    });
  });

  it('prefers an explicit label over order', () => {
    const form = fields({ label: 'Дата рождения' }, { label: 'Дата выдачи' });
    expect(fill('Дата выдачи: 01.08.2026\n01.08.2000', form)).toEqual({
      'Дата рождения': '01.08.2000',
      'Дата выдачи': '01.08.2026',
    });
  });

  it('puts unrecognised values into unrecognised fields in order', () => {
    const form = fields({ label: 'Email' }, { label: 'Кличка питомца' }, { label: 'Любимый цвет' });
    expect(fill('Барсик\na@b.ru\nсиний', form)).toEqual({
      Email: 'a@b.ru',
      'Кличка питомца': 'Барсик',
      'Любимый цвет': 'синий',
    });
    expect(fill('Барсик\na@b.ru', form, false)).toEqual({ Email: 'a@b.ru' });
  });

  it('uses each value only once, except passwords', () => {
    const form = fields(
      { label: 'Пароль', type: 'password' },
      { label: 'Повторите пароль', type: 'password' },
      { label: 'Телефон' },
    );
    expect(fill('Пароль: Qwerty123!', form)).toEqual({
      Пароль: 'Qwerty123!',
      'Повторите пароль': 'Qwerty123!',
    });
  });

  it('fills a select only with an existing option', () => {
    const form = fields(
      { label: 'Пол', tag: 'select', options: ['—', 'Мужской', 'Женский'] },
      { label: 'Город', tag: 'select', options: ['Москва', 'Казань'] },
    );
    expect(fill('Женский\nСамара', form)).toEqual({ Пол: 'Женский' });
  });

  it('does not put a labelled value into a random field when the label is not found', () => {
    const form = fields({ label: 'Водительское удостоверение' }, { label: 'Кличка питомца' });
    expect(fill('Комментарий: Тестовая заявка', form)).toEqual({});
  });

  describe('questionnaire for two people', () => {
    const form = fields(
      { label: 'ФИО' },
      { label: 'Дата рождения', type: 'date' },
      { label: 'Адрес' },
      { label: 'Паспорт' },
      { label: 'Код подразделения' },
      { label: 'Дата выдачи', type: 'date' },
      { label: 'Электронная почта' },
      { label: 'Телефон' },
      { label: 'ФИО второго участника' },
      { label: 'Дата рождения второго участника', type: 'date' },
      { label: 'Водительское удостоверение' },
      { label: 'Дата окончания', type: 'date' },
    );
    const base = [
      'Иванов Иван Иванович',
      '01.08.1990',
      'г. Москва, ул. Тверская, д. 1, кв. 10',
      '4510 123456',
      '770-001',
      'test@example.com',
      '+7 (999) 123-45-67',
    ];

    it('repeats values when the template has fewer of them than fields', () => {
      const result = matchEntries(parseTemplate(base.join('\n')), form, {
        fillLeftovers: true,
        reuseValues: true,
      });
      expect(result).toHaveLength(form.length);
      expect(result.filter((a) => a.reason === 'repeat').map((a) => form[a.fieldIndex]!.label)).toEqual([
        'Дата выдачи',
        'ФИО второго участника',
        'Дата рождения второго участника',
        'Водительское удостоверение',
        'Дата окончания',
      ]);
    });

    it('uses distinct values when the template has enough of them', () => {
      const template = [
        ...base,
        'Дата выдачи: 15.08.2010',
        'Петров Пётр Петрович',
        '02.02.1985',
        'Водительское удостоверение: 9900 654321',
        'Дата окончания: 01.03.2030',
      ].join('\n');
      expect(fill(template, form)).toMatchObject({
        ФИО: 'Иванов Иван Иванович',
        'Дата рождения': '01.08.1990',
        Паспорт: '4510 123456',
        'Дата выдачи': '15.08.2010',
        'ФИО второго участника': 'Петров Пётр Петрович',
        'Дата рождения второго участника': '02.02.1985',
        'Водительское удостоверение': '9900 654321',
        'Дата окончания': '01.03.2030',
      });
    });
  });

  it('resolves CSS selectors through the callback', () => {
    const form = fields({ label: 'A' }, { label: 'B' });
    const result = matchEntries(parseTemplate('#b: value'), form, {
      fillLeftovers: false,
      resolveSelector: (selector) => (selector === '#b' ? [1] : []),
    });
    expect(result).toEqual([
      expect.objectContaining({ fieldIndex: 1, value: 'value', reason: 'selector' }),
    ]);
  });
});

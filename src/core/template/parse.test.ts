import { describe, expect, it } from 'vitest';
import { parseTemplate } from './parse';
import { expandVariables } from './variables';

describe('parseTemplate', () => {
  it('skips empty lines and comments but keeps line numbers', () => {
    const entries = parseTemplate('// комментарий\nИванов Иван\n\n01.01.2000');
    expect(entries.map((e) => [e.line, e.kind])).toEqual([
      [1, 'fullName'],
      [3, 'date'],
    ]);
  });

  it('reads «Метка: значение» and infers the field kind from the label', () => {
    const [entry] = parseTemplate('Фамилия: Петров');
    expect(entry).toMatchObject({ label: 'Фамилия', value: 'Петров', labelKind: 'lastName' });
    expect(entry?.parts).toEqual({ lastName: 'Петров' });
  });

  it('keeps name parts when the label confirms the value type', () => {
    const [entry] = parseTemplate('ФИО: Иванов Иван Иванович');
    expect(entry?.parts).toMatchObject({ fullName: 'Иванов Иван Иванович', firstName: 'Иван' });
  });

  it('reads CSS selectors', () => {
    expect(parseTemplate('#promo: SALE')[0]).toMatchObject({ selector: '#promo', value: 'SALE' });
  });

  it('does not treat URLs and time as labels', () => {
    const [url] = parseTemplate('https://example.com');
    expect(url?.kind).toBe('url');
    expect(url?.label).toBeUndefined();
    expect(parseTemplate('10:30')[0]?.label).toBeUndefined();
  });
});

describe('expandVariables', () => {
  const context = {
    now: new Date(2026, 8, 22, 12),
    random: () => 0.5,
    uuid: () => 'uuid-1',
  };

  it('expands built-in variables', () => {
    expect(expandVariables('{{today}} {{today+10}} {{today-22}}', context)).toBe(
      '22.09.2026 02.10.2026 31.08.2026',
    );
    expect(expandVariables('{{rand:4}} {{uuid}}', context)).toBe('5555 uuid-1');
    expect(expandVariables('qa+{{ts}}@x.ru', context)).toBe(`qa+${context.now.getTime()}@x.ru`);
  });

  it('leaves unknown variables as is', () => {
    expect(expandVariables('{{nope}}', context)).toBe('{{nope}}');
  });
});

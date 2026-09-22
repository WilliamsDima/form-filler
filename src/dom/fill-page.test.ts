import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '@/storage/settings';
import { fillPage } from './fill-page';

// В jsdom нет раскладки, поэтому все элементы считаем видимыми.
const allVisible = () => true;

const TEMPLATE = [
  'Иванов Иван Иванович',
  '01.08.2000',
  'Московская обл., г. Химки, ул. Ленина, д 2',
  '4510 123456',
  '770-001',
  '01.08.2026',
  'qa-test@example.dev',
  '+7 (900) 555-01-02',
].join('\n');

const value = (selector: string) => document.querySelector<HTMLInputElement>(selector)!.value;

describe('fillPage', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form>
        <label for="ln">Фамилия</label><input id="ln">
        <label>Имя <input name="first_name"></label>
        <div class="field"><div class="caption">Отчество</div><div><input id="mn"></div></div>
        <input type="date" id="bd" aria-label="Дата рождения">
        <input id="email" type="email">
        <input id="phone" placeholder="Телефон">
        <input id="series" placeholder="Серия">
        <input id="number" placeholder="Номер паспорта">
        <input id="issued" placeholder="Дата выдачи">
        <input id="code" name="divisionCode">
        <textarea id="address" name="registrationAddress"></textarea>
        <input id="disabled" disabled placeholder="Телефон">
        <input type="checkbox" id="agree">
      </form>`;
  });

  it('fills a realistic form', () => {
    const report = fillPage({ text: TEMPLATE, settings: DEFAULT_SETTINGS }, document, allVisible);

    expect(value('#ln')).toBe('Иванов');
    expect(value('[name=first_name]')).toBe('Иван');
    expect(value('#mn')).toBe('Иванович');
    expect(value('#bd')).toBe('2000-08-01');
    expect(value('#email')).toBe('qa-test@example.dev');
    expect(value('#phone')).toBe('+7 (900) 555-01-02');
    expect(value('#series')).toBe('4510');
    expect(value('#number')).toBe('123456');
    expect(value('#issued')).toBe('01.08.2026');
    expect(value('#code')).toBe('770-001');
    expect(value('#address')).toContain('Московская обл.');
    expect(value('#disabled')).toBe('');
    expect(report.total).toBe(11);
    expect(report.filled).toHaveLength(11);
  });

  it('dispatches input and change events for frameworks', () => {
    const onInput = vi.fn();
    const onChange = vi.fn();
    document.querySelector('#email')!.addEventListener('input', onInput);
    document.querySelector('#email')!.addEventListener('change', onChange);

    fillPage({ text: 'a@b.ru', settings: DEFAULT_SETTINGS }, document, allVisible);

    expect(onInput).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('keeps existing values when overwrite is off', () => {
    document.querySelector<HTMLInputElement>('#email')!.value = 'keep@me.ru';
    fillPage(
      { text: 'a@b.ru', settings: { ...DEFAULT_SETTINGS, overwrite: false } },
      document,
      allVisible,
    );
    expect(value('#email')).toBe('keep@me.ru');
  });

  it('finds fields inside open shadow roots', () => {
    const host = document.createElement('div');
    host.attachShadow({ mode: 'open' }).innerHTML = '<input type="email">';
    document.body.replaceChildren(host);

    const report = fillPage({ text: 'a@b.ru', settings: DEFAULT_SETTINGS }, document, allVisible);

    expect(host.shadowRoot!.querySelector('input')!.value).toBe('a@b.ru');
    expect(report.filled).toHaveLength(1);
  });
});

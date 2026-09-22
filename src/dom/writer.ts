import { findOption } from '@/core/fields/options';
import { toInputDateValue } from '@/core/format';
import { digitsOnly } from '@/core/text';
import type { FieldKind } from '@/core/types';
import type { FillableElement } from './scanner';

/**
 * Записывает значение в поле так, чтобы его «увидел» фреймворк страницы.
 *
 * React, Vue и Angular следят за полями через события, а не через свойство value,
 * поэтому значение ставится нативным сеттером, после чего отправляются
 * те же события, что и при ручном вводе: focus → input → change → blur.
 */
export function writeValue(element: FillableElement, value: string, kind: FieldKind): boolean {
  element.focus({ preventScroll: true });

  const written =
    element instanceof HTMLSelectElement
      ? writeSelect(element, value)
      : element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
        ? writeText(element, prepareValue(element, value, kind))
        : writeContentEditable(element, value);

  element.blur();
  return written;
}

function prepareValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
  kind: FieldKind,
): string {
  if (element instanceof HTMLInputElement) {
    if (kind === 'date' || ['date', 'datetime-local', 'month'].includes(element.type)) {
      value = toInputDateValue(value, element.type);
    }
    if (element.type === 'number') value = value.replace(',', '.').replace(/[^\d.-]/g, '');
  }

  // Поле с маской или ограничением длины: «+7 (999) 123-45-67» не влезет в maxlength=10.
  const { maxLength } = element;
  if (maxLength > 0 && value.length > maxLength) {
    const formattedNumber = /^[\d\s()+\-.]+$/.test(value);
    value = formattedNumber ? digitsOnly(value).slice(-maxLength) : value.slice(0, maxLength);
  }
  return value;
}

function writeText(element: HTMLInputElement | HTMLTextAreaElement, value: string): boolean {
  const prototype = Object.getPrototypeOf(element) as HTMLInputElement | HTMLTextAreaElement;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  if (setter) setter.call(element, value);
  else element.value = value;

  element.dispatchEvent(
    new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: value }),
  );
  element.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

function writeSelect(element: HTMLSelectElement, value: string): boolean {
  const index = findOption(
    [...element.options].map((option) => option.text || option.value),
    value,
  );
  if (index === -1) return false;
  element.selectedIndex = index;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

/** Rich-text редакторы надёжнее всего понимают «настоящую» вставку текста. */
function writeContentEditable(element: HTMLElement, value: string): boolean {
  const selection = element.ownerDocument.getSelection();
  selection?.selectAllChildren(element);
  // execCommand устарел, но это единственный способ сымитировать ввод в редактор.
  const inserted = element.ownerDocument.execCommand?.('insertText', false, value);
  if (!inserted) {
    element.textContent = value;
    element.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
  }
  return true;
}

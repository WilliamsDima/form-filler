import type { FieldDescriptor, FieldTag } from '@/core/types';

export type FillableElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement
  | HTMLElement;

/** Типы input, которые заполняются текстом. Чекбоксы, файлы и кнопки пропускаем. */
const TEXT_INPUT_TYPES = new Set([
  'text',
  'email',
  'tel',
  'url',
  'number',
  'search',
  'password',
  'date',
  'datetime-local',
  'month',
]);

const FIELD_SELECTOR = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';
const MAX_CONTEXT_LENGTH = 80;

export type VisibilityCheck = (element: Element) => boolean;

export const isVisible: VisibilityCheck = (element) =>
  element.checkVisibility
    ? element.checkVisibility({ visibilityProperty: true, opacityProperty: false })
    : element.getClientRects().length > 0;

/**
 * Собирает все видимые редактируемые поля в порядке документа,
 * заглядывая внутрь открытых Shadow DOM (веб-компоненты, дизайн-системы).
 */
export function scanFields(root: ParentNode, visible: VisibilityCheck = isVisible): FillableElement[] {
  return collect(root).filter((element) => isFillable(element) && visible(element));
}

function collect(root: ParentNode): HTMLElement[] {
  const result: HTMLElement[] = [];
  for (const element of root.querySelectorAll<HTMLElement>(`${FIELD_SELECTOR}, *`)) {
    if (element.matches(FIELD_SELECTOR)) result.push(element);
    if (element.shadowRoot) result.push(...collect(element.shadowRoot));
  }
  return result;
}

function isFillable(element: HTMLElement): boolean {
  if (element instanceof HTMLInputElement) {
    return TEXT_INPUT_TYPES.has(element.type) && !element.disabled && !element.readOnly;
  }
  if (element instanceof HTMLTextAreaElement) return !element.disabled && !element.readOnly;
  if (element instanceof HTMLSelectElement) return !element.disabled && !element.multiple;
  // Вложенные contenteditable — это части одного редактора, берём только внешний.
  return element.isContentEditable && !element.parentElement?.isContentEditable;
}

export function hasValue(element: FillableElement): boolean {
  if (element instanceof HTMLSelectElement) return element.selectedIndex > 0;
  if ('value' in element && typeof element.value === 'string') return element.value.trim() !== '';
  return (element.textContent ?? '').trim() !== '';
}

/** Снимает с элемента всё, по чему можно понять смысл поля. */
export function describeField(element: FillableElement, index: number): FieldDescriptor {
  const input = element instanceof HTMLInputElement ? element : null;
  const select = element instanceof HTMLSelectElement ? element : null;

  return {
    index,
    tag: tagOf(element),
    type: input?.type ?? '',
    name: element.getAttribute('name') ?? '',
    id: element.id,
    autocomplete: element.getAttribute('autocomplete') ?? '',
    placeholder: element.getAttribute('placeholder') ?? '',
    label: labelText(element),
    ariaLabel: ariaText(element),
    context: contextText(element),
    maxLength: input && input.maxLength > 0 ? input.maxLength : undefined,
    options: select ? [...select.options].map((option) => option.text || option.value) : undefined,
  };
}

function tagOf(element: FillableElement): FieldTag {
  if (element instanceof HTMLInputElement) return 'input';
  if (element instanceof HTMLTextAreaElement) return 'textarea';
  if (element instanceof HTMLSelectElement) return 'select';
  return 'contenteditable';
}

function clean(text: string | null | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').replace(/[*:]+\s*$/, '').trim();
}

function labelText(element: FillableElement): string {
  const labels = 'labels' in element ? element.labels : null;
  if (labels?.length) return clean([...labels].map(textWithoutFields).join(' '));
  const wrapping = element.closest('label');
  return wrapping ? clean(textWithoutFields(wrapping)) : '';
}

function ariaText(element: FillableElement): string {
  const labelledBy = element.getAttribute('aria-labelledby');
  const root = element.getRootNode() as Document | ShadowRoot;
  const referenced = labelledBy
    ?.split(/\s+/)
    .map((id) => root.getElementById?.(id)?.textContent)
    .join(' ');
  return clean(
    [element.getAttribute('aria-label'), referenced, element.getAttribute('title')].join(' '),
  );
}

/**
 * Многие UI-киты рисуют подпись обычным <div> рядом с полем, без <label>.
 * Ищем ближайший короткий текст перед полем, поднимаясь на несколько уровней вверх.
 */
function contextText(element: FillableElement): string {
  let node: Element | null = element;
  for (let depth = 0; node && depth < 4; depth++) {
    for (let sibling = node.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
      if (sibling.matches(FIELD_SELECTOR) || sibling.querySelector(FIELD_SELECTOR)) break;
      const text = clean(sibling.textContent);
      if (text && text.length <= MAX_CONTEXT_LENGTH) return text;
    }
    node = node.parentElement;
    if (node?.querySelectorAll(FIELD_SELECTOR).length !== 1) break;
  }
  return '';
}

function textWithoutFields(label: Element): string {
  const copy = label.cloneNode(true) as Element;
  copy.querySelectorAll('input, select, textarea, option').forEach((child) => child.remove());
  return copy.textContent ?? '';
}

/**
 * Короткая вспышка вокруг заполненного поля. Web Animations API не трогает
 * стили страницы: после анимации от неё не остаётся следов.
 */
export function flash(element: Element, delay = 0): void {
  element.animate?.(
    [
      { outline: '2px solid rgb(99 91 255 / 0.9)', outlineOffset: '2px', boxShadow: '0 0 0 6px rgb(99 91 255 / 0.25)' },
      { outline: '2px solid rgb(99 91 255 / 0)', outlineOffset: '6px', boxShadow: '0 0 0 12px rgb(99 91 255 / 0)' },
    ],
    { duration: 900, delay, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  );
}

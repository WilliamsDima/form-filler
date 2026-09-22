import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';
import { fillPage } from '@/dom/fill-page';
import type { FormFillGlobal } from '@/services/fill-tab';

/**
 * Внедряется в страницу по запросу и регистрирует API заполнения.
 * Сам вызов делает fillTab() отдельным executeScript — так можно передать аргументы
 * и получить результат из каждого фрейма.
 */
export default defineUnlistedScript(() => {
  (globalThis as FormFillGlobal).__formFill = { fill: (payload) => fillPage(payload) };
});

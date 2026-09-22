import { browser } from 'wxt/browser';
import type { Template } from '@/storage/templates';

const ROOT_ID = 'formfill';
const TEMPLATE_PREFIX = 'formfill:template:';
const MENU_CONTEXTS = ['page', 'editable', 'frame'] as const;

/** Пересобирает контекстное меню: «FormFill → <шаблон>» для каждого шаблона. */
export async function rebuildContextMenu(templates: Template[]): Promise<void> {
  await browser.contextMenus.removeAll();
  browser.contextMenus.create({
    id: ROOT_ID,
    title: 'Заполнить форму',
    contexts: [...MENU_CONTEXTS],
  });
  for (const template of templates) {
    browser.contextMenus.create({
      id: TEMPLATE_PREFIX + template.id,
      parentId: ROOT_ID,
      title: template.name,
      contexts: [...MENU_CONTEXTS],
    });
  }
}

/** Достаёт id шаблона из id пункта меню. */
export function templateIdFromMenu(menuItemId: string | number): string | undefined {
  const id = String(menuItemId);
  return id.startsWith(TEMPLATE_PREFIX) ? id.slice(TEMPLATE_PREFIX.length) : undefined;
}

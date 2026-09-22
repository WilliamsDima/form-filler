import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { showBadge } from '@/services/badge';
import { rebuildContextMenu, templateIdFromMenu } from '@/services/context-menu';
import { fillTab } from '@/services/fill-tab';
import { templatesItem } from '@/storage/templates';

export default defineBackground(() => {
  // Все слушатели регистрируются синхронно: service worker MV3 может быть
  // выгружен в любой момент, и браузер будит его только ради известных событий.
  browser.runtime.onInstalled.addListener(syncContextMenu);
  browser.runtime.onStartup.addListener(syncContextMenu);
  templatesItem.watch((templates) => void rebuildContextMenu(templates));

  browser.commands.onCommand.addListener((command, tab) => {
    if (command === 'fill-form' && tab?.id !== undefined) void fillWithBadge(tab.id);
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (tab?.id === undefined) return;
    void fillWithBadge(tab.id, templateIdFromMenu(info.menuItemId));
  });
});

async function syncContextMenu(): Promise<void> {
  await rebuildContextMenu(await templatesItem.getValue());
}

async function fillWithBadge(tabId: number, templateId?: string): Promise<void> {
  try {
    const { filled } = await fillTab(tabId, templateId);
    await showBadge(tabId, String(filled.length));
  } catch (error) {
    console.warn('[FormFill]', error);
    await showBadge(tabId, '!', true);
  }
}

import { browser } from 'wxt/browser';

const BADGE_TIMEOUT = 4000;

/** Показывает на иконке расширения, сколько полей заполнено (или «!» при ошибке). */
export async function showBadge(tabId: number, text: string, isError = false): Promise<void> {
  await browser.action.setBadgeBackgroundColor({ tabId, color: isError ? '#e5484d' : '#635bff' });
  await browser.action.setBadgeTextColor?.({ tabId, color: '#ffffff' });
  await browser.action.setBadgeText({ tabId, text });
  setTimeout(() => void browser.action.setBadgeText({ tabId, text: '' }).catch(() => {}), BADGE_TIMEOUT);
}

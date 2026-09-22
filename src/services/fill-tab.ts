import { browser } from 'wxt/browser';
import { expandVariables } from '@/core/template/variables';
import type { FilledField, FillReport } from '@/core/types';
import type { FillPayload } from '@/dom/fill-page';
import { getSettings } from '@/storage/settings';
import { getTemplate } from '@/storage/templates';

export interface FillResult {
  templateName: string;
  total: number;
  filled: FilledField[];
}

export class FillError extends Error {
  override name = 'FillError';
}

/** Контракт между расширением и скриптом, внедрённым в страницу (см. entrypoints/filler.ts). */
export interface FormFillGlobal {
  __formFill?: { fill: (payload: FillPayload) => FillReport };
}

/**
 * Заполняет форму на вкладке шаблоном (по умолчанию — активным).
 *
 * Скрипт не висит на каждой странице постоянно: он внедряется по запросу через
 * `scripting` + `activeTab`, поэтому расширению не нужен доступ ко всем сайтам.
 */
export async function fillTab(tabId: number, templateId?: string): Promise<FillResult> {
  const [template, settings] = await Promise.all([getTemplate(templateId), getSettings()]);
  if (!template) throw new FillError('Шаблон не найден');

  // Переменные раскрываются один раз, чтобы во всех фреймах были одинаковые значения.
  const payload: FillPayload = { text: expandVariables(template.content), settings };
  const target = { tabId, allFrames: true };

  try {
    await browser.scripting.executeScript({ target, files: ['/filler.js'] });
    const results = await browser.scripting.executeScript({
      target,
      args: [payload],
      func: (payload: FillPayload) =>
        (globalThis as FormFillGlobal).__formFill?.fill(payload) ?? null,
    });

    const reports = results.map((r) => r.result as FillReport | null).filter((r) => r !== null);
    return {
      templateName: template.name,
      total: reports.reduce((sum, r) => sum + r.total, 0),
      filled: reports.flatMap((r) => r.filled),
    };
  } catch (error) {
    throw new FillError(explain(error));
  }
}

function explain(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/cannot access|cannot be scripted|extensions gallery|chrome:\/\/|edge:\/\//i.test(message)) {
    return 'Эту страницу заполнить нельзя: браузер запрещает расширениям служебные страницы и магазин расширений.';
  }
  if (/permission|host/i.test(message)) {
    return 'Нет доступа к странице. Откройте попап расширения на нужной вкладке и повторите.';
  }
  return message;
}

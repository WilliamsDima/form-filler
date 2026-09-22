import { classifyLabel } from '../fields/field-classifier';
import type { TemplateEntry } from '../types';
import { classifyValue, valueParts } from './value-classifier';

/**
 * «Метка: значение» — двоеточие обязательно с пробелом после него,
 * чтобы не путать с URL (https://…) и временем (10:30).
 */
const LABELED_LINE = /^([^:]{1,60}?)\s*:\s+(.+)$/;
const SELECTOR_KEY = /^[#.[]/;
const COMMENT = /^\/\//;

/**
 * Разбирает текст шаблона: одна непустая строка — одно значение.
 * Строки, начинающиеся с «//», считаются комментариями.
 */
export function parseTemplate(text: string): TemplateEntry[] {
  const entries: TemplateEntry[] = [];

  text.split(/\r?\n/).forEach((rawLine, line) => {
    const content = rawLine.trim();
    if (!content || COMMENT.test(content)) return;

    const labeled = LABELED_LINE.exec(content);
    const key = labeled?.[1]?.trim();
    const value = (labeled?.[2] ?? content).trim();
    const kind = classifyValue(value);
    const parts = valueParts(value, kind);

    const entry: TemplateEntry = { id: entries.length, line, value, kind, parts };

    if (key && SELECTOR_KEY.test(key)) {
      entry.selector = key;
    } else if (key) {
      entry.label = key;
      entry.labelKind = classifyLabel(key);
      // Метка важнее догадок по значению: «Фамилия: Петров» подойдёт полю фамилии,
      // даже если подписи на странице отличаются. Разбивку на части оставляем,
      // только если метка подтверждает тип значения («ФИО: Иванов Иван Иванович»).
      const { labelKind } = entry;
      if (labelKind && parts[labelKind] !== value) entry.parts = { [labelKind]: value };
    }

    entries.push(entry);
  });

  return entries;
}

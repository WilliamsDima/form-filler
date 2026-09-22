import { classifyField } from '@/core/fields/field-classifier';
import { matchEntries } from '@/core/matching/matcher';
import { parseTemplate } from '@/core/template/parse';
import type { FieldDescriptor, FillReport, FillSettings } from '@/core/types';
import { flash } from './highlight';
import { describeField, hasValue, isVisible, scanFields, type VisibilityCheck } from './scanner';
import { writeValue } from './writer';

export interface FillPayload {
  /** Текст шаблона с уже подставленными переменными. */
  text: string;
  settings: FillSettings;
}

/**
 * Заполняет формы в текущем документе:
 * найти поля → понять их смысл → сопоставить со значениями → записать.
 */
export function fillPage(
  { text, settings }: FillPayload,
  root: Document = document,
  visible: VisibilityCheck = isVisible,
): FillReport {
  const all = scanFields(root, visible);
  const elements = settings.overwrite ? all : all.filter((element) => !hasValue(element));
  const fields = elements.map((element, index) => classifyField(describeField(element, index)));

  const assignments = matchEntries(parseTemplate(text), fields, {
    fillLeftovers: settings.fillLeftovers,
    reuseValues: settings.reuseValues,
    resolveSelector: (selector) => {
      try {
        return elements.flatMap((element, index) => (element.matches(selector) ? [index] : []));
      } catch {
        return []; // некорректный селектор в шаблоне
      }
    },
  });

  const filled: FillReport['filled'] = [];
  for (const { fieldIndex, value, kind, reason } of assignments) {
    const element = elements[fieldIndex];
    const field = fields[fieldIndex];
    if (!element || !field || !writeValue(element, value, kind)) continue;

    if (settings.highlight) flash(element, filled.length * 40);
    filled.push({ field: displayName(field), value, kind, reason });
  }

  return { total: all.length, filled };
}

function displayName(field: FieldDescriptor): string {
  return (
    [field.label, field.ariaLabel, field.placeholder, field.context, field.name, field.id].find(
      Boolean,
    ) ?? `Поле №${field.index + 1}`
  );
}

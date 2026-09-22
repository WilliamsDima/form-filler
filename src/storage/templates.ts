import { storage } from 'wxt/utils/storage';

export interface Template {
  id: string;
  name: string;
  content: string;
  updatedAt: number;
}

export const TEMPLATE_MAX_LENGTH = 2000;

const DEFAULT_TEMPLATE: Template = {
  id: 'default',
  name: 'Тестовый клиент',
  updatedAt: 0,
  content: [
    '// Одно значение на строку — тип определяется автоматически',
    'Иванов Иван Иванович',
    '01.08.1990',
    'test+{{ts}}@example.com',
    '+7 (999) 123-45-67',
    '4510 123456',
    '770-001',
    'г. Москва, ул. Тверская, д. 1, кв. 10',
    'Комментарий: Тестовая заявка от {{today}}',
  ].join('\n'),
};

export const templatesItem = storage.defineItem<Template[]>('local:templates', {
  fallback: [DEFAULT_TEMPLATE],
  version: 1,
});

export const activeTemplateIdItem = storage.defineItem<string>('local:activeTemplateId', {
  fallback: DEFAULT_TEMPLATE.id,
});

export async function getTemplate(id?: string): Promise<Template | undefined> {
  const [templates, activeId] = await Promise.all([
    templatesItem.getValue(),
    activeTemplateIdItem.getValue(),
  ]);
  const wanted = id ?? activeId;
  return templates.find((t) => t.id === wanted) ?? templates[0];
}

export async function createTemplate(name: string, content = ''): Promise<Template> {
  const template: Template = { id: crypto.randomUUID(), name, content, updatedAt: Date.now() };
  await templatesItem.setValue([...(await templatesItem.getValue()), template]);
  await activeTemplateIdItem.setValue(template.id);
  return template;
}

export async function updateTemplate(
  id: string,
  patch: Partial<Pick<Template, 'name' | 'content'>>,
): Promise<void> {
  const templates = await templatesItem.getValue();
  await templatesItem.setValue(
    templates.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)),
  );
}

/** Удаляет шаблон; последний оставшийся удалить нельзя. */
export async function deleteTemplate(id: string): Promise<void> {
  const templates = await templatesItem.getValue();
  if (templates.length <= 1) return;
  const rest = templates.filter((t) => t.id !== id);
  await templatesItem.setValue(rest);
  if ((await activeTemplateIdItem.getValue()) === id) {
    await activeTemplateIdItem.setValue(rest[0]!.id);
  }
}

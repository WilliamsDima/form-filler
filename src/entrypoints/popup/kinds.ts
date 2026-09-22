import type { FieldKind, TemplateEntry } from '@/core/types';

type Tone = 'person' | 'contact' | 'date' | 'document' | 'place' | 'secret' | 'plain' | 'exact';

interface KindMeta {
  badge: string;
  title: string;
  tone: Tone;
}

export const KIND_META: Record<FieldKind, KindMeta> = {
  fullName: { badge: 'ФИО', title: 'ФИО — заполнит и раздельные поля фамилии, имени, отчества', tone: 'person' },
  lastName: { badge: 'Фам.', title: 'Фамилия', tone: 'person' },
  firstName: { badge: 'Имя', title: 'Имя', tone: 'person' },
  middleName: { badge: 'Отч.', title: 'Отчество', tone: 'person' },
  email: { badge: 'Email', title: 'Электронная почта', tone: 'contact' },
  phone: { badge: 'Тел.', title: 'Телефон', tone: 'contact' },
  url: { badge: 'URL', title: 'Ссылка', tone: 'contact' },
  date: { badge: 'Дата', title: 'Дата — для полей type=date формат подберётся сам', tone: 'date' },
  passport: { badge: 'Паспорт', title: 'Паспорт — заполнит и раздельные поля серии и номера', tone: 'document' },
  passportSeries: { badge: 'Серия', title: 'Серия паспорта', tone: 'document' },
  passportNumber: { badge: 'Номер', title: 'Номер паспорта', tone: 'document' },
  divisionCode: { badge: 'Код', title: 'Код подразделения', tone: 'document' },
  driverLicense: { badge: 'ВУ', title: 'Водительское удостоверение', tone: 'document' },
  snils: { badge: 'СНИЛС', title: 'СНИЛС', tone: 'document' },
  inn: { badge: 'ИНН', title: 'ИНН', tone: 'document' },
  address: { badge: 'Адрес', title: 'Адрес', tone: 'place' },
  password: { badge: 'Пароль', title: 'Пароль — попадёт и в поле подтверждения', tone: 'secret' },
  number: { badge: 'Число', title: 'Число', tone: 'plain' },
  text: { badge: 'Текст', title: 'Текст — займёт первое свободное нераспознанное поле', tone: 'plain' },
};

/** Как показать строку шаблона в редакторе: бейдж, подсказка и цвет. */
export function describeEntry(entry: TemplateEntry): KindMeta {
  if (entry.selector) {
    return { badge: 'CSS', title: `Точно в поле по селектору ${entry.selector}`, tone: 'exact' };
  }
  if (entry.label && !entry.labelKind) {
    return { badge: 'Метка', title: `В поле с подписью «${entry.label}»`, tone: 'exact' };
  }
  const meta = KIND_META[entry.labelKind ?? entry.kind];
  return entry.label
    ? { ...meta, title: `В поле с подписью «${entry.label}» или любое поле типа «${meta.badge}»` }
    : meta;
}

/** Семантический тип поля формы — «что это поле просит ввести». */
export type FieldKind =
  | 'email'
  | 'phone'
  | 'date'
  | 'fullName'
  | 'lastName'
  | 'firstName'
  | 'middleName'
  | 'passport'
  | 'passportSeries'
  | 'passportNumber'
  | 'divisionCode'
  | 'driverLicense'
  | 'snils'
  | 'inn'
  | 'address'
  | 'url'
  | 'password'
  | 'number'
  | 'text';

/** Тип значения из шаблона — «что это за данные». */
export type ValueKind =
  | 'email'
  | 'phone'
  | 'date'
  | 'fullName'
  | 'passport'
  | 'divisionCode'
  | 'snils'
  | 'inn'
  | 'address'
  | 'url'
  | 'number'
  | 'text';

/** Одна строка шаблона после разбора. */
export interface TemplateEntry {
  /** Порядковый номер значения в шаблоне. */
  id: number;
  /** Номер строки в исходном тексте (с 0) — нужен редактору для подсветки. */
  line: number;
  value: string;
  kind: ValueKind;
  /** Явная метка из строки вида «Метка: значение». */
  label?: string;
  /** CSS-селектор из строки вида «#email: значение». */
  selector?: string;
  /** Тип поля, на который указывает метка (например, «Фамилия» → lastName). */
  labelKind?: FieldKind;
  /**
   * Во что может превратиться значение для полей разных типов.
   * Например, ФИО даёт fullName, а также lastName/firstName/middleName по отдельности.
   */
  parts: Partial<Record<FieldKind, string>>;
}

export type FieldTag = 'input' | 'textarea' | 'select' | 'contenteditable';

/** Независимое от DOM описание поля — всё, что нужно для его классификации. */
export interface FieldDescriptor {
  /** Позиция поля в порядке документа. */
  index: number;
  tag: FieldTag;
  /** Атрибут type для input, иначе пустая строка. */
  type: string;
  name: string;
  id: string;
  autocomplete: string;
  placeholder: string;
  /** Текст связанного <label>. */
  label: string;
  /** aria-label / aria-labelledby / title. */
  ariaLabel: string;
  /** Ближайший текст рядом с полем, если нормальной подписи нет. */
  context: string;
  maxLength?: number;
  /** Тексты вариантов для <select>. */
  options?: string[];
}

export interface ClassifiedField extends FieldDescriptor {
  kind: FieldKind;
  /** Насколько уверенно определён тип; 0 — тип не распознан. */
  confidence: number;
}

/** Почему значение попало в поле — показывается пользователю в отчёте. */
export type MatchReason = 'selector' | 'label' | 'kind' | 'fallback' | 'repeat';

export interface Assignment {
  fieldIndex: number;
  entryId: number;
  value: string;
  kind: FieldKind;
  reason: MatchReason;
}

export interface FillSettings {
  /** Подсвечивать заполненные поля. */
  highlight: boolean;
  /** Перезаписывать поля, в которых уже есть значение. */
  overwrite: boolean;
  /** Раскладывать нераспознанные значения по нераспознанным полям по порядку. */
  fillLeftovers: boolean;
  /** Повторять значения, если однотипных полей больше, чем значений в шаблоне. */
  reuseValues: boolean;
}

export interface FilledField {
  field: string;
  value: string;
  kind: FieldKind;
  reason: MatchReason;
}

/** Результат заполнения одного фрейма страницы. */
export interface FillReport {
  total: number;
  filled: FilledField[];
}

import { stem, word } from '../text';
import type { FieldKind } from '../types';

/**
 * Словарь признаков: по каким словам в подписи, name, id или placeholder
 * можно понять тип поля. Вес — насколько признак надёжен.
 * Тексты сравниваются после normalize(): нижний регистр, «ё» → «е», без пунктуации.
 */
export interface FieldRule {
  kind: FieldKind;
  patterns: [RegExp, number][];
  /** Если текст совпал с исключением — правило для этого текста не применяется. */
  exclude?: RegExp;
  inputTypes?: Partial<Record<string, number>>;
  autocomplete?: string[];
}

export const FIELD_RULES: FieldRule[] = [
  {
    kind: 'email',
    inputTypes: { email: 6 },
    autocomplete: ['email'],
    patterns: [
      [stem('e ?mail', 'емейл', 'имейл', 'емайл', 'электронн'), 3],
      [word('почт(?:а|ы|у|е|ой)'), 3],
      [word('mail'), 2],
    ],
  },
  {
    kind: 'phone',
    inputTypes: { tel: 6 },
    autocomplete: ['tel', 'tel-national', 'tel-local', 'mobile'],
    patterns: [
      [stem('телефон', 'phone', 'mobile', 'мобильн', 'сотов'), 3],
      [word('tel', 'тел', 'моб', 'msisdn', 'cell'), 3],
    ],
  },
  {
    kind: 'date',
    inputTypes: { date: 6, 'datetime-local': 6, month: 4 },
    autocomplete: ['bday'],
    patterns: [
      [stem('дата', 'date', 'birth', 'рожден'), 3],
      [word('dob', 'bday', 'дд мм гггг', 'dd mm yyyy'), 3],
    ],
  },
  {
    kind: 'fullName',
    autocomplete: ['name'],
    patterns: [
      [word('фио', 'ф и о', 'fio', 'full ?name', 'fullname'), 6],
      [word('фамилия имя отчество', 'фамилия и имя', 'имя и фамилия', 'полное имя'), 10],
      [word('name', 'your name', 'имя клиента'), 2],
    ],
    exclude: stem('user ?name', 'login', 'company', 'организац', 'компан', 'nick'),
  },
  {
    kind: 'lastName',
    autocomplete: ['family-name'],
    patterns: [[stem('фамил', 'surname', 'last ?name', 'family ?name', 'lname'), 4]],
  },
  {
    kind: 'firstName',
    autocomplete: ['given-name'],
    patterns: [
      [stem('first ?name', 'given ?name', 'fname'), 4],
      [word('имя'), 3],
    ],
    exclude: stem('пользоват', 'user', 'логин', 'login', 'компан', 'организац', 'файл'),
  },
  {
    kind: 'middleName',
    autocomplete: ['additional-name'],
    patterns: [[stem('отчеств', 'middle ?name', 'patronym', 'second ?name', 'mname'), 4]],
  },
  {
    kind: 'passport',
    patterns: [
      [word('серия и номер', 'серия номер', 'series and number', 'series number'), 6],
      [stem('паспорт', 'passport'), 2],
    ],
  },
  {
    kind: 'passportSeries',
    patterns: [[stem('сери'), 4]],
  },
  {
    kind: 'passportNumber',
    patterns: [[word('номер паспорта', 'passport number', 'номер документа'), 5]],
  },
  {
    kind: 'divisionCode',
    patterns: [[stem('код подраздел', 'division ?code', 'код подр'), 8]],
  },
  {
    kind: 'driverLicense',
    patterns: [
      [stem('водительск', 'удостоверен', 'driver ?licen', 'driving ?licen'), 8],
      [word('ву', 'в у'), 8],
    ],
  },
  {
    kind: 'snils',
    patterns: [[stem('снилс', 'snils'), 8]],
  },
  {
    kind: 'inn',
    patterns: [[word('инн', 'inn', 'tax ?id'), 8]],
  },
  {
    kind: 'address',
    autocomplete: ['street-address', 'address-line1', 'address-line2', 'address-line3'],
    patterns: [
      [stem('адрес', 'address', 'прожива', 'регистрац', 'место жительства'), 3],
      [stem('улиц', 'street'), 2],
    ],
    exclude: stem('e ?mail', 'электронн', 'почт(?:а|ы|у|е|ой)(?!\\p{L})', 'ip адрес', 'ip address'),
  },
  {
    kind: 'url',
    inputTypes: { url: 6 },
    autocomplete: ['url'],
    patterns: [[stem('сайт', 'url', 'website', 'ссылк', 'link', 'homepage'), 3]],
  },
  {
    kind: 'password',
    inputTypes: { password: 10 },
    autocomplete: ['new-password', 'current-password'],
    patterns: [[stem('парол', 'password', 'passwd'), 4]],
  },
  {
    kind: 'number',
    inputTypes: { number: 2, range: 2 },
    patterns: [[stem('количеств', 'кол во', 'count', 'quantity', 'возраст', 'age', 'сумм', 'amount'), 2]],
  },
];

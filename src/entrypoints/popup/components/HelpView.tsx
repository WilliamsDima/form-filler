import { TEMPLATE_VARIABLES } from '@/core/template/variables';

const STEPS = [
  {
    title: 'Ищет поля',
    text: 'Все видимые поля ввода на странице — в том числе во фреймах и веб-компонентах.',
  },
  {
    title: 'Понимает, что в них просят',
    text: 'По подписи, placeholder, атрибутам name, id, autocomplete и тексту рядом с полем.',
  },
  {
    title: 'Понимает, что в шаблоне',
    text: 'По формату значения: ФИО, дата, e-mail, телефон, паспорт, СНИЛС, ИНН, адрес…',
  },
  {
    title: 'Сопоставляет и вводит',
    text: 'Как при ручном вводе, поэтому формы на React, Vue и Angular видят значения.',
  },
];

const SYNTAX = [
  {
    code: 'Иванов Иван Иванович',
    text: 'Просто значение — тип определится сам. ФИО разложится по полям «Фамилия», «Имя», «Отчество».',
  },
  {
    code: 'Дата выдачи: 01.08.2020',
    text: 'Метка — в поле с такой подписью. Удобно, когда на форме несколько дат или телефонов.',
  },
  {
    code: '#promo: SALE2026',
    text: 'CSS-селектор — точно в указанное поле: #id, .class или [name="…"].',
  },
  { code: '// комментарий', text: 'Строки с // пропускаются.' },
];

export function HelpView() {
  return (
    <div className="view">
      <section className="card">
        <h2 className="card__title">Что происходит при заполнении</h2>
        <ol className="steps">
          {STEPS.map((step) => (
            <li key={step.title} className="steps__item">
              <b>{step.title}.</b> {step.text}
            </li>
          ))}
        </ol>
        <p className="muted">
          Одинаковые типы идут по порядку: первая дата из шаблона — в первое поле даты. Всё, что
          не распознано, раскладывается по оставшимся полям сверху вниз.
        </p>
      </section>

      <section className="card">
        <h2 className="card__title">Синтаксис шаблона</h2>
        <dl className="syntax">
          {SYNTAX.map((item) => (
            <div key={item.code} className="syntax__row">
              <dt>
                <code>{item.code}</code>
              </dt>
              <dd>{item.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card">
        <h2 className="card__title">Переменные</h2>
        <dl className="syntax">
          {TEMPLATE_VARIABLES.map((variable) => (
            <div key={variable.syntax} className="syntax__row">
              <dt>
                <code>{variable.syntax}</code>
              </dt>
              <dd>{variable.description}</dd>
            </div>
          ))}
        </dl>
        <p className="muted">
          Например, <code>qa+{'{{ts}}'}@example.com</code> даёт новый e-mail при каждом заполнении.
        </p>
      </section>

      <section className="card">
        <h2 className="card__title">Без открытия попапа</h2>
        <p className="muted">
          <kbd>Alt+Shift+F</kbd> заполняет форму активным шаблоном. Правый клик на странице →
          «Заполнить форму» → любой шаблон.
        </p>
      </section>
    </div>
  );
}

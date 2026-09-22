import { browser } from 'wxt/browser';
import type { FillSettings } from '@/core/types';

const OPTIONS: { key: keyof FillSettings; title: string; description: string }[] = [
  {
    key: 'overwrite',
    title: 'Перезаписывать заполненные поля',
    description: 'Выключите, чтобы трогать только пустые поля.',
  },
  {
    key: 'fillLeftovers',
    title: 'Заполнять нераспознанные поля по порядку',
    description: 'Значения без явного типа попадут в поля, смысл которых понять не удалось.',
  },
  {
    key: 'reuseValues',
    title: 'Повторять значения, если их не хватает',
    description: 'Одно ФИО в шаблоне, а на форме данные двух человек — ФИО попадёт в оба блока.',
  },
  {
    key: 'highlight',
    title: 'Подсвечивать заполненные поля',
    description: 'Короткая вспышка вокруг каждого поля, куда попало значение.',
  },
];

interface SettingsViewProps {
  settings: FillSettings;
  onChange: (settings: FillSettings) => void;
}

export function SettingsView({ settings, onChange }: SettingsViewProps) {
  return (
    <div className="view">
      <section className="card">
        {OPTIONS.map((option) => (
          <label key={option.key} className="toggle">
            <span className="toggle__text">
              <span className="toggle__title">{option.title}</span>
              <span className="muted">{option.description}</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="toggle__switch"
              checked={settings[option.key]}
              onChange={(event) => onChange({ ...settings, [option.key]: event.target.checked })}
            />
          </label>
        ))}
      </section>

      <section className="card">
        <h2 className="card__title">Горячая клавиша</h2>
        <p className="muted">
          Сейчас: <kbd>Alt+Shift+F</kbd>. Изменить можно на странице{' '}
          <button
            className="link"
            onClick={() => void browser.tabs.create({ url: 'chrome://extensions/shortcuts' })}
          >
            быстрых клавиш расширений
          </button>
          .
        </p>
      </section>
    </div>
  );
}

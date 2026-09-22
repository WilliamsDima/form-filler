import { BackIcon, HelpIcon, Logo, SettingsIcon } from './Icons';

export type View = 'main' | 'help' | 'settings';

const TITLES: Record<View, string> = {
  main: 'FormFill',
  help: 'Как это работает',
  settings: 'Настройки',
};

interface HeaderProps {
  view: View;
  onNavigate: (view: View) => void;
}

export function Header({ view, onNavigate }: HeaderProps) {
  const isMain = view === 'main';

  return (
    <header className="header">
      {isMain ? (
        <Logo />
      ) : (
        <button className="icon-button" onClick={() => onNavigate('main')} aria-label="Назад">
          <BackIcon />
        </button>
      )}
      <h1 className="header__title">{TITLES[view]}</h1>
      {isMain && (
        <nav className="header__actions">
          <button className="icon-button" onClick={() => onNavigate('help')} title="Как это работает">
            <HelpIcon />
          </button>
          <button className="icon-button" onClick={() => onNavigate('settings')} title="Настройки">
            <SettingsIcon />
          </button>
        </nav>
      )}
    </header>
  );
}

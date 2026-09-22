import { useRef, useState } from 'react';
import { browser } from 'wxt/browser';
import { fillTab } from '@/services/fill-tab';
import { DEFAULT_SETTINGS, settingsItem } from '@/storage/settings';
import {
  activeTemplateIdItem,
  createTemplate,
  deleteTemplate,
  templatesItem,
  updateTemplate,
  type Template,
} from '@/storage/templates';
import { FillPanel, type FillState } from './components/FillPanel';
import { Header, type View } from './components/Header';
import { HelpView } from './components/HelpView';
import { SettingsView } from './components/SettingsView';
import { TemplateEditor } from './components/TemplateEditor';
import { TemplatePicker } from './components/TemplatePicker';
import { useStorageItem } from './hooks/useStorageItem';

export function App() {
  const [view, setView] = useState<View>('main');
  const [templates] = useStorageItem(templatesItem);
  const [activeId, setActiveId] = useStorageItem(activeTemplateIdItem);
  const [settings, setSettings] = useStorageItem(settingsItem);

  const active = templates?.find((t) => t.id === activeId) ?? templates?.[0];

  return (
    <div className="app">
      <Header view={view} onNavigate={setView} />
      <main className="app__content">
        {view === 'help' && <HelpView />}
        {view === 'settings' && (
          <SettingsView settings={{ ...DEFAULT_SETTINGS, ...settings }} onChange={setSettings} />
        )}
        {view === 'main' && templates && active && (
          <MainView templates={templates} active={active} onSelect={setActiveId} />
        )}
      </main>
    </div>
  );
}

interface MainViewProps {
  templates: Template[];
  active: Template;
  onSelect: (id: string) => void;
}

function MainView({ templates, active, onSelect }: MainViewProps) {
  const [fillState, setFillState] = useState<FillState>({ status: 'idle' });
  // Черновик живёт локально, чтобы ввод не зависел от асинхронного хранилища.
  const [draft, setDraft] = useState({ id: active.id, content: active.content });
  const pendingSave = useRef<Promise<void>>(Promise.resolve());

  const content = draft.id === active.id ? draft.content : active.content;

  const changeContent = (next: string) => {
    setDraft({ id: active.id, content: next });
    pendingSave.current = updateTemplate(active.id, { content: next });
  };

  const fill = async () => {
    setFillState({ status: 'filling' });
    try {
      await pendingSave.current; // заполняем ровно тем, что сейчас в редакторе
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.id === undefined) throw new Error('Не удалось найти активную вкладку');
      setFillState({ status: 'done', result: await fillTab(tab.id, active.id) });
    } catch (error) {
      setFillState({ status: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <div className="view">
      <TemplatePicker
        templates={templates}
        active={active}
        onSelect={(id) => {
          onSelect(id);
          setFillState({ status: 'idle' });
        }}
        onCreate={() => void createTemplate(nextName(templates, 'Новый шаблон'))}
        onDuplicate={() => void createTemplate(nextName(templates, `${active.name} (копия)`), content)}
        onRename={(name) => void updateTemplate(active.id, { name })}
        onDelete={() => void deleteTemplate(active.id)}
      />
      <TemplateEditor value={content} onChange={changeContent} onSubmit={() => void fill()} />
      <FillPanel state={fillState} onFill={() => void fill()} />
    </div>
  );
}

/** «Новый шаблон», «Новый шаблон 2», «Новый шаблон 3»… */
function nextName(templates: Template[], base: string): string {
  const names = new Set(templates.map((t) => t.name));
  if (!names.has(base)) return base;
  let n = 2;
  while (names.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}

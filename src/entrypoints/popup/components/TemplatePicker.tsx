import { useEffect, useState } from 'react';
import type { Template } from '@/storage/templates';
import { CheckIcon, CopyIcon, PencilIcon, PlusIcon, TrashIcon } from './Icons';

interface TemplatePickerProps {
  templates: Template[];
  active: Template;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDuplicate: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

const DELETE_CONFIRM_TIMEOUT = 3000;

export function TemplatePicker({
  templates,
  active,
  onSelect,
  onCreate,
  onDuplicate,
  onRename,
  onDelete,
}: TemplatePickerProps) {
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Удаление в два клика: первый клик «взводит» кнопку, через 3 секунды она сбрасывается.
  useEffect(() => {
    if (!confirmDelete) return;
    const timer = setTimeout(() => setConfirmDelete(false), DELETE_CONFIRM_TIMEOUT);
    return () => clearTimeout(timer);
  }, [confirmDelete]);

  if (renaming) {
    return (
      <RenameForm
        initial={active.name}
        onSubmit={(name) => {
          if (name) onRename(name);
          setRenaming(false);
        }}
      />
    );
  }

  return (
    <div className="picker">
      <select
        className="picker__select"
        value={active.id}
        onChange={(event) => onSelect(event.target.value)}
        aria-label="Шаблон"
      >
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
      <div className="picker__actions">
        <button className="icon-button" onClick={onCreate} title="Новый шаблон">
          <PlusIcon />
        </button>
        <button className="icon-button" onClick={onDuplicate} title="Дублировать">
          <CopyIcon />
        </button>
        <button className="icon-button" onClick={() => setRenaming(true)} title="Переименовать">
          <PencilIcon />
        </button>
        {confirmDelete ? (
          <button className="icon-button icon-button--danger-solid" onClick={onDelete} title="Точно удалить?">
            <CheckIcon />
          </button>
        ) : (
          <button
            className="icon-button icon-button--danger"
            onClick={() => setConfirmDelete(true)}
            disabled={templates.length <= 1}
            title={templates.length <= 1 ? 'Последний шаблон удалить нельзя' : 'Удалить'}
          >
            <TrashIcon />
          </button>
        )}
      </div>
    </div>
  );
}

function RenameForm({ initial, onSubmit }: { initial: string; onSubmit: (name: string) => void }) {
  const [name, setName] = useState(initial);

  return (
    <form
      className="picker"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(name.trim());
      }}
    >
      <input
        className="picker__select"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => event.key === 'Escape' && (event.preventDefault(), onSubmit(''))}
        onBlur={() => onSubmit(name.trim())}
        maxLength={40}
        autoFocus
        aria-label="Название шаблона"
      />
      <div className="picker__actions">
        <button className="icon-button icon-button--accent" type="submit" title="Сохранить">
          <CheckIcon />
        </button>
      </div>
    </form>
  );
}

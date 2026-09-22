import { useMemo, useRef } from 'react';
import { parseTemplate } from '@/core/template/parse';
import { expandVariables } from '@/core/template/variables';
import type { TemplateEntry } from '@/core/types';
import { TEMPLATE_MAX_LENGTH } from '@/storage/templates';
import { describeEntry } from '../kinds';

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/**
 * Редактор шаблона. Слева от каждой строки — бейдж с тем,
 * как расширение её поняло: так сразу видно, куда попадёт значение.
 */
export function TemplateEditor({ value, onChange, onSubmit }: TemplateEditorProps) {
  const gutterRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => {
    const byLine = new Map<number, TemplateEntry>();
    for (const entry of parseTemplate(expandVariables(value))) byLine.set(entry.line, entry);
    return value.split('\n').map((_, line) => byLine.get(line));
  }, [value]);

  const recognized = lines.filter(Boolean).length;

  return (
    <div className="editor">
      <div className="editor__body">
        <div className="editor__gutter" ref={gutterRef} aria-hidden="true">
          {lines.map((entry, line) => {
            if (!entry) return <div key={line} className="editor__gutter-line" />;
            const meta = describeEntry(entry);
            return (
              <div key={line} className="editor__gutter-line">
                <span className={`badge badge--${meta.tone}`} title={meta.title}>
                  {meta.badge}
                </span>
              </div>
            );
          })}
        </div>
        <textarea
          className="editor__textarea"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onScroll={(event) => {
            if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              onSubmit();
            }
          }}
          maxLength={TEMPLATE_MAX_LENGTH}
          wrap="off"
          spellCheck={false}
          placeholder={'Иванов Иван Иванович\n01.08.1990\ntest@example.com\nТелефон: +7 999 123-45-67'}
          aria-label="Значения шаблона, по одному на строку"
        />
      </div>
      <div className="editor__footer">
        <span>
          {recognized === 0 ? 'Одно значение на строку' : `Значений: ${recognized}`}
        </span>
        <span>
          {value.length.toLocaleString('ru')} / {TEMPLATE_MAX_LENGTH.toLocaleString('ru')}
        </span>
      </div>
    </div>
  );
}

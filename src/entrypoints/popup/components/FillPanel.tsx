import { useState } from 'react';
import type { MatchReason } from '@/core/types';
import type { FillResult } from '@/services/fill-tab';
import { KIND_META } from '../kinds';
import { AlertIcon, BoltIcon, CheckIcon, ChevronIcon } from './Icons';

export type FillState =
  | { status: 'idle' }
  | { status: 'filling' }
  | { status: 'done'; result: FillResult }
  | { status: 'error'; message: string };

const REASON_TITLES: Record<MatchReason, string> = {
  selector: 'по CSS-селектору',
  label: 'по метке из шаблона',
  kind: 'по типу поля',
  fallback: 'по порядку',
  repeat: 'повтором: значений этого типа в шаблоне меньше, чем полей',
};

interface FillPanelProps {
  state: FillState;
  onFill: () => void;
}

export function FillPanel({ state, onFill }: FillPanelProps) {
  return (
    <section className="fill">
      <button className="fill__button" onClick={onFill} disabled={state.status === 'filling'}>
        {state.status === 'filling' ? <span className="spinner" /> : <BoltIcon />}
        Заполнить форму
        <kbd className="fill__kbd">Ctrl+Enter</kbd>
      </button>
      {state.status === 'done' && <FillSummary result={state.result} />}
      {state.status === 'error' && (
        <p className="status status--error" role="alert">
          <AlertIcon /> {state.message}
        </p>
      )}
    </section>
  );
}

function FillSummary({ result }: { result: FillResult }) {
  const [expanded, setExpanded] = useState(false);
  const { filled, total } = result;

  if (total === 0) {
    return (
      <p className="status status--warning" role="status">
        <AlertIcon /> На странице не найдено полей для заполнения
      </p>
    );
  }
  if (filled.length === 0) {
    return (
      <p className="status status--warning" role="status">
        <AlertIcon /> Найдено полей: {total}, но ни одно значение не подошло
      </p>
    );
  }

  return (
    <div className="summary">
      <button
        className="status status--success summary__toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <CheckIcon />
        <span>
          Заполнено <b>{filled.length}</b> из {total} {plural(total, 'поля', 'полей', 'полей')}
        </span>
        <ChevronIcon className={`summary__chevron ${expanded ? 'is-open' : ''}`} />
      </button>
      {expanded && (
        <ul className="summary__list">
          {filled.map((item, i) => (
            <li key={i} className="summary__item" title={`Сопоставлено ${REASON_TITLES[item.reason]}`}>
              <span className="summary__field">{item.field}</span>
              <span className={`badge badge--${KIND_META[item.kind].tone}`}>
                {KIND_META[item.kind].badge}
              </span>
              <span className="summary__value">{item.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** «из 1 поля», «из 5 полей» — после «из» нужен родительный падеж. */
function plural(n: number, one: string, few: string, many: string): string {
  const rule = new Intl.PluralRules('ru').select(n);
  return rule === 'one' ? one : rule === 'few' ? few : many;
}

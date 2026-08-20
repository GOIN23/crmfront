'use client';

import { observer } from 'mobx-react-lite';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useStores } from '@/store/RootStoreProvider';
import type { Refusal } from '@/store/refusalsStore';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  File,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Settings2,
  X,
} from 'lucide-react';

type ColumnKey =
  | 'regNumber'
  | 'fullName'
  | 'inn'
  | 'contacts'
  | 'region'
  | 'dataParsing'
  | 'attachments'
  | 'status'
  | 'comments';

const COLUMN_DEFS: Array<{ key: ColumnKey; label: string; width: number }> = [
  { key: 'regNumber', label: 'Реестр', width: 190 },
  { key: 'fullName', label: 'Компания / ФИО', width: 270 },
  { key: 'inn', label: 'ИНН', width: 135 },
  { key: 'contacts', label: 'Контакты', width: 230 },
  { key: 'region', label: 'Регион', width: 190 },
  { key: 'dataParsing', label: 'Парсинг', width: 165 },
  { key: 'attachments', label: 'Документы', width: 430 },
  { key: 'status', label: 'Статус', width: 150 },
  { key: 'comments', label: 'Комм.', width: 80 },
];

const DEFAULT_VISIBLE_COLUMNS: Record<ColumnKey, boolean> = {
  regNumber: true,
  fullName: true,
  inn: true,
  contacts: true,
  region: true,
  dataParsing: true,
  attachments: true,
  status: true,
  comments: true,
};

const STATUS_OPTIONS = ['Новый', 'Недозвон', 'Переговоры', 'Отказ'] as const;

const STATUS_COLORS: Record<string, string> = {
  Новый: 'border-blue-200 bg-blue-50 text-blue-700',
  Недозвон: 'border-amber-200 bg-amber-50 text-amber-700',
  Переговоры: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Отказ: 'border-red-200 bg-red-50 text-red-700',
};

const INTERVAL_OPTIONS = [
  { value: 30000, label: '30 сек' },
  { value: 60000, label: '1 мин' },
  { value: 300000, label: '5 мин' },
  { value: 600000, label: '10 мин' },
];

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return format(new Date(value), 'dd.MM.yyyy HH:mm', { locale: ru });
}

function getStatusColor(status: string | null) {
  return STATUS_COLORS[status || 'Новый'] || 'border-slate-200 bg-slate-50 text-slate-700';
}

export default observer(function RefusalsPage() {
  const { refusalsStore: store } = useStores();
  const [newCommentTexts, setNewCommentTexts] = useState<Record<string, string>>({});
  const [openStatusFor, setOpenStatusFor] = useState<string | null>(null);
  const [activeCommentRegNumber, setActiveCommentRegNumber] = useState<string | null>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] =
    useState<Record<ColumnKey, boolean>>(DEFAULT_VISIBLE_COLUMNS);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshIntervalMs, setRefreshIntervalMs] = useState(60000);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const visibleColumnDefs = useMemo(
    () => COLUMN_DEFS.filter((column) => visibleColumns[column.key]),
    [visibleColumns]
  );

  const tableMinWidth = useMemo(
    () => visibleColumnDefs.reduce((sum, column) => sum + column.width, 0),
    [visibleColumnDefs]
  );

  const selectedCommentItem = activeCommentRegNumber
    ? store.data.find((item) => item.regNumber === activeCommentRegNumber)
    : null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      setOpenStatusFor(null);
      setColumnsOpen(false);
      setActiveCommentRegNumber(null);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    store.fetch();

    if (!autoRefresh) {
      setSecondsLeft(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    setSecondsLeft(Math.floor(refreshIntervalMs / 1000));

    intervalRef.current = setInterval(() => {
      store.fetch();
    }, refreshIntervalMs);

    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) =>
        prev && prev > 1 ? prev - 1 : Math.floor(refreshIntervalMs / 1000)
      );
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [
    store.page,
    store.dateFrom,
    store.dateTo,
    store.search,
    autoRefresh,
    refreshIntervalMs,
  ]);

  const handleCommentChange = (regNumber: string, text: string) => {
    setNewCommentTexts((prev) => ({
      ...prev,
      [regNumber]: text,
    }));
  };

  const handleAddComment = async (regNumber: string) => {
    const text = newCommentTexts[regNumber]?.trim();
    if (!text) return;

    await store.addComment(regNumber, text);

    setNewCommentTexts((prev) => ({
      ...prev,
      [regNumber]: '',
    }));
  };

  const handleStatusChange = async (regNumber: string, status: string) => {
    setOpenStatusFor(null);
    await store.changeStatus(regNumber, status);
  };

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      const visibleCount = Object.values(prev).filter(Boolean).length;
      if (prev[key] && visibleCount === 1) return prev;

      return {
        ...prev,
        [key]: !prev[key],
      };
    });
  };

  const formatTimer = (sec: number | null) => {
    if (sec === null) return '';
    if (sec < 60) return `${sec}с`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderCell = (item: Refusal, key: ColumnKey) => {
    switch (key) {
      case 'regNumber':
        return (
          <a
            href={`https://zakupki.gov.ru/epz/contract/contractCard/common-info.html?reestrNumber=${item.regNumber}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-blue-600 hover:text-blue-700"
          >
            {item.regNumber}
            <ExternalLink size={14} />
          </a>
        );

      case 'fullName':
        return <span className="break-words leading-relaxed">{item.fullName || '—'}</span>;

      case 'inn':
        return <span className="whitespace-nowrap">{item.inn || '—'}</span>;

      case 'contacts':
        if (!item.supplierPhone && !item.supplierEmail) {
          return <span className="text-slate-400">—</span>;
        }

        return (
          <div className="grid gap-1.5 text-sm">
            {item.supplierPhone ? (
              <a
                href={`tel:${item.supplierPhone.replace(/[^\d+]/g, '')}`}
                className="flex items-start gap-1.5 break-all text-slate-900 hover:text-blue-700"
              >
                <Phone size={14} className="mt-0.5 shrink-0 text-slate-400" />
                <span>{item.supplierPhone}</span>
              </a>
            ) : null}

            {item.supplierEmail ? (
              <a
                href={`mailto:${item.supplierEmail}`}
                className="flex items-start gap-1.5 break-all text-blue-600 hover:text-blue-700"
              >
                <Mail size={14} className="mt-0.5 shrink-0 text-slate-400" />
                <span>{item.supplierEmail}</span>
              </a>
            ) : null}
          </div>
        );

      case 'region':
        return <span className="break-words leading-relaxed">{item.region || '—'}</span>;

      case 'dataParsing':
        return <span className="whitespace-nowrap">{formatDateTime(item.dataParsing)}</span>;

      case 'attachments':
        if (!item.attachments?.length) return <span className="text-slate-400">—</span>;

        return (
          <div className="grid gap-1.5">
            {item.attachments.map((att, index) => (
              <a
                key={`${item.regNumber}-${index}`}
                href={att.url || '#'}
                target="_blank"
                rel="noreferrer"
                className="flex max-w-full min-w-0 items-start gap-1.5 text-sm leading-snug text-blue-600 hover:text-blue-700"
              >
                <File size={14} className="mt-0.5 shrink-0" />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                  {att.fileName || `Док ${index + 1}`}
                </span>
              </a>
            ))}
          </div>
        );

      case 'status':
        return (
          <div className="relative w-[118px]" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              aria-expanded={openStatusFor === item.regNumber}
              aria-haspopup="menu"
              onClick={() =>
                setOpenStatusFor((current) =>
                  current === item.regNumber ? null : item.regNumber
                )
              }
              className={`inline-flex h-8 w-full items-center justify-between gap-1 rounded-full border px-3 text-xs font-bold ${getStatusColor(
                item.status
              )}`}
            >
              <span className="min-w-0 truncate">{item.status || 'Новый'}</span>
              <ChevronDown size={14} className="shrink-0" />
            </button>

            {openStatusFor === item.regNumber ? (
              <div className="mt-2 grid gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(item.regNumber, status)}
                    className={`flex h-8 items-center justify-between rounded-md px-2.5 text-left text-sm ${
                      (item.status || 'Новый') === status
                        ? 'bg-slate-900 font-semibold text-white'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {status}
                    {(item.status || 'Новый') === status ? <Check size={14} /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        );

      case 'comments':
        return (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setActiveCommentRegNumber(item.regNumber)}
              className="relative inline-grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              title="Комментарии"
            >
              <MessageSquare size={17} />
              {item.comments?.length ? (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-orange-500 px-1 text-[10px] font-bold leading-4 text-white">
                  {item.comments.length}
                </span>
              ) : null}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="min-w-0 max-w-full space-y-5"
      onClick={() => {
        setOpenStatusFor(null);
        setColumnsOpen(false);
      }}
    >
      <section className="rounded-lg bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">Дата от</span>
            <input
              type="date"
              value={store.dateFrom}
              onChange={(event) => store.setDateFrom(event.target.value)}
              className="h-10 w-[180px] rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">Дата до</span>
            <input
              type="date"
              value={store.dateTo}
              onChange={(event) => store.setDateTo(event.target.value)}
              className="h-10 w-[180px] rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="grid min-w-[260px] flex-1 gap-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">Поиск</span>
            <input
              type="text"
              placeholder="Реестровый номер / ИНН / ФИО / контакт"
              value={store.search}
              onChange={(event) => store.setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  store.fetch();
                }
              }}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <div className="flex w-full flex-wrap gap-2 xl:ml-auto xl:w-auto">
            <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.target.checked)}
                className="h-4 w-4 accent-orange-500"
              />
              <span>Авто</span>
              {autoRefresh && secondsLeft !== null ? (
                <span className="inline-flex items-center gap-1 font-mono text-orange-600">
                  <Clock size={14} />
                  {formatTimer(secondsLeft)}
                </span>
              ) : (
                <select
                  value={refreshIntervalMs}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setRefreshIntervalMs(value);
                    if (autoRefresh) setSecondsLeft(Math.floor(value / 1000));
                  }}
                  className="h-8 border-0 bg-transparent px-0 text-sm font-semibold outline-none"
                >
                  {INTERVAL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="button"
              onClick={() => store.fetch()}
              disabled={autoRefresh}
              className={`inline-flex h-10 min-w-[126px] items-center justify-center gap-2 rounded-md px-4 text-sm font-bold text-white ${
                autoRefresh
                  ? 'cursor-not-allowed bg-slate-300'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              <RefreshCw size={16} className={store.loading ? 'animate-spin' : ''} />
              Обновить
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
        <div className="flex min-h-[54px] items-center justify-between gap-3 border-b border-slate-100 px-4 md:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-base font-bold text-slate-950">Найденные записи</h2>
            <span className="shrink-0 text-sm text-slate-500">
              {store.meta?.total ?? store.data.length} записей
            </span>
          </div>

          <div className="relative" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setColumnsOpen((current) => !current)}
              className="inline-grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              title="Колонки"
            >
              <Settings2 size={18} />
            </button>

            {columnsOpen ? (
              <div className="absolute right-0 top-11 z-30 w-[230px] rounded-lg border border-slate-200 bg-white p-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
                <div className="px-2 pb-2 pt-1 text-xs font-bold uppercase text-slate-500">
                  Колонки
                </div>
                <div className="grid gap-1">
                  {COLUMN_DEFS.map((column) => {
                    const visibleCount = Object.values(visibleColumns).filter(Boolean).length;
                    const disabled = visibleColumns[column.key] && visibleCount === 1;

                    return (
                      <label
                        key={column.key}
                        className={`flex min-h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-slate-700 hover:bg-slate-50 ${
                          disabled ? 'opacity-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[column.key]}
                          disabled={disabled}
                          onChange={() => toggleColumn(column.key)}
                          className="h-4 w-4 accent-orange-500"
                        />
                        {column.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {store.loading ? (
          <div className="p-12 text-center text-slate-500">Загрузка...</div>
        ) : store.data.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Нет записей</div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table
              className="w-full table-fixed border-separate border-spacing-0"
              style={{ minWidth: `${Math.max(tableMinWidth, 520)}px` }}
            >
              <thead>
                <tr>
                  {visibleColumnDefs.map((column) => (
                    <th
                      key={column.key}
                      className={`h-[42px] border-b border-slate-200 bg-slate-50 px-3 text-left text-xs font-bold uppercase text-slate-500 ${
                        column.key === 'comments' ? 'text-center' : ''
                      }`}
                      style={{ width: `${column.width}px` }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm text-slate-950">
                {store.data.map((item) => (
                  <Fragment key={item.regNumber}>
                    <tr className="group">
                      {visibleColumnDefs.map((column) => (
                        <td
                          key={column.key}
                          className="border-b border-slate-100 px-3 py-4 align-top leading-normal group-hover:bg-slate-50"
                        >
                          {renderCell(item, column.key)}
                        </td>
                      ))}
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {store.meta ? (
          <div className="flex min-h-[54px] flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between md:px-5">
            <span>
              {store.meta.total > 0
                ? `${(store.page - 1) * 30 + 1}-${Math.min(
                    store.page * 30,
                    store.meta.total
                  )} из ${store.meta.total}`
                : 'Нет записей'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={store.page === 1}
                onClick={() => store.setPage(store.page - 1)}
                className="h-9 rounded-md border border-slate-200 bg-white px-4 font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Назад
              </button>
              <button
                type="button"
                disabled={store.page >= store.meta.totalPages}
                onClick={() => store.setPage(store.page + 1)}
                className="h-9 rounded-md border border-slate-200 bg-white px-4 font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Вперёд
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {selectedCommentItem ? (
        <CommentDrawer
          item={selectedCommentItem}
          text={newCommentTexts[selectedCommentItem.regNumber] || ''}
          onTextChange={(text) => handleCommentChange(selectedCommentItem.regNumber, text)}
          onClose={() => setActiveCommentRegNumber(null)}
          onAdd={() => handleAddComment(selectedCommentItem.regNumber)}
        />
      ) : null}
    </div>
  );
});

function CommentDrawer({
  item,
  text,
  onTextChange,
  onClose,
  onAdd,
}: {
  item: Refusal;
  text: string;
  onTextChange: (text: string) => void;
  onClose: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-950">Комментарии</div>
            <div className="mt-1 truncate text-xs text-slate-500">{item.regNumber}</div>
            <div className="mt-2 text-sm leading-snug text-slate-700">{item.fullName || '—'}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            title="Закрыть"
          >
            <X size={17} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {item.comments?.length ? (
            <div className="grid gap-3">
              {item.comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-1 text-xs text-slate-500">
                    {formatDateTime(comment.createdAt)}
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-900">
                    {comment.text}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Пока нет комментариев
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-5">
          <textarea
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            placeholder="Введите комментарий..."
            rows={4}
            className="w-full resize-none rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={onAdd}
            disabled={!text.trim()}
            className="mt-3 h-10 w-full rounded-md bg-orange-500 px-4 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Добавить
          </button>
        </div>
      </aside>
    </div>
  );
}

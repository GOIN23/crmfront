'use client';

import { observer } from 'mobx-react-lite';
import { useEffect, useState, useRef } from 'react';
import { useStores } from '@/store/RootStoreProvider';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  RefreshCw,
  ExternalLink,
  File,
  MessageSquare,
  Clock,
  ChevronDown,
  Phone,
  Mail,
} from 'lucide-react';

const STATUS_OPTIONS = ['Новый', 'Недозвон', 'Переговоры', 'Отказ'] as const;

const STATUS_COLORS: Record<string, string> = {
  Новый: 'bg-blue-50 text-blue-700 border-blue-200',
  Недозвон: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  Переговоры: 'bg-purple-50 text-purple-700 border-purple-200',
  Отказ: 'bg-red-50 text-red-700 border-red-200',
};

const INTERVAL_OPTIONS = [
  { value: 30000, label: '30 сек' },
  { value: 60000, label: '1 мин' },
  { value: 300000, label: '5 мин' },
  { value: 600000, label: '10 мин' },
];

export default observer(function RefusalsPage() {
  const { refusalsStore: store } = useStores();

  // Комментарии
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [newCommentTexts, setNewCommentTexts] = useState<Record<string, string>>({});
  const [openStatusFor, setOpenStatusFor] = useState<string | null>(null);

  // Автообновление
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshIntervalMs, setRefreshIntervalMs] = useState(60000);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenStatusFor(null);
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

  const toggleComments = (regNumber: string) => {
    setOpenComments((prev) => ({
      ...prev,
      [regNumber]: !prev[regNumber],
    }));
  };

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

  const formatTimer = (sec: number | null) => {
    if (sec === null) return '';
    if (sec < 60) return `${sec}с`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Фильтры — полностью как на скриншоте */}
      <div className="bg-white border rounded-lg shadow">
        {/* Верхняя строка с датами и кнопками */}
        <div className="p-4 border-b">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Дата от:</label>
              <input
                type="date"
                value={store.dateFrom}
                onChange={(e) => store.setDateFrom(e.target.value)}
                className="border rounded px-3 py-1.5 w-36"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Дата до:</label>
              <input
                type="date"
                value={store.dateTo}
                onChange={(e) => store.setDateTo(e.target.value)}
                className="border rounded px-3 py-1.5 w-36"
              />
            </div>

            <div className="ml-auto flex items-center gap-4">
              <button
                onClick={() => store.fetch()}
                disabled={autoRefresh}
                className={`px-6 py-2 rounded font-medium text-sm flex items-center gap-2 min-w-[110px] justify-center ${
                  autoRefresh
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                <RefreshCw size={16} className={store.loading ? 'animate-spin' : ''} />
                Обновить
              </button>

              <button
                onClick={() => setAutoRefresh((p) => !p)}
                className={`px-4 py-2 rounded font-medium text-sm flex items-center justify-between gap-3 min-w-[170px] border-2 transition-all ${
                  autoRefresh
                    ? 'bg-orange-50 border-orange-500 text-orange-800'
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    readOnly
                    className="h-4 w-4 pointer-events-none accent-orange-600"
                  />
                  <span>Автообновление</span>
                </div>

                {autoRefresh && secondsLeft !== null ? (
                  <span className="font-mono text-orange-700 font-semibold flex items-center gap-1.5">
                    <Clock size={14} />
                    {formatTimer(secondsLeft)}
                  </span>
                ) : (
                  <select
                    value={refreshIntervalMs}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRefreshIntervalMs(val);
                      if (autoRefresh) setSecondsLeft(Math.floor(val / 1000));
                    }}
                    className="text-xs bg-transparent border-none focus:ring-0 cursor-pointer"
                  >
                    {INTERVAL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Нижняя строка — Поиск */}
        <div className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[300px]">
              <label className="block text-sm text-gray-600 mb-1">Поиск</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Реестровый номер / ИНН / ФИО..."
                  value={store.search}
                  onChange={(e) => store.setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      store.fetch();
                    }
                  }}
                  className="flex-1 border rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <button
                  onClick={() => store.fetch()}
                  className="bg-orange-600 text-white px-6 py-1.5 rounded hover:bg-orange-700 flex items-center gap-2 whitespace-nowrap"
                >
                  Поиск
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        {store.loading ? (
          <div className="p-12 text-center text-gray-500">Загрузка...</div>
        ) : store.data.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Нет записей</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1750px] w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="w-[190px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Реестр.№
                  </th>
                  <th className="w-[250px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Компания / ФИО
                  </th>
                  <th className="w-[140px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ИНН
                  </th>
                  <th className="w-[220px] px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Контакты
                  </th>
                  <th className="w-[170px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Регион
                  </th>
                  <th className="w-[170px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Парсинг
                  </th>
                  <th className="w-[390px] px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Документы
                  </th>
                  <th className="w-[150px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Статус
                  </th>
                  <th className="w-[70px] px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Комм.
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {store.data.map((item) => (
                  <>
                    <tr key={item.regNumber} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={`https://zakupki.gov.ru/epz/contract/contractCard/common-info.html?reestrNumber=${item.regNumber}`}
                          target="_blank"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {item.regNumber} <ExternalLink size={14} />
                        </a>
                      </td>
                      <td className="px-6 py-4 break-words">{item.fullName || '—'}</td>
                      <td className="px-6 py-4">{item.inn || '—'}</td>
                      <td className="px-5 py-4 align-top">
                        {item.supplierPhone || item.supplierEmail ? (
                          <div className="space-y-1 text-sm">
                            {item.supplierPhone ? (
                              <a
                                href={`tel:${item.supplierPhone.replace(/[^\d+]/g, '')}`}
                                className="flex items-start gap-1.5 break-all text-gray-900 hover:text-blue-700"
                              >
                                <Phone size={14} className="mt-0.5 shrink-0 text-gray-400" />
                                <span>{item.supplierPhone}</span>
                              </a>
                            ) : null}

                            {item.supplierEmail ? (
                              <a
                                href={`mailto:${item.supplierEmail}`}
                                className="flex items-start gap-1.5 break-all text-blue-600 hover:underline"
                              >
                                <Mail size={14} className="mt-0.5 shrink-0 text-gray-400" />
                                <span>{item.supplierEmail}</span>
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 break-words">{item.region || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.dataParsing
                          ? format(new Date(item.dataParsing), 'dd.MM.yyyy HH:mm', { locale: ru })
                          : '—'}
                      </td>
                      <td className="px-5 py-4 align-top">
                        {item.attachments?.length > 0 ? (
                          <div className="space-y-1">
                            {item.attachments.map((att, i) => (
                              <a
                                key={i}
                                href={att.url || '#'}
                                target="_blank"
                                className="block break-words text-sm text-blue-600 hover:underline"
                              >
                                <File size={14} className="inline mr-1" />
                                {att.fileName || `Док ${i + 1}`}
                              </a>
                            ))}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-4 align-top">
                        <div
                          className="space-y-2"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            aria-expanded={openStatusFor === item.regNumber}
                            aria-haspopup="menu"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setOpenStatusFor((current) =>
                                current === item.regNumber ? null : item.regNumber
                              );
                            }}
                            className={`flex h-9 w-full items-center justify-between gap-2 rounded-md border px-2.5 text-sm font-medium transition-shadow ${
                              STATUS_COLORS[item.status || 'Новый'] ||
                              'border-gray-200 bg-gray-50 text-gray-700'
                            } ${openStatusFor === item.regNumber ? 'ring-2 ring-orange-200' : ''}`}
                          >
                            <span className="min-w-0 truncate">
                              {item.status || 'Новый'}
                            </span>
                            <ChevronDown size={15} className="shrink-0" />
                          </button>

                          {openStatusFor === item.regNumber && (
                            <div className="grid gap-1 rounded-md border border-gray-200 bg-white p-1 shadow-sm">
                              {STATUS_OPTIONS.map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    handleStatusChange(item.regNumber, status);
                                  }}
                                  className={`rounded px-2.5 py-1.5 text-left text-sm transition-colors ${
                                    (item.status || 'Новый') === status
                                      ? 'bg-gray-900 font-semibold text-white'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => toggleComments(item.regNumber)}
                          className="text-gray-600 hover:text-gray-900 relative"
                          title="Комментарии"
                        >
                          <MessageSquare size={18} />
                          {item.comments?.length ? (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px]">
                              {item.comments.length}
                            </span>
                          ) : null}
                        </button>
                      </td>
                    </tr>

                    {openComments[item.regNumber] && (
                      <tr>
                        <td colSpan={9} className="p-0 bg-gray-50">
                          <div className="p-4">
                            {item.comments && item.comments.length > 0 ? (
                              <div className="space-y-3 mb-4">
                                {item.comments.map((comment) => (
                                  <div
                                    key={comment.id}
                                    className="bg-white p-3 rounded border border-gray-200 text-sm"
                                  >
                                    <div className="flex justify-between text-gray-500 text-xs mb-1">
                                      <span>
                                        {format(new Date(comment.createdAt), 'dd.MM.yyyy HH:mm', {
                                          locale: ru,
                                        })}
                                      </span>
                                    </div>
                                    <p className="whitespace-pre-wrap">{comment.text}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm mb-4">Пока нет комментариев</p>
                            )}

                            <div className="flex gap-3">
                              <textarea
                                value={newCommentTexts[item.regNumber] || ''}
                                onChange={(e) =>
                                  handleCommentChange(item.regNumber, e.target.value)
                                }
                                placeholder="Введите комментарий..."
                                rows={2}
                                className="flex-1 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-y"
                              />
                              <button
                                onClick={() => handleAddComment(item.regNumber)}
                                disabled={!newCommentTexts[item.regNumber]?.trim()}
                                className="px-5 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                              >
                                Добавить
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {store.meta && (
          <div className="px-6 py-4 flex items-center justify-between border-t">
            <div className="text-sm text-gray-700">
              {store.meta.total > 0
                ? `${(store.page - 1) * 30 + 1}–${Math.min(
                    store.page * 30,
                    store.meta.total
                  )} из ${store.meta.total}`
                : 'Нет записей'}
            </div>
            <div className="flex gap-3">
              <button
                disabled={store.page === 1}
                onClick={() => store.setPage(store.page - 1)}
                className="px-4 py-1.5 border rounded disabled:opacity-40"
              >
                Назад
              </button>
              <button
                disabled={store.page >= store.meta.totalPages}
                onClick={() => store.setPage(store.page + 1)}
                className="px-4 py-1.5 border rounded disabled:opacity-40"
              >
                Вперед
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

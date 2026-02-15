'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { RefreshCw, Search, ExternalLink, File, ArrowUpDown, Clock } from 'lucide-react';

type Attachment = {
  fileName: string | null;
  url: string | null;
};

type Refusal = {
  regNumber: string;
  region: string;
  inn: string;
  fullName: string;
  signDate: string | null;
  publishDate: string | null;
  dataParsing: string | null;
  attachments: Attachment[];
};

type Meta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

type ApiResponse = {
  data: Refusal[];
  meta: Meta;
};
interface GetRefusalsParams {
  page: number;
  perPage: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterRegNumber?: string;
  filterFullName?: string;
  filterInn?: string;
  filterRegion?: string;
  dateFrom?: string;  // Добавлено
  dateTo?: string;    // Добавлено
}

const formatParsingDate = (dateString: string | null) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return format(date, 'dd.MM.yyyy HH:mm', { locale: ru });
  } catch {
    return dateString;
  }
};

const INTERVAL_OPTIONS = [
  { value: 30000, label: '30 сек' },
  { value: 60000, label: '1 мин' },
  { value: 300000, label: '5 мин' },
  { value: 600000, label: '10 мин' },
];

export default function RefusalsPage() {
  const [data, setData] = useState<Refusal[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [columnFilters, setColumnFilters] = useState<{
    regNumber?: string;
    fullName?: string;
    inn?: string;
    region?: string;
  }>({});

  // Автообновление
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshIntervalMs, setRefreshIntervalMs] = useState(60000);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    if (dateFrom && dateTo && dateFrom > dateTo) {
      setData([]);
      setMeta(null);
      setLoading(false);
      return;
    }

    try {
      const params: GetRefusalsParams = {
        page,
        perPage: 30,
        search: search.trim() || undefined,
        sortBy,
        sortOrder,
        filterRegNumber: columnFilters.regNumber,
        filterFullName: columnFilters.fullName,
        filterInn: columnFilters.inn,
        filterRegion: columnFilters.region,
      };

      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      //TODO: сделать так, чтобы он через env подтягивался(на сервере 'http://194.5.79.68:3001/contracts/refusals)
      const res = await axios.get<ApiResponse>('http://localhost:3001/contracts/refusals', { params });

      setData(res.data.data || []);
      setMeta(res.data.meta || null);

      // Сбрасываем таймер после успешного обновления
      if (autoRefresh) {
        setSecondsLeft(Math.floor(refreshIntervalMs / 1000));
      }
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, dateFrom, dateTo, sortBy, sortOrder, columnFilters, autoRefresh, refreshIntervalMs]);

  useEffect(() => {
    fetchData(); // первый запрос при монтировании

    if (!autoRefresh) {
      setSecondsLeft(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    // Запуск автообновления
    setSecondsLeft(Math.floor(refreshIntervalMs / 1000));

    intervalRef.current = setInterval(() => {
      fetchData();
    }, refreshIntervalMs);

    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          return Math.floor(refreshIntervalMs / 1000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [fetchData, autoRefresh, refreshIntervalMs]);

  useEffect(() => {
    setPage(1);
  }, [search, dateFrom, dateTo, sortBy, sortOrder, columnFilters]);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatTimer = (sec: number | null) => {
    if (sec === null) return '';
    if (sec < 60) return `${sec}с`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Шапка */}
        <div className="bg-orange-600 text-white p-4 rounded-t-lg">
          <h1 className="text-xl font-semibold">Расторжения 44 ФЗ</h1>
        </div>

        {/* Фильтры и управление */}
        <div className="bg-white border border-t-0 p-4 shadow">
          <div className="flex flex-wrap items-end gap-4 mb-4">
            {/* Даты */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Дата от:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border rounded px-3 py-1.5 w-36"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">до:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border rounded px-3 py-1.5 w-36"
              />
            </div>

            {/* Управление обновлением */}
            <div className="ml-auto flex items-center gap-4">
              {/* Кнопка "Обновить" */}
              <button
                onClick={fetchData}
                disabled={autoRefresh || loading}
                className={`
                  px-5 py-2 rounded font-medium text-sm flex items-center gap-2 min-w-[110px] justify-center
                  ${autoRefresh
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }
                `}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Обновить
              </button>

              {/* Кнопка-тумблер автообновления с таймером */}
              <button
                type="button"
                onClick={() => setAutoRefresh((prev) => !prev)}
                className={`
                  px-4 py-2 rounded font-medium text-sm flex items-center justify-between gap-3 min-w-[170px]
                  border-2 transition-all
                  ${
                    autoRefresh
                      ? 'bg-orange-50 border-orange-500 text-orange-800'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }
                `}
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
            {meta && (
      <div className="bg-gray-50 border border-b-0 px-4 py-3 flex items-center justify-between text-sm text-gray-700 shadow-sm rounded-t-lg">
        {/* Левая часть: "Показано X из Y" или "1 - 50 из 4877" */}
        <div>
          {meta.total > 0 ? (
            <>
              <span className="font-medium">
                {page === 1 ? '1' : ((page - 1) * 30 + 1)}
                {' – '}
                {Math.min(page * 30, meta.total)}
              </span>
              {' из '}
              <span className="font-medium">{meta.total}</span>
            </>
          ) : (
            'Нет записей'
          )}
        </div>

        {/* Правая часть: кнопки */}
        <div className="flex items-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`
              px-4 py-1.5 text-sm font-medium rounded border border-gray-300
              ${page === 1 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition'
              }
            `}
          >
            Предыдущая
          </button>

          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={`
              px-4 py-1.5 text-sm font-medium rounded border border-gray-300
              ${page >= meta.totalPages 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition'
              }
            `}
          >
            Следующая
          </button>
        </div>
      </div>
    )}

        {/* Таблица */}
        <div className="bg-white border rounded-b-lg overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1 cursor-pointer group" onClick={() => toggleSort('regNumber')}>
                      Реестровый номер контракта
                      <ArrowUpDown size={14} className={`opacity-0 group-hover:opacity-70 ${sortBy === 'regNumber' ? 'opacity-100' : ''}`} />
                      {sortBy === 'regNumber' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <input
                      type="text"
                      placeholder="Фильтр..."
                      value={columnFilters.regNumber || ''}
                      onChange={(e) => setColumnFilters((prev) => ({ ...prev, regNumber: e.target.value || undefined }))}
                      className="mt-2 w-full text-xs border rounded px-2 py-1"
                    />
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1 cursor-pointer group" onClick={() => toggleSort('fullName')}>
                      Название компании / ФИО и ИНН
                      <ArrowUpDown size={14} className={`opacity-0 group-hover:opacity-70 ${sortBy === 'fullName' ? 'opacity-100' : ''}`} />
                      {sortBy === 'fullName' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <input
                      type="text"
                      placeholder="Фильтр..."
                      value={columnFilters.fullName || ''}
                      onChange={(e) => setColumnFilters((prev) => ({ ...prev, fullName: e.target.value || undefined }))}
                      className="mt-2 w-full text-xs border rounded px-2 py-1"
                    />
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1 cursor-pointer group" onClick={() => toggleSort('region')}>
                      Регион
                      <ArrowUpDown size={14} className={`opacity-0 group-hover:opacity-70 ${sortBy === 'region' ? 'opacity-100' : ''}`} />
                      {sortBy === 'region' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <input
                      type="text"
                      placeholder="Фильтр..."
                      value={columnFilters.region || ''}
                      onChange={(e) => setColumnFilters((prev) => ({ ...prev, region: e.target.value || undefined }))}
                      className="mt-2 w-full text-xs border rounded px-2 py-1"
                    />
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата парсинга
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Документы
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-gray-500">
                      Загрузка...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-gray-500">
                      Нет записей
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.regNumber} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <a
                          href={`https://zakupki.gov.ru/epz/contract/contractCard/common-info.html?reestrNumber=${item.regNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {item.regNumber}
                          <ExternalLink size={14} />
                        </a>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium">{item.fullName || '—'}</div>
                        <div className="text-xs text-gray-500">{item.inn || '—'}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">{item.region || '—'}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{formatParsingDate(item.dataParsing)}</td>
                      <td className="px-4 py-4 text-sm">
                        {item.attachments?.length ? (
                          <div className="flex flex-col gap-1">
                            {item.attachments.map((att, i) => (
                              <a
                                key={i}
                                href={att.url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                              >
                                <File size={12} />
                                {att.fileName || `файл ${i + 1}`}
                              </a>
                            ))}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          Новый
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
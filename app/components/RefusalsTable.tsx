// src/components/RefusalsTable.tsx
import Link from 'next/link';

interface Refusal {
  regNumber: string;
  region: string;
  inn: string | null;
  fullName: string | null;
  attachmentUrl: string | null;
  signDate: string | null;
  publishDate: string | null;
  createdAt: string;
}

interface GetUnilateralRefusalsDto {
  page?: number;
  perPage?: number;
  search?: string;
  region?: string;
  // можно добавить dateFrom, dateTo позже
}

async function fetchRefusals(query: Partial<GetUnilateralRefusalsDto>): Promise<{
  data: Refusal[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
}> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', query.page.toString());
  if (query.perPage) params.set('perPage', query.perPage.toString());
  if (query.search) params.set('search', query.search);
  if (query.region) params.set('region', query.region);

  const res = await fetch(`http://localhost:3000/contracts/refusals?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Ошибка загрузки: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export default async function RefusalsTable({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = Number(
    Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page || '1'
  ) || 1;

  const perPage = Number(
    Array.isArray(searchParams.perPage) ? searchParams.perPage[0] : searchParams.perPage || '30'
  ) || 30;

  const search = Array.isArray(searchParams.search)
    ? searchParams.search[0]
    : searchParams.search || '';

  const region = Array.isArray(searchParams.region)
    ? searchParams.region[0]
    : searchParams.region || '';

  const { data, meta } = await fetchRefusals({ page, perPage, search, region });

  return (
    <div>
      {/* Простая форма фильтров */}
      <form className="mb-6 flex flex-wrap gap-4">
        <input
          name="search"
          defaultValue={search}
          placeholder="Поиск по реестр. номеру или компании..."
          className="border px-3 py-2 rounded min-w-[300px]"
        />
        <input
          name="region"
          defaultValue={region}
          placeholder="Регион (77, 50...)"
          className="border px-3 py-2 rounded w-32"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Фильтровать
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-3 text-left font-medium">Реестровый номер</th>
              <th className="border p-3 text-left font-medium">Название компании</th>
              <th className="border p-3 text-left font-medium">Регион</th>
              <th className="border p-3 text-left font-medium">Приложения</th>
              <th className="border p-3 text-left font-medium">Дата парсинга</th>
              <th className="border p-3 text-left font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.regNumber} className="hover:bg-gray-50">
                <td className="border p-3">
                  <Link
                    href={`https://zakupki.gov.ru/epz/contract/contractCard/common-info.html?reestrNumber=${item.regNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {item.regNumber}
                  </Link>
                </td>
                <td className="border p-3">{item.fullName || '—'}</td>
                <td className="border p-3">{item.region}</td>
                <td className="border p-3">
                  {item.attachmentUrl ? (
                    <Link
                    href={item.attachmentUrl}
                    download={`Решение_${item.regNumber}.pdf`}   // красивое имя файла
                    target="_blank"
                    rel="noopener noreferrer"
                    >
                    Скачать PDF
                    </Link>                  ) : (
                    '—'
                  )}
                </td>
                <td className="border p-3">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString('ru-RU', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : '—'}
                </td>
                <td className="border p-3">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                    Новый
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      <div className="mt-6 flex justify-between items-center text-sm">
        <div>
          Записей: <strong>{meta.total}</strong> | Страница <strong>{meta.page}</strong> из{' '}
          <strong>{meta.totalPages}</strong>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/refusals?${(() => {
              const params = new URLSearchParams();
              Object.entries(searchParams).forEach(([key, value]) => {
                if (value !== undefined) {
                  if (Array.isArray(value)) {
                    value.forEach((v) => params.append(key, v));
                  } else {
                    params.set(key, value);
                  }
                }
              });
              params.set('page', (page - 1).toString());
              return params.toString();
            })()}`}
            className={`px-5 py-2 border rounded-md transition-colors ${
              page <= 1
                ? 'opacity-50 cursor-not-allowed bg-gray-100'
                : 'hover:bg-gray-100'
            }`}
          >
            Предыдущая
          </Link>

          <Link
            href={`/refusals?${(() => {
              const params = new URLSearchParams();
              Object.entries(searchParams).forEach(([key, value]) => {
                if (value !== undefined) {
                  if (Array.isArray(value)) {
                    value.forEach((v) => params.append(key, v));
                  } else {
                    params.set(key, value);
                  }
                }
              });
              params.set('page', (page + 1).toString());
              return params.toString();
            })()}`}
            className={`px-5 py-2 border rounded-md transition-colors ${
              page >= meta.totalPages
                ? 'opacity-50 cursor-not-allowed bg-gray-100'
                : 'hover:bg-gray-100'
            }`}
          >
            Следующая
          </Link>
        </div>
      </div>
    </div>
  );
}
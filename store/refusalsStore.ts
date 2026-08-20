import { makeAutoObservable, runInAction } from 'mobx';
import RootStore from './rootStore';
import { api } from '@/lib/api';

export interface Attachment {
  fileName: string | null;
  url: string | null;
}
export interface Comment {
  id: string | number;
  text: string;
  createdAt: string;
  author?: string; // если есть автор
}

export interface Refusal {
  regNumber: string;
  region: string;
  inn: string | null;
  fullName: string | null;
  supplierPhone: string | null;
  supplierEmail: string | null;
  signDate: string | null;
  publishDate: string | null;
  dataParsing: string | null;
  status: 'Новый' | 'Недозвон' | 'Переговоры' | 'Отказ' | null;
  attachments: Attachment[];
  comments?: Comment[];           // ← добавляем массив комментариев
}

export default class RefusalsStore {
  root: RootStore;

  data: Refusal[] = [];
  meta: { total: number; page: number; perPage: number; totalPages: number } | null = null;

  loading = false;
  error: string | null = null;

  page = 1;
  dateFrom = '';
  dateTo = '';
  search = '';

  constructor(root: RootStore) {
    this.root = root;
    makeAutoObservable(this);
  }

  async fetch() {
    debugger;
    if (!this.root.authStore.isAuthenticated) return;

    this.loading = true;
    this.error = null;

    try {
      const params: any = {
        page: this.page,
        perPage: 30,
        search: this.search.trim() || undefined,
      };
      if (this.dateFrom) params.dateFrom = this.dateFrom;
      if (this.dateTo) params.dateTo = this.dateTo;

      const res = await api.get('/contracts/refusals', { params });
      runInAction(() => {
        this.data = res.data.data.map((item: any) => ({
          ...item,
          comments: item.comment || [],   // на случай, если бэкенд не вернул поле
        }));
        this.meta = res.data.meta;
      });
    } catch (err) {
      runInAction(() => {
        this.error = 'Не удалось загрузить расторжения';
      });
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async changeStatus(regNumber: string, status: string) {
    try {
      await api.put('/contracts/status', null, { params: { RegNumber: regNumber, status } });
      runInAction(() => {
        const item = this.data.find(r => r.regNumber === regNumber);
        if (item) item.status = status as any;
      });
    } catch {
      alert('Ошибка изменения статуса');
    }
  }
  async addComment(regNumber: string, text: string) {
    if (!text.trim()) return;

    try {
      await api.post('/contracts/comment', { RegNumber: regNumber, text });

      // Обновляем локально (оптимистично)
      runInAction(() => {
        const item = this.data.find(r => r.regNumber === regNumber);
        if (item) {
          item.comments = item.comments || [];
          item.comments.unshift({
            id: Date.now(),           // временный id
            text,
            createdAt: new Date().toISOString(),
          });
        }
      });

      // Можно сделать refetch, если хочешь актуальные данные с сервера
      // await this.fetch();
    } catch (err) {
      console.error("Ошибка добавления комментария:", err);
    }
  }

  setPage(page: number) { this.page = page; }
  setDateFrom(val: string) { this.dateFrom = val; this.page = 1; }
  setDateTo(val: string) { this.dateTo = val; this.page = 1; }
  setSearch(val: string) { this.search = val; this.page = 1; }
}

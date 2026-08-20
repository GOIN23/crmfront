// src/store/authStore.ts
import { makeAutoObservable, runInAction } from 'mobx';
import RootStore from './rootStore';
import { api } from '@/lib/api';

type User = { login: string; id: number; }; // расширь при необходимости

export default class AuthStore {
  root: RootStore;
  isAuthenticated = false;
  user: User | null = null;
  loading = false;
  sessionChecked = false;
  error: string | null = null;

  constructor(root: RootStore) {
    this.root = root;
    if (typeof window === 'undefined') {
      this.sessionChecked = true;
    }
    makeAutoObservable(this);
    if (typeof window !== 'undefined') {
      void this.tryRestoreSession();
    }
  }

  async tryRestoreSession() {
    if (typeof window === 'undefined') {
      this.sessionChecked = true;
      return;
    }

    this.sessionChecked = false;
    const savedToken = localStorage.getItem('access_token');
    if (!savedToken) {
      runInAction(() => {
        this.isAuthenticated = false;
        this.user = null;
        this.sessionChecked = true;
      });
      return;
    }
    try {
      const res = await api.get('/auth/me');
      runInAction(() => {
        this.user = res.data;
        this.isAuthenticated = true;
      });
    } catch {
      runInAction(() => {
        this.isAuthenticated = false;
        this.user = null;
        localStorage.removeItem('access_token');
      });
    } finally {
      runInAction(() => {
        this.sessionChecked = true;
      });
    }
  }

  async login(login: string, password: string) {
    this.loading = true;
    this.error = null;
    try {
      const res = await api.post('/auth/login', { loginOrEmail: login, password });
      const { accessToken } = res.data;
      localStorage.setItem('access_token', accessToken);
      await this.tryRestoreSession();
      return true;
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || 'Ошибка входа';
      });
      return false;
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async logout() {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('access_token');
    } catch { }
    runInAction(() => {
      this.isAuthenticated = false;
      this.user = null;
      this.sessionChecked = true;
    });
  }
}

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
  error: string | null = null;

  constructor(root: RootStore) {
    this.root = root;
    makeAutoObservable(this);
    this.tryRestoreSession();
  }

  async tryRestoreSession() {
    debugger;
    const savedToken = localStorage.getItem('access_token');
    if (!savedToken) {
      this.isAuthenticated = false;
      this.user = null;
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
    }
  }

  async login(login: string, password: string) {
    console.log('🔐 Попытка входа:', login);
    this.loading = true;
    this.error = null;
    try {
      debugger;
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
    });
  }
}
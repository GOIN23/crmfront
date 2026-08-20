'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { observer } from 'mobx-react-lite';
import { useStores } from '@/store/RootStoreProvider';

export default observer(function LoginPage() {
  const { authStore } = useStores();
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (authStore.sessionChecked && authStore.isAuthenticated) {
      router.replace('/protected');
    }
  }, [authStore.isAuthenticated, authStore.sessionChecked, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await authStore.login(login.trim(), password);
    if (success) {
      router.replace('/protected');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-4 text-center">Вход в CRM</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">Используй свои учетные данные.</p>
        {authStore.error && (
          <div className="mb-3 text-sm text-red-700 bg-red-100 p-2 rounded">{authStore.error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login" className="block text-sm font-medium text-gray-700">
              Логин
            </label>
            <input
              id="login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="admin"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={authStore.loading}
            className="w-full bg-blue-600 text-white rounded px-3 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-70"
          >
            {authStore.loading ? 'Входим...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
});

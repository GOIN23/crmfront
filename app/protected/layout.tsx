'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { observer } from 'mobx-react-lite';
import { rootStore } from '@/store/rootStore';
import Sidebar from '@/components/layout/Sidebar';
import { useStores } from '@/store/RootStoreProvider';

export default observer(function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  debugger;
  const { authStore } = useStores(); // ← получаем store через хук
  const router = useRouter();

  useEffect(() => {
    console.log('🔍 Проверка авторизации:', authStore.isAuthenticated);
    if (!authStore.isAuthenticated) {
      console.log('➡️ Редирект на /login');
      router.replace('/login');
    }
  }, [authStore.isAuthenticated, router]); // ← правильные зависимости

  // Пока проверяем авторизацию - ничего не показываем
  if (!authStore.isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 flex min-w-0 flex-col">
        <header className="bg-white border-b px-6 py-3 flex shrink-0 justify-between items-center">
          <h1 className="text-xl font-semibold"></h1>
          <button
            onClick={() => rootStore.authStore.logout()}
            className="text-red-600 hover:underline"
          >
            Выйти
          </button>
        </header>
        <main className="flex-1 min-w-0 overflow-x-hidden p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
});

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { observer } from 'mobx-react-lite';
import Sidebar from '@/components/layout/Sidebar';
import { useStores } from '@/store/RootStoreProvider';

export default observer(function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authStore } = useStores();
  const router = useRouter();
  const pathname = usePathname();
  const title = pathname === '/protected/refusals' ? 'ЕИС реестр 44-ФЗ' : 'Главное';

  useEffect(() => {
    if (authStore.sessionChecked && !authStore.isAuthenticated) {
      router.replace('/login');
    }
  }, [authStore.isAuthenticated, authStore.sessionChecked, router]);

  if (!authStore.sessionChecked) {
    return <AuthLoadingScreen />;
  }

  if (!authStore.isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-100 text-slate-950">
      <Sidebar />
      <div className="flex-1 flex min-w-0 flex-col">
        <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 md:px-7">
          <h1 className="text-lg font-semibold tracking-normal text-slate-950">{title}</h1>
          <button
            onClick={() => authStore.logout()}
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            Выйти
          </button>
        </header>
        <main className="flex-1 min-w-0 overflow-x-hidden bg-slate-100 p-4 md:p-7">
          {children}
        </main>
      </div>
    </div>
  );
});

function AuthLoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 text-sm font-medium text-slate-500">
      Загрузка...
    </div>
  );
}

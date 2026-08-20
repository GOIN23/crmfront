'use client';

import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useStores } from '@/store/RootStoreProvider';

export default observer(function AuthLayout({ children }: { children: React.ReactNode }) {
  const { authStore } = useStores();
  const router = useRouter();

  useEffect(() => {
    if (authStore.sessionChecked && authStore.isAuthenticated) {
      router.replace('/protected');
    }
  }, [authStore.isAuthenticated, authStore.sessionChecked, router]);

  if (!authStore.sessionChecked || authStore.isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 text-sm font-medium text-slate-500">
        Загрузка...
      </div>
    );
  }

  return <>{children}</>;
});

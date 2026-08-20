'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStores } from '@/store/RootStoreProvider';

export default function Home() {
  const router = useRouter();
  const store = useStores()
  useEffect(() => {
    if (!store.authStore.sessionChecked) return;

    router.replace(store.authStore.isAuthenticated ? '/protected' : '/login');
  }, [router, store.authStore.isAuthenticated, store.authStore.sessionChecked]);

  return <div className="min-h-screen flex items-center justify-center">Перенаправление...</div>;
}

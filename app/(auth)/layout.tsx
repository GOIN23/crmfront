'use client';

import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useStores } from '@/store/RootStoreProvider';

export default observer(function AuthLayout({ children }: { children: React.ReactNode }) {
  debugger;
  const { authStore } = useStores();
  const router = useRouter();

  useEffect(() => {
    console.log('🔄 AuthLayout useEffect, isAuthenticated:', authStore.isAuthenticated);
    if (authStore.isAuthenticated) {
      console.log('➡️ Редирект на /protected');
      router.replace('/protected');
    }
  }, [authStore.isAuthenticated, router]);
  return <>{children}</>;
});
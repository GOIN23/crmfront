'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStores } from '@/store/RootStoreProvider';

export default function Home() {
  debugger;
  const router = useRouter();
  const store = useStores()
  useEffect(() => {

    if(!store.authStore.isAuthenticated){
        router.replace('/login');
    }
  }, [router]);

  return <div className="min-h-screen flex items-center justify-center">Перенаправление...</div>;
}

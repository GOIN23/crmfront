// app/(protected)/page.tsx
'use client';

import { observer } from 'mobx-react-lite';
import { useStores } from '@/store/RootStoreProvider';

const ProtectedPage = observer(() => {
  debugger
  const { authStore } = useStores();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Добро пожаловать в CRM</h2>
      <p className="text-gray-700">
        Вы вошли как: <strong>{authStore.user?.login ?? 'Пользователь'}</strong>
      </p>
    </div>
  );
});

export default ProtectedPage;
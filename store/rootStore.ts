// src/store/rootStore.ts
import { enableStaticRendering } from 'mobx-react-lite';
import AuthStore from './authStore';
import RefusalsStore from './refusalsStore';

enableStaticRendering(typeof window === 'undefined');

class RootStore {
  authStore: AuthStore;
  refusalsStore: RefusalsStore;

  constructor() {
    this.authStore = new AuthStore(this);
    this.refusalsStore = new RefusalsStore(this);
  }
}

export const rootStore = new RootStore();
export default RootStore;
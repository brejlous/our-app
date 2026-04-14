// TypeScript resolves @firebase/auth to its browser types, which don't include
// getReactNativePersistence. At runtime, Metro correctly resolves to the RN bundle
// (dist/rn/index.js) which exports it. This declaration satisfies TypeScript.
import type { Persistence } from 'firebase/auth';

declare module '@firebase/auth' {
  export interface ReactNativeAsyncStorage {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }
  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage
  ): Persistence;
}

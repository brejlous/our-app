// TypeScript resolves @firebase/auth to its browser types because the `types`
// export condition always takes precedence over `react-native` in TypeScript's
// exports resolution. At runtime, Metro correctly resolves to the RN bundle
// (dist/rn/index.js) which exports getReactNativePersistence.
// This declaration re-exports the missing symbol so TypeScript is satisfied.
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

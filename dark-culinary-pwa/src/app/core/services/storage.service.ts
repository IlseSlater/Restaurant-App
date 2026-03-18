import { Injectable } from '@angular/core';

type StorageScope = 'local' | 'session';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  get<T>(key: string, scope: StorageScope = 'local'): T | null {
    const raw = this.getStore(scope).getItem(key);
    if (raw == null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  set<T>(key: string, value: T, scope: StorageScope = 'local'): void {
    const serialized = typeof value === 'string' ? (value as string) : JSON.stringify(value);
    this.getStore(scope).setItem(key, serialized);
  }

  remove(key: string, scope: StorageScope = 'local'): void {
    this.getStore(scope).removeItem(key);
  }

  clear(scope: StorageScope = 'local'): void {
    this.getStore(scope).clear();
  }

  private getStore(scope: StorageScope): Storage {
    if (typeof window === 'undefined') {
      // SSR safety: use a no-op in-memory shim if needed
      return {
        length: 0,
        clear: () => {},
        getItem: () => null,
        key: () => null,
        removeItem: () => {},
        setItem: () => {},
      } as Storage;
    }
    return scope === 'local' ? window.localStorage : window.sessionStorage;
  }
}


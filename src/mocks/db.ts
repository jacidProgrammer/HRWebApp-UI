import { createSeed, type MockData } from './seed';

const STORAGE_KEY = 'hr.mockDb.v1';

/**
 * In-memory data behind the mock API. In the browser it is kept in sessionStorage, so a reload keeps the
 * changes made during a demo; closing the tab starts fresh.
 */
export class MockDb {
  data: MockData;
  private readonly persist: boolean;

  constructor({ persist = false, now = new Date() }: { persist?: boolean; now?: Date } = {}) {
    this.persist = persist;
    this.data = (persist && MockDb.load()) || createSeed(now);
  }

  private static load(): MockData | null {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as MockData) : null;
    } catch {
      return null;
    }
  }

  save(): void {
    if (!this.persist) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Storage full or blocked: changes live until the next reload.
    }
  }

  reset(now = new Date()): void {
    this.data = createSeed(now);
    this.save();
  }
}

import { describe, expect, it } from 'vitest';
import { avatarColorIndex, departmentColorIndex, initials } from './colors';

describe('colours and initials', () => {
  it('gives the same person the same colour every time, case-insensitively', () => {
    expect(avatarColorIndex('maria')).toBe(avatarColorIndex('Maria'));
    expect(avatarColorIndex('maria')).toBeGreaterThanOrEqual(0);
    expect(avatarColorIndex('maria')).toBeLessThan(8);
  });

  it('keeps fixed colours for the demo departments', () => {
    expect([departmentColorIndex('IT'), departmentColorIndex('Sales'), departmentColorIndex(' people '), departmentColorIndex('Finance')]).toEqual([0, 1, 2, 3]);
  });

  it('builds initials from the first and last word', () => {
    expect(initials('José Antonio')).toBe('JA');
    expect(initials('Maria  Rossi Bianchi')).toBe('MB');
    expect(initials('louisa')).toBe('L');
    expect(initials('  ')).toBe('?');
  });
});

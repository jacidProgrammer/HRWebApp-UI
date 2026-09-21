import { describe, expect, it } from 'vitest';
import { hasErrors, parseSalary, validateContactDetails, validateEmployee, validateRecognition } from './validation';

const valid = {
  username: 'maria',
  name: 'Maria Rossi',
  department: 'Sales',
  role: 'Account Executive',
  email: 'maria@example.com',
  salary: '61000',
  address: 'Berlin',
};

describe('validateEmployee', () => {
  it('accepts a complete employee', () => {
    expect(hasErrors(validateEmployee(valid, { requireUsername: true }))).toBe(false);
  });

  it('requires every field, like the backend', () => {
    const empty = { username: '', name: ' ', department: '', role: '', email: '', salary: '', address: '' };
    expect(validateEmployee(empty, { requireUsername: true })).toEqual({
      username: 'validation.required',
      name: 'validation.required',
      department: 'validation.required',
      role: 'validation.required',
      email: 'validation.required',
      salary: 'validation.required',
      address: 'validation.required',
    });
  });

  it('does not check the username when editing, because it is immutable', () => {
    expect(validateEmployee({ ...valid, username: '' }, { requireUsername: false }).username).toBeUndefined();
  });

  it('rejects invalid emails and usernames, salaries of zero or less and values longer than the column', () => {
    const errors = validateEmployee(
      { ...valid, username: 'maria rossi', email: 'maria', salary: '0', address: 'x'.repeat(256) },
      { requireUsername: true },
    );
    expect(errors).toMatchObject({
      username: 'validation.username',
      email: 'validation.email',
      salary: 'validation.salaryPositive',
      address: 'validation.tooLong',
    });
    expect(validateEmployee({ ...valid, salary: 'lots' }, { requireUsername: true }).salary).toBe('validation.number');
  });
});

describe('parseSalary', () => {
  it('understands English and German/Spanish separators', () => {
    expect(parseSalary('61000')).toBe(61000);
    expect(parseSalary('61,000.50')).toBe(61000.5);
    expect(parseSalary('61.000,50')).toBe(61000.5);
    expect(parseSalary('61000,5 €')).toBe(61000.5);
    expect(parseSalary('abc')).toBeNull();
  });
});

describe('validateContactDetails', () => {
  it('requires a valid email and an address', () => {
    expect(validateContactDetails({ email: 'nope', address: '' })).toEqual({
      email: 'validation.email',
      address: 'validation.required',
    });
  });
});

describe('validateRecognition', () => {
  it('needs a colleague and a message of 1 to 500 characters', () => {
    expect(validateRecognition({ recipientId: null, message: '   ' })).toEqual({
      recipientId: 'validation.recipient',
      message: 'validation.messageRequired',
    });
    expect(validateRecognition({ recipientId: 'id', message: 'x'.repeat(501) }).message).toBe('validation.messageTooLong');
    expect(hasErrors(validateRecognition({ recipientId: 'id', message: 'x'.repeat(500) }))).toBe(false);
  });
});

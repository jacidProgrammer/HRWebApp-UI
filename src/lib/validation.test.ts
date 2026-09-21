import { describe, expect, it } from 'vitest';
import { hasErrors, validateContactDetails, validateEmployee, validateFeedback } from './validation';

const valid = {
  name: 'Maria',
  department: 'Sales',
  role: 'Account Executive',
  email: 'maria@example.com',
  salary: '61000',
  address: 'Berlin',
};

describe('validateEmployee', () => {
  it('accepts a complete employee', () => {
    expect(hasErrors(validateEmployee(valid))).toBe(false);
  });

  it('requires every field, like Employee.requireComplete on the backend', () => {
    const errors = validateEmployee({ name: ' ', department: '', role: '', email: '', salary: '', address: '' });

    expect(errors).toEqual({
      name: 'Name is required.',
      department: 'Department is required.',
      role: 'Role is required.',
      email: 'Email is required.',
      salary: 'Salary is required.',
      address: 'Address is required.',
    });
  });

  it('rejects invalid emails, non-numeric or negative salaries and values longer than the column', () => {
    const errors = validateEmployee({ ...valid, email: 'maria', salary: '-1', address: 'x'.repeat(256) });

    expect(errors.email).toBe('Enter a valid email address.');
    expect(errors.salary).toBe('Salary cannot be negative.');
    expect(errors.address).toBe('Address must be at most 255 characters.');
    expect(validateEmployee({ ...valid, salary: 'lots' }).salary).toBe('Salary must be a number.');
  });

  it('accepts a decimal comma in the salary', () => {
    expect(validateEmployee({ ...valid, salary: '61000,50' }).salary).toBeUndefined();
  });
});

describe('validateContactDetails', () => {
  it('requires a valid email and an address', () => {
    expect(validateContactDetails({ email: 'nope', address: '' })).toEqual({
      email: 'Enter a valid email address.',
      address: 'Address is required.',
    });
  });
});

describe('validateFeedback', () => {
  it('needs a colleague and a message', () => {
    expect(validateFeedback({ name: '', message: '  ' })).toEqual({
      name: 'Choose a colleague.',
      message: 'Message is required.',
    });
  });
});

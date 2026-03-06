import { describe, it, expect } from 'vitest';
import { substituteVariables } from '@/lib/helpers/substituteVariables';

describe('substituteVariables', () => {
  it('replaces a single placeholder', () => {
    expect(substituteVariables('Hello {{name}}', [{ id: 1, key: 'name', value: 'World' }])).toBe('Hello World');
  });

  it('replaces multiple placeholders', () => {
    expect(
      substituteVariables('{{greeting}} {{name}}!', [
        { id: 1, key: 'greeting', value: 'Hi' },
        { id: 2, key: 'name', value: 'Alex' },
      ])
    ).toBe('Hi Alex!');
  });

  it('replaces the same placeholder multiple times', () => {
    expect(substituteVariables('{{x}} + {{x}}', [{ id: 1, key: 'x', value: '1' }])).toBe('1 + 1');
  });

  it('replaces unknown placeholders with empty string', () => {
    expect(substituteVariables('Hello {{unknown}}', [])).toBe('Hello ');
  });

  it('leaves template unchanged when there are no placeholders', () => {
    expect(substituteVariables('Hello world', [{ id: 1, key: 'name', value: 'Alex' }])).toBe('Hello world');
  });

  it('ignores variables with empty keys', () => {
    expect(substituteVariables('{{name}}', [{ id: 1, key: '', value: 'Alex' }, { id: 2, key: '  ', value: 'Bob' }])).toBe('');
  });

  it('trims whitespace from variable keys', () => {
    expect(substituteVariables('{{name}}', [{ id: 1, key: '  name  ', value: 'Alex' }])).toBe('Alex');
  });

  it('returns template unchanged when variables list is empty', () => {
    expect(substituteVariables('no placeholders', [])).toBe('no placeholders');
  });

  it('handles empty template string', () => {
    expect(substituteVariables('', [{ id: 1, key: 'x', value: 'y' }])).toBe('');
  });
});

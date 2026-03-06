import type { Variable } from '@/components/ui/PromptBox/types';

/** Replaces {{key}} placeholders in template with values from variables. */
export function substituteVariables(template: string, variables: Variable[]): string {
  const map = Object.fromEntries(
    variables
      .filter((v) => v.key.trim() !== '')
      .map((v) => [v.key.trim(), v.value])
  );
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => map[key] ?? '');
}

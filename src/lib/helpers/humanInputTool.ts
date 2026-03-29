import type { HumanInputConfig, PromptOption, PromptWidgetType } from '@/types';

const WIDGETS: PromptWidgetType[] = [
  'confirm',
  'choice',
  'text',
  'credentials',
  'toggle',
];

export function normalizeHumanInputConfig(
  stepId: string,
  raw: unknown,
): HumanInputConfig {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const widgetType = WIDGETS.includes(o.widgetType as PromptWidgetType)
    ? (o.widgetType as PromptWidgetType)
    : 'text';

  let options: PromptOption[] | undefined;
  if (Array.isArray(o.options)) {
    options = o.options
      .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object')
      .map((x, i) => {
        const id = typeof x.id === 'string' ? x.id : `opt-${i}`;
        const label = typeof x.label === 'string' ? x.label : id;
        const opt: PromptOption = { id, label };
        if (typeof x.description === 'string') opt.description = x.description;
        if (x.variant === 'destructive' || x.variant === 'accent' || x.variant === 'default') {
          opt.variant = x.variant;
        }
        return opt;
      });
  }

  const question =
    typeof o.question === 'string' && o.question.trim()
      ? o.question.trim()
      : 'Input requested';

  const config: HumanInputConfig = {
    id: stepId,
    question,
    widgetType,
  };

  if (typeof o.context === 'string' && o.context.trim()) config.context = o.context.trim();
  if (options?.length) config.options = options;
  if (typeof o.placeholder === 'string') config.placeholder = o.placeholder;
  if (o.required === true) config.required = true;
  if (typeof o.confirmLabel === 'string') config.confirmLabel = o.confirmLabel;
  if (typeof o.cancelLabel === 'string') config.cancelLabel = o.cancelLabel;

  return config;
}

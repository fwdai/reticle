// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Cost from '@/components/Cost';

describe('Cost', () => {
  it('renders the "Cost" label', () => {
    render(<Cost inputTokens={0} outputTokens={0} />);
    expect(screen.getByText('Cost')).toBeInTheDocument();
  });

  it('shows "-" when provider and model are not provided', () => {
    render(<Cost inputTokens={1000} outputTokens={1000} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('shows "-" when the model has no pricing data', () => {
    render(<Cost provider="openai" model="unknown-model-xyz" inputTokens={1000} outputTokens={1000} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('shows "-" when both token counts are zero', () => {
    render(<Cost provider="openai" model="gpt-4o" inputTokens={0} outputTokens={0} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('displays the formatted cost for a known provider and model', () => {
    // gpt-4o: input=250¢/M, output=1000¢/M
    // 100k input: 25¢, 100k output: 100¢ → 125¢ → $1.25
    render(<Cost provider="openai" model="gpt-4o" inputTokens={100_000} outputTokens={100_000} />);
    expect(screen.getByText('$1.25')).toBeInTheDocument();
  });

  it('displays cost for an Anthropic model', () => {
    // claude-sonnet-4: input=300¢/M, output=1500¢/M
    // 1M input: 300¢, 1M output: 1500¢ → 1800¢ → $18.00
    render(<Cost provider="anthropic" model="claude-sonnet-4" inputTokens={1_000_000} outputTokens={1_000_000} />);
    expect(screen.getByText('$18.00')).toBeInTheDocument();
  });

  it('strips date suffixes from model IDs for pricing lookup', () => {
    // gpt-4o-2024-11-20 → strips date → gpt-4o (250¢/M input, 1000¢/M output)
    // 1M input + 1M output = 250¢ + 1000¢ = 1250¢ = $12.50
    render(<Cost provider="openai" model="gpt-4o-2024-11-20" inputTokens={1_000_000} outputTokens={1_000_000} />);
    expect(screen.getByText('$12.50')).toBeInTheDocument();
  });

  it('shows the info icon when cost is greater than zero', () => {
    const { container } = render(
      <Cost provider="openai" model="gpt-4o" inputTokens={1_000_000} outputTokens={1_000_000} />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not show the info icon when cost is zero (no tokens)', () => {
    const { container } = render(
      <Cost provider="openai" model="gpt-4o" inputTokens={0} outputTokens={0} />
    );
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('does not show the info icon when cost is null (unknown model)', () => {
    const { container } = render(
      <Cost provider="openai" model="unknown-model" inputTokens={1000} outputTokens={1000} />
    );
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});

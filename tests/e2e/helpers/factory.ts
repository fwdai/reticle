type Overrides = Record<string, unknown>;

interface FactoryDef {
  table: string;
  defaults: Overrides;
}

const FACTORIES: Record<string, FactoryDef> = {
  scenario: {
    table: 'scenarios',
    defaults: {
      title: 'Test Scenario',
      provider: 'openai',
      model: 'gpt-4o',
      system_prompt: '',
      user_prompt: '',
      params_json: '{}',
    },
  },
  agent: {
    table: 'agents',
    defaults: {
      name: 'Test Agent',
      provider: 'openai',
      model: 'gpt-4o',
      params_json: '{"temperature":0.4,"top_p":0.95,"max_tokens":4096}',
    },
  },
  execution: {
    table: 'executions',
    defaults: {
      type: 'scenario',
      runnable_id: '',
      snapshot_json: '{}',
      status: 'succeeded',
      started_at: Date.now(),
    },
  },
  account: {
    table: 'accounts',
    defaults: {},
  },
  api_key: {
    table: 'api_keys',
    defaults: {
      provider: 'openai',
      key: 'test-key',
    },
  },
  prompt_template: {
    table: 'prompt_templates',
    defaults: {
      type: 'system',
      name: 'Test Template',
      content: 'You are a helpful assistant.',
    },
  },
  collection: {
    table: 'collections',
    defaults: {
      name: 'Test Collection',
    },
  },
  tool: {
    table: 'tools',
    defaults: {
      name: 'test_tool',
      description: 'A test tool',
      parameters_json: '[]',
      mock_response: '{"result":"success"}',
      mock_mode: 'json',
      is_enabled: 1,
      is_global: 1,
      sort_order: 0,
    },
  },
};

export async function create<T extends Overrides = Overrides>(
  type: string,
  overrides: Overrides = {}
): Promise<T & { id: string }> {
  const factory = FACTORIES[type];
  if (!factory) throw new Error(`No factory defined for "${type}"`);

  const data: Overrides = { ...factory.defaults, ...overrides };

  if (type === 'scenario' && !data.collection_id) {
    data.collection_id = await browser.executeAsync((done: (id: string) => void) => {
      (globalThis as any).__e2e.getOrCreateDefaultCollection().then(done);
    });
  }

  const id: string = await browser.executeAsync(
    (table: string, data: Overrides, done: (id: string) => void) => {
      (globalThis as any).__e2e.insert(table, data).then(done);
    },
    factory.table,
    data
  );

  return { ...data, id } as T & { id: string };
}

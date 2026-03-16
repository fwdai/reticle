<p align="center">
  <img src="./.github/screenshots/logo.svg" alt="Reticle Logo" width="48" />
</p>

<h1 align="center">Reticle</h1>

<p align="center">
  <strong>Postman for AI</strong><br />
  Design, evaluate, and debug LLM scenarios and AI agents across providers — entirely on your machine.
</p>


<p align="center">
  <img src="https://img.shields.io/badge/status-beta-orange?style=flat-square&labelColor=1a1f2e" />
  <img src="https://img.shields.io/badge/license-MIT-ffffff?style=flat-square&labelColor=1a1f2e" />
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue?style=flat-square&labelColor=1a1f2e" />
</p>

> **Public beta.** Core features work and are actively used, but this is early software — things may break and APIs may change. [Open a bug report](https://github.com/fwdai/reticle/issues) if you hit an issue. We'd love your feedback.

If Reticle is useful, please consider starring the repo ⭐

<br />

<p align="center">
  <img src="./.github/screenshots/reticle_showcase.gif" alt="Reticle app" width="860" />
</p>

<br />

<p align="center">
  <a href="https://reticle.run">Website</a> &nbsp;·&nbsp;
  <a href="https://github.com/fwdai/reticle/releases">Download</a> &nbsp;·&nbsp;
  <a href="#quick-start">Quick Start</a> &nbsp;·&nbsp;
  <a href="https://github.com/fwdai/reticle/issues">Report a bug</a>
</p>

<br />

---

## The problem

AI development tooling is fragmented. Provider playgrounds, eval frameworks, cloud-hosted observability platforms — each solves one piece of the development workflow.

There's no unified environment that takes you from designing a prompt or agent, through debugging and evaluation, to shipping with confidence that nothing broke — all in one place.

Reticle is that environment. And it runs entirely on your machine, so your prompts, agents, and data stay yours.

---

## Features

Reticle is a desktop app — everything runs locally, no account required, no context switching between tools.

### 📋 Scenarios
Design LLM scenarios with system prompts, variables, multi-turn history, tool calling, files, and full model control — provider, variant, temperature, seed, max tokens. Run the same scenario against OpenAI, Anthropic, and Google models and compare outputs, latency, and cost side by side.

### 🤖 Agents
Define AI agents with goals, system instructions, tools, memory. Give your agent a task and see them execute step by step, inspect every tool call and intermediate output, and debug exactly where things go wrong. Default Agent architecture is **ReAct** (aka ToolLoopAgent), however more agent architectures can be introduced in the future.

### 🧪 Evals
In production AI systems, evals are the only way to know if your scenario or agent still does what it was designed to do after a prompt tweak, a model upgrade, or a tool change. Without them, every change is a guess.

Reticle lets you build eval datasets directly in the app, paste them in, or import from JSON and CSV. Run your scenarios and agents against those datasets and assert on the outputs — `contains`, `equals`, `not_contains`, `LLM judge`, `tool_called`, `tool_not_called`, `JSON schema`, `tool_sequence`, and more. Ship with confidence instead of hope.

### 💰 Cost visibility
Every LLM call tracks input and output token usage. Cost is estimated based on token counts and model pricing — not exact billing data from the provider, but accurate enough to understand what your scenarios, agent runs, and evals actually cost and where the spend is going.

### 🔧 Tools
Define tools globally and reuse them across any scenario or agent, or scope them locally to a specific scenario or agent when they're only relevant there.

Each tool has two execution modes. If the goal is to test LLM reasoning and response quality, mock the tool with a fixed JSON response — the model sees a realistic tool result without any risk of real failures or side effects. If the goal is end-to-end validation, provide a real JavaScript implementation and the tool will be executed during the run, giving the model actual live data to work with.

### 📝 Templates
Build a library of battle-tested building blocks and stop copy-pasting prompts across projects. Templates support `{{variables}}` that get filled in at runtime, and can be attached to multiple scenarios — so when a core prompt improves, every scenario that uses it benefits immediately.

### 🕓 Runs history
Every scenario and agent execution is automatically recorded and stored locally. Full inputs, outputs, execution traces, tool calls, token usage, and cost — all preserved. Go back and re-inspect any previous run at any time, compare how the same scenario behaved across different models, or trace exactly what an agent did three iterations ago.

### 🔒 Private by default
API keys, environment variables, scenarios, agents, and the entire run history are stored locally in a SQLite database on your machine — nothing is ever sent to an external server. API keys are injected at runtime via a local proxy, so they never touch the frontend or any network layer outside your device. Reticle is secure by default, giving you the freedom to experiment without worrying about where your data ends up.

---

## Quick start

### Download

Get the latest release from [reticle.run](https://reticle.run/download) or the [Releases page](https://github.com/fwdai/reticle/releases).

| Platform | Format |
|---|---|
| macOS (Apple Silicon) | `.dmg` |
| macOS (Intel) | `.dmg` |
| Linux | `.AppImage` / `.deb` |
| Windows | `.msi` |

### Build from source

```bash
# Prerequisites: Rust, Bun
git clone https://github.com/fwdai/reticle
cd reticle
bun install
bun run setup       # downloads Deno sidecar
bun run tauri dev
```

---

## Contributing

Issues and PRs are welcome. For anything significant, open an issue first so we can align on direction before you invest time in it.

```bash
bun run dev           # frontend only
bun run tauri dev     # full app with hot reload
bun run test          # unit tests
bun run test:e2e      # end-to-end tests (requires built binary)
```

---

## License

MIT — [LICENSE](LICENSE)

---

<p align="center">
  <sub>Built for engineers who want to know what their AI is actually doing.</sub>
</p>

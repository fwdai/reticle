# Reticle: Build, Test, and Deploy AI Scenarios

Reticle is a desktop application built with **Tauri**, featuring a **React (TypeScript)** frontend and a **Rust** backend. It provides a powerful environment for building, testing, and deploying AI scenarios, offering robust tools for managing LLM interactions, configurations, and data.

## Features

*   **AI Scenario Studio:** A dedicated UI for crafting and testing AI scenarios.
*   **LLM Provider Integration:** Seamlessly connect with various LLM providers (OpenAI, Anthropic, Google).
*   **Local Proxy Server:** Securely route API calls through a local Rust-powered proxy.
*   **API Key Management:** Store and retrieve API keys securely using an embedded SQLite database.
*   **Scenario Versioning & History:** Track changes and execution history of your AI scenarios.
*   **Extendable Architecture:** Designed for easy integration of new LLMs, tools, and functionalities.

## Recommended IDE Setup

-   [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js** (v20.19+ or v22.12+ recommended by Vite) and **Bun** (as package manager).
*   **Rust** (latest stable version, via [rustup](https://rustup.rs/)).
*   **Tauri CLI** (`cargo install tauri-cli --version "2.0.0-beta.19"` or later compatible beta version).

### Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/reticle.git
    cd reticle
    ```

2.  **Install frontend dependencies:**
    ```bash
    bun install
    ```

3.  **Run the application in development mode:**
    This command will build both the Rust backend and the React frontend, and launch the Tauri desktop application. It will also automatically apply any pending database migrations.
    ```bash
    bun run tauri dev
    ```

4.  **Database & Migrations:**
    Reticle uses SQLite for local data storage. Database schema migrations are automatically applied on application startup (when running `bun run tauri dev`). If you encounter issues with database schema (e.g., "no such table" errors after changes), you may need to:
    *   **Close the application.**
    *   **Delete the development database file:**
        *   **macOS:** `rm "~/Library/Application Support/com.alchaplinsky.reticle/reticle.db"`
        *   **Linux:** `rm "~/.config/com.alchaplinsky.reticle/reticle.db"`
        *   **Windows:** `del "%APPDATA%\com.alchaplinsky.reticle\reticle.db"`
    *   **Rerun `bun run tauri dev`** to create a fresh database with all migrations applied.

This completes the initial setup. Explore the Studio UI to start building your AI scenarios!

import { ChevronDown, Copy } from "lucide-react";
import "./MainContent.css";
import { Button } from "@/components/ui/button";

function MainContent() {
  return (
    <main className="main-content">
      <div className="main-content-header">
        <div className="tabs">
          <button className="tab-button active">Prompt</button>
          <button className="tab-button">System</button>
          <button className="tab-button">Parameters</button>
          <button className="tab-button">Context</button>
        </div>
        <div className="model-selector">
          <div className="provider-selector">
            <button>
              <span>OpenAI</span>
              <ChevronDown size={16} />
            </button>
          </div>
          <div className="model-selector-dropdown">
            <button>
              <span>GPT-4o Mini</span>
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="prompt-area">
        <textarea placeholder="Explain quantum computing in simple terms."></textarea>
        <div className="prompt-footer">
          <span>
            Tip: Use {"{{variable}}"} syntax to reference environment variables
          </span>
          <span>42 characters</span>
        </div>
        <Button>Test Button</Button>
      </div>
      <div className="response-area">
        <div className="response-header">
          <div className="tabs">
            <button className="tab-button active">Response</button>
            <button className="tab-button">Request</button>
            <button className="tab-button">Stats</button>
          </div>
          <div className="response-actions">
            <span className="status">success</span>
            <button>
              <Copy size={16} />
              <span>Copy</span>
            </button>
          </div>
        </div>
        <div className="response-content">
          <p>
            Quantum computing is a type of computing that uses quantum mechanics
            to process information in ways that classical computers cannot.
          </p>
          <p>
            <strong>**Key Concepts:**</strong>
          </p>
          <ol>
            <li>
              <strong>**Qubits**:</strong> Unlike classical bits (0 or 1),
              quantum bits can exist in multiple states simultaneously through
              "superposition"
            </li>
            <li>
              <strong>**Entanglement**:</strong> Qubits can be linked together
              so the state of one instantly affects another, regardless of
              distance
            </li>
            <li>
              <strong>**Quantum Gates**:</strong> Operations that manipulate
              qubits to perform calculations
            </li>
          </ol>
          <p>
            <strong>**Why It Matters:**</strong>
          </p>
          <ul>
            <li>Solves certain problems exponentially faster than classical computers</li>
            <li>Useful for cryptography, drug discovery, optimization, and AI</li>
          </ul>
          <p>
            Think of it like this: A classical computer tries one path through a
            maze at a time. A quantum computer explores all paths
            simultaneously.
          </p>
        </div>
      </div>
    </main>
  );
}

export default MainContent;

import { Module, render } from "viz.js/full.render.js";
import Viz from "viz.js";

const viz = new Viz({ Module, render });

/**
 * Parse text-based automata specification into JSON format
 * Expects format like:
 * States: q0, q1, q2
 * Alphabet: a, b
 * Start State: q0
 * Accept States: q1, q2
 * Transitions:
 * q0 --a--> q1
 * q1 --b--> q2
 */
function parseAutomataText(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  const automata = {
    states: [],
    alphabet: [],
    start_state: null,
    accept_states: [],
    transitions: {}
  };

  let parsingTransitions = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('States:')) {
      const statesStr = line.replace('States:', '').trim();
      automata.states = statesStr.split(',').map(s => s.trim());
    } else if (line.startsWith('Alphabet:')) {
      const alphabetStr = line.replace('Alphabet:', '').trim();
      automata.alphabet = alphabetStr.split(',').map(s => s.trim());
    } else if (line.startsWith('Start State:') || line.startsWith('Start:')) {
      automata.start_state = line.replace(/^Start (State)?:/, '').trim();
    } else if (line.startsWith('Accept States:') || line.startsWith('Accept:')) {
      const acceptStr = line.replace(/^Accept (States)?:/, '').trim();
      automata.accept_states = acceptStr.split(',').map(s => s.trim());
    } else if (line.startsWith('Transitions:')) {
      parsingTransitions = true;
      continue;
    } else if (parsingTransitions && line.includes('-->')) {
      // Parse transition: q0 --a--> q1
      const match = line.match(/(\w+)\s*--(.+?)-->\s*(\w+)/);
      if (match) {
        const [, fromState, symbol, toState] = match;
        if (!automata.transitions[fromState]) {
          automata.transitions[fromState] = {};
        }
        automata.transitions[fromState][symbol] = toState;
      }
    }
  }

  return automata;
}

/**
 * Extract explanation from text
 * Looks for text between start and "Formal Specification" or before "States:"
 */
function extractExplanation(text) {
  const explanationMatch = text.match(/\*\*Explanation:\*\*([\s\S]*?)(?:\*\*Formal|States:)/i);
  if (explanationMatch) {
    return explanationMatch[1].trim();
  }
  
  // Fallback: get first paragraph
  const paragraphs = text.split('\n\n');
  return paragraphs[0] || '';
}

function generateDot(automata) {
  const acceptStates = automata.accept_states || [];
  const startState = automata.start_state || (automata.states && automata.states[0]);

  let dot = `digraph DFA {
    rankdir=LR;
    bgcolor="#ffffff00";
    fontname="Inter";
    node [fontname="Inter", style="filled", fillcolor="#f8fafc", color="#7dd3fc", penwidth=1.6];
    edge [fontname="Inter", color="#d8e6ff", penwidth=1.4, arrowsize=0.8];
    start [shape=point, width=0.14, label="", color="#f59e0b"];
`;

  // Add states
  automata.states.forEach((state) => {
    const isAccepting = acceptStates.includes(state);
    if (isAccepting) {
      dot += `    ${state} [label="${state}", shape=doublecircle, fillcolor="#0f172a", color="#7ef0b2", fontcolor="#edf2ff"];\n`;
    } else {
      dot += `    ${state} [label="${state}", shape=circle, fillcolor="#f8fafc", color="#7dd3fc", fontcolor="#0f172a"];\n`;
    }
  });

  // Add start transition
  if (startState) {
    dot += `    start -> ${startState} [color="#f59e0b"];\n`;
  }

  // Add transitions
  for (const fromState in automata.transitions) {
    const stateTransitions = automata.transitions[fromState];
    for (const symbol in stateTransitions) {
      const toState = stateTransitions[symbol];
      dot += `    ${fromState} -> ${toState} [label="${symbol}"];\n`;
    }
  }

  dot += `}`;
  return dot;
}

export async function renderAutomata(data, container) {
  try {
    // If data is a string, parse it as text format
    let automata;
    let explanation = '';

    if (typeof data === 'string') {
      explanation = extractExplanation(data);
      // Extract the formal specification part
      const specMatch = data.match(/(?:\*\*Formal Specification:\*\*)?([\s\S]*)/);
      const specText = specMatch ? specMatch[1] : data;
      automata = parseAutomataText(specText);
    } else if (data.automata) {
      // If already parsed JSON with automata object
      automata = data.automata;
      explanation = data.explanation || '';
    } else {
      // If it's just the automata object
      automata = data;
    }

    // Validate that we have the required fields
    if (!automata.states || automata.states.length === 0) {
      throw new Error('No states found in automata specification');
    }

    const dot = generateDot(automata);
    const svg = await viz.renderString(dot);

    container.innerHTML = `
      <div class="automata-plugin">
        <div class="automata-graph">
          ${svg}
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div class="automata-error">
        <p>Error rendering automata: ${error.message}</p>
      </div>
    `;
  }
}
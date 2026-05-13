import { useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { renderAutomata } from '../../plugins/FSA/renderer';
import './Message.css';

function extractAutomataExplanation(text) {
  const explanationMatch = text.match(/\*\*Explanation:\*\*([\s\S]*?)(?:\*\*Formal|States:)/i);
  if (explanationMatch) {
    return explanationMatch[1].trim();
  }
  // Fallback: get first paragraph before formal spec
  const paragraphs = text.split('\n\n');
  if (paragraphs[0] && !paragraphs[0].includes('States:')) {
    return paragraphs[0];
  }
  return '';
}

export default function Message({ message }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);
  const containerRef = useRef(null);
  const [parsedData, setParsedData] = useState(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (message.role === 'assistant') {
      try {
        const text = message.content.trim();
        // Check if it contains automata specification (States:, Alphabet:, etc.)
        if (text.includes('States:') && text.includes('Transitions:')) {
          // Extract explanation from the text
          const explanation = extractAutomataExplanation(text);
          // This is an automata specification - pass the full text for parsing
          setParsedData({ type: 'automata_text', content: text, explanation });
        } else if (text.startsWith('{') && text.endsWith('}')) {
          // Try to parse as JSON (legacy support)
          try {
            const data = JSON.parse(text);
            if (data.automata && data.explanation) {
              setParsedData(data);
            }
          } catch (e) {
            // Not valid JSON
          }
        }
      } catch (e) {
        // Not an automata specification
      }
    }
  }, [message.content, message.role]);

  useEffect(() => {
    if (parsedData && containerRef.current) {
      if (parsedData.type === 'automata_text') {
        // Pass the full text for parsing
        renderAutomata(parsedData.content, containerRef.current);
      } else {
        // Legacy JSON format
        renderAutomata(parsedData, containerRef.current);
      }
    }
  }, [parsedData]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const isUser = message.role === 'user';

  return (
    <div className={`message-row ${isUser ? 'message-row--user' : 'message-row--assistant'}`}>
      <div className={`message-avatar ${isUser ? 'message-avatar--user' : 'message-avatar--assistant'}`}>
        {isUser ? 'U' : 'P'}
      </div>
      <div className="message-content-wrap">
        <div className={`message-bubble ${isUser ? 'message-bubble--user' : 'message-bubble--assistant'}`}>
          {isUser ? (
            <p className="message-text">{message.content}</p>
          ) : parsedData ? (
            <div className="parsed-data-wrapper">
              <div ref={containerRef} className="renderer-container"></div>
              {parsedData.explanation && (
                <div className="message-markdown message-explanation">
                  <ReactMarkdown>{parsedData.explanation}</ReactMarkdown>
                </div>
              )}
            </div>
          ) : (
            <div className="message-markdown">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <button
          className="message-copy-btn"
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy message'}
          aria-label="Copy message"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
}

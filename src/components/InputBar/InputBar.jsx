import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import './InputBar.css';

export default function InputBar({ onSend, isLoading, disabled, disabledReason }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="input-bar-container">
      {disabled && disabledReason && (
        <div className="input-bar-warning">
          <AlertCircle size={14} />
          <span>{disabledReason}</span>
        </div>
      )}
      <form className="input-bar" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="input-bar__textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Set your API key in Settings to start chatting...' : 'Type a message...'}
          disabled={disabled || isLoading}
          rows={1}
          id="chat-input"
          aria-label="Chat message input"
        />
        <button
          type="submit"
          className="input-bar__send"
          disabled={!input.trim() || isLoading || disabled}
          aria-label="Send message"
          id="send-button"
        >
          {isLoading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
        </button>
      </form>
      <p className="input-bar__hint">
        PlugLM uses OpenRouter API. Press <kbd>Enter</kbd> to send, <kbd>Shift+Enter</kbd> for new line.
      </p>
    </div>
  );
}

import { useRef, useEffect } from 'react';
import Message from '../Message/Message';
import InputBar from '../InputBar/InputBar';
import { Sparkles } from 'lucide-react';
import './Chat.css';

export default function Chat({ chat, onSend, isLoading, apiKeySet }) {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to the newest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat?.messages]);

  const hasMessages = chat && chat.messages && chat.messages.length > 0;

  return (
    <div className="chat-area">
      <div className="chat-messages" ref={messagesContainerRef}>
        {!hasMessages && (
          <div className="chat-empty">
            <div className="chat-empty__icon">
              <Sparkles size={40} />
            </div>
            <h2 className="chat-empty__title">PlugLM</h2>
            <p className="chat-empty__subtitle">
              Visualization capable LLMs or something
            </p>
            <div className="chat-empty__hints">
              <div className="chat-empty__hint" onClick={() => apiKeySet && onSend('Explain quantum computing in simple terms')}>
                <span>💡</span> Explain quantum computing in simple terms
              </div>
              <div className="chat-empty__hint" onClick={() => apiKeySet && onSend('Write a Python function to sort a list')}>
                <span>🐍</span> Write a Python function to sort a list
              </div>
              <div className="chat-empty__hint" onClick={() => apiKeySet && onSend('What are the best practices for REST API design?')}>
                <span>🌐</span> Best practices for REST API design
              </div>
            </div>
          </div>
        )}

        {hasMessages &&
          chat.messages.map((msg, idx) => (
            <Message key={`${chat.id}-${idx}`} message={msg} />
          ))
        }

        {isLoading && (
          <div className="chat-typing">
            <div className="chat-typing__dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <InputBar
        onSend={onSend}
        isLoading={isLoading}
        disabled={!apiKeySet}
        disabledReason={!apiKeySet ? 'Please add your OpenRouter API key in Settings to start chatting.' : ''}
      />
    </div>
  );
}

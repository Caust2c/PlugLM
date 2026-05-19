import { useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './Message.css';

function resolvePluginApi(renderer) {
  if (!renderer) {
    return null;
  }

  if (renderer.plugin && typeof renderer.plugin.render === 'function') {
    return renderer.plugin;
  }

  if (typeof renderer.render === 'function') {
    return renderer;
  }

  if (renderer.default) {
    return resolvePluginApi(renderer.default);
  }

  return null;
}

export default function Message({ message, activePlugin, pluginsConfig }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);
  const containerRef = useRef(null);
  const [parsedData, setParsedData] = useState(null);
  const messagePlugin = message.pluginId && pluginsConfig ? pluginsConfig[message.pluginId] : null;
  const runtimePlugin = messagePlugin || activePlugin;
  const pluginApi = resolvePluginApi(runtimePlugin?.runtime || runtimePlugin?.renderer);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (message.role === 'assistant' && pluginApi) {
      try {
        const text = message.content.trim();
        const explanation = typeof pluginApi.extractExplanation === 'function' ? pluginApi.extractExplanation(text) : '';
        setParsedData({
          content: text,
          explanation,
          renderer: pluginApi.render,
        });
      } catch (e) {
        setParsedData(null);
      }
    } else {
      setParsedData(null);
    }
  }, [message.content, message.role, pluginApi]);

  useEffect(() => {
    if (parsedData && containerRef.current) {
      try {
        const maybePromise = parsedData.renderer(parsedData.content, containerRef.current);
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.catch((error) => {
            containerRef.current.innerHTML = `<p style="color: red;">Error rendering plugin: ${error.message}</p>`;
          });
        }
      } catch (error) {
        containerRef.current.innerHTML = `<p style="color: red;">Error rendering plugin: ${error.message}</p>`;
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

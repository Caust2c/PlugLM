import { useState, useEffect } from 'react';
import { X, Key, Save, Eye, EyeOff } from 'lucide-react';
import './SettingsModal.css';

export default function SettingsModal({ isOpen, onClose, apiKey, model, onSaveApiKey, onSaveModel }) {
  const [key, setKey] = useState('');
  const [modelValue, setModelValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKey(apiKey || '');
      setModelValue(model || '');
      setSaved(false);
      setShowKey(false);
    }
  }, [isOpen, apiKey, model]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(key.trim());
    onSaveModel(modelValue.trim());
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal__header">
          <h2 className="settings-modal__title">
            <Settings2Icon />
            Settings
          </h2>
          <button
            className="settings-modal__close"
            onClick={onClose}
            aria-label="Close settings"
            id="close-settings"
          >
            <X size={18} />
          </button>
        </div>

        <div className="settings-modal__body">
          <div className="settings-modal__section">
            <label className="settings-modal__label" htmlFor="api-key-input">
              <Key size={14} />
              OpenRouter API Key
            </label>
            <p className="settings-modal__desc">
              Get your API key from{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
                openrouter.ai/keys
              </a>
            </p>
            <div className="settings-modal__input-group">
              <input
                id="api-key-input"
                type={showKey ? 'text' : 'password'}
                className="settings-modal__input"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-or-v1-..."
                spellCheck={false}
                autoComplete="off"
              />
              <button
                className="settings-modal__eye"
                onClick={() => setShowKey(!showKey)}
                type="button"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="settings-modal__section">
            <label className="settings-modal__label">
              Model
            </label>
            <p className="settings-modal__desc">
              Enter any OpenRouter model id (for example: nvidia/nemotron-3-super-120b-a12b:free)
            </p>
            <div className="settings-modal__input-group">
              <input
                id="model-input"
                type="text"
                className="settings-modal__input"
                value={modelValue}
                onChange={(e) => setModelValue(e.target.value)}
                placeholder="openai/gpt-oss-120b:free"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div className="settings-modal__footer">
          <button className="settings-modal__cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`settings-modal__save ${saved ? 'settings-modal__save--saved' : ''}`}
            onClick={handleSave}
            id="save-settings"
          >
            <Save size={14} />
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Settings2Icon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
    </svg>
  );
}

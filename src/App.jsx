import { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Chat from './components/Chat/Chat';
import SettingsModal from './components/SettingsModal/SettingsModal';
import PluginsPanel from './components/PluginsPanel/PluginsPanel';
import { sendChatMessage, DEFAULT_MODEL } from './utils/api';
import {
  loadChats,
  saveChats,
  loadActiveChatId,
  saveActiveChatId,
  loadApiKey,
  saveApiKey,
  loadModel,
  saveModel,
  loadSidebarCollapsed,
  saveSidebarCollapsed,
  loadActivePlugin,
  saveActivePlugin,
  loadRemotePlugins,
  saveRemotePlugins,
} from './utils/storage';
import './App.css';

const manifestsRaw = import.meta.glob('./plugins/*/manifest.json', { eager: true });
const promptsRaw = import.meta.glob('./plugins/*/prompt.md', { query: '?raw', import: 'default', eager: true });
const renderersRaw = import.meta.glob('./plugins/*/renderer.js', { eager: true });

async function loadRendererModule(plugin) {
  const renderer = plugin?.renderer;
  const rendererSource = plugin?.rendererSource || renderer;

  if (!renderer) {
    return null;
  }

  if (typeof renderer !== 'string') {
    return renderer;
  }

  if (/^(https?:)?\/\//i.test(renderer) || renderer.startsWith('/') || renderer.startsWith('.')) {
    try {
      return await import(/* @vite-ignore */ renderer);
    } catch (error) {
      console.warn('Direct renderer import failed, falling back to blob import:', error);
    }
  }

  const blob = new Blob([rendererSource], { type: 'text/javascript' });
  const blobUrl = URL.createObjectURL(blob);

  try {
    return await import(/* @vite-ignore */ blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

const builtInPlugins = Object.entries(manifestsRaw).reduce((acc, [path, module]) => {
  const folder = path.split('/').slice(-2, -1)[0];
  const manifest = module.default || module;
  const promptPath = `./plugins/${folder}/prompt.md`;
  const rendererPath = `./plugins/${folder}/renderer.js`;
  
  acc.push({
    source: 'local',
    folder,
    id: manifest.id || folder,
    name: manifest.name || folder,
    description: manifest.description || '',
    version: manifest.version || '0.0.0',
    manifest,
    prompt: promptsRaw[promptPath] || '',
    renderer: renderersRaw[rendererPath] || null
  });
  return acc;
}, []);

/**
 * Generate a unique chat ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Create a new empty chat object
 */
function createChat() {
  return {
    id: generateId(),
    title: 'New Chat',
    messages: [],
  };
}

/**
 * Derive a short title from the first user message
 */
function deriveTitle(content) {
  const clean = content.replace(/\n/g, ' ').trim();
  return clean.length > 40 ? clean.slice(0, 40) + '…' : clean;
}

export default function App() {
  const [chats, setChats] = useState(() => {
    const saved = loadChats();
    return saved.length > 0 ? saved : [createChat()];
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    const savedId = loadActiveChatId();
    const saved = loadChats();
    if (savedId && saved.some((c) => c.id === savedId)) return savedId;
    return saved.length > 0 ? saved[0].id : null;
  });

  const [apiKey, setApiKey] = useState(() => loadApiKey());
  const [model, setModel] = useState(() => loadModel() || DEFAULT_MODEL);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => loadSidebarCollapsed());
  const [activePluginId, setActivePluginId] = useState(() => loadActivePlugin());
  const [remotePlugins, setRemotePlugins] = useState(() => loadRemotePlugins());
  const [pluginRuntimes, setPluginRuntimes] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pluginsOpen, setPluginsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Persist chats whenever they change
  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  // Persist active chat ID
  useEffect(() => {
    saveActiveChatId(activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    saveRemotePlugins(remotePlugins);
  }, [remotePlugins]);

  useEffect(() => {
    let cancelled = false;

    const hydrateRemotePlugins = async () => {
      const loadedEntries = await Promise.all(
        remotePlugins.map(async (plugin) => {
          if (pluginRuntimes[plugin.id]) {
            return null;
          }

          const runtime = await loadRendererModule(plugin);
          return runtime ? [plugin.id, runtime] : null;
        })
      );

      if (cancelled) {
        return;
      }

      const nextRuntimes = loadedEntries.reduce((acc, entry) => {
        if (entry) {
          const [pluginId, runtime] = entry;
          acc[pluginId] = runtime;
        }
        return acc;
      }, {});

      if (Object.keys(nextRuntimes).length > 0) {
        setPluginRuntimes((prev) => ({ ...prev, ...nextRuntimes }));
      }
    };

    hydrateRemotePlugins().catch((error) => {
      console.error('Failed to hydrate remote plugin renderers:', error);
    });

    return () => {
      cancelled = true;
    };
  }, [remotePlugins, pluginRuntimes]);

  const pluginsConfig = useMemo(() => {
    return [...builtInPlugins, ...remotePlugins].reduce((acc, plugin) => {
      const runtime = pluginRuntimes[plugin.id] || plugin.renderer || null;
      acc[plugin.id] = {
        ...plugin,
        runtime,
      };
      return acc;
    }, {});
  }, [remotePlugins, pluginRuntimes]);

  // Get active plugin config
  const activePlugin = activePluginId && pluginsConfig[activePluginId] ? pluginsConfig[activePluginId] : null;

  // Get active chat
  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0] || null;

  // --- Chat Operations ---

  const handleNewChat = useCallback(() => {
    const newChat = createChat();
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  }, []);

  const handleSelectChat = useCallback((id) => {
    setActiveChatId(id);
  }, []);

  const handleDeleteChat = useCallback(
    (id) => {
      setChats((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        if (updated.length === 0) {
          const newChat = createChat();
          setActiveChatId(newChat.id);
          return [newChat];
        }
        if (id === activeChatId) {
          setActiveChatId(updated[0].id);
        }
        return updated;
      });
    },
    [activeChatId]
  );

  // --- Sending Messages ---

  const handleSendMessage = useCallback(
    async (content) => {
      if (!apiKey || !activeChat || isLoading) return;

      const userMessage = { role: 'user', content };

      // Update chat with user message
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== activeChat.id) return c;
          const updated = {
            ...c,
            messages: [...c.messages, userMessage],
            title: c.messages.length === 0 ? deriveTitle(content) : c.title,
          };
          return updated;
        })
      );

      setIsLoading(true);

      try {
        const messagesForApi = activeChat.messages.map(m => ({ ...m }));
        
        if (activePluginId && pluginsConfig[activePluginId]) {
          const pluginPrompt = pluginsConfig[activePluginId].prompt;
          messagesForApi.push({
            role: 'user',
            content: pluginPrompt ? pluginPrompt.replace('{{user_input}}', content) : content
          });
        } else {
          messagesForApi.push({ role: 'user', content });
        }

        const reply = await sendChatMessage(apiKey, messagesForApi, model);

        const assistantMessage = { role: 'assistant', content: reply, pluginId: activePluginId || null };

        setChats((prev) =>
          prev.map((c) => {
            if (c.id !== activeChat.id) return c;
            return { ...c, messages: [...c.messages, assistantMessage] };
          })
        );
      } catch (error) {
        const errorMessage = {
          role: 'assistant',
          content: `⚠️ **Error:** ${error.message}`,
        };

        setChats((prev) =>
          prev.map((c) => {
            if (c.id !== activeChat.id) return c;
            return { ...c, messages: [...c.messages, errorMessage] };
          })
        );
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey, activeChat, isLoading, activePluginId, model]
  );

  // --- Settings ---

  const handleSaveApiKey = useCallback((key) => {
    setApiKey(key);
    saveApiKey(key);
  }, []);

  const handleSaveModel = useCallback((nextModel) => {
    const normalizedModel = nextModel.trim() || DEFAULT_MODEL;
    setModel(normalizedModel);
    saveModel(normalizedModel);
  }, []);

  // --- Plugins ---

  const handleTogglePlugin = useCallback((pluginId) => {
    setActivePluginId(pluginId);
    saveActivePlugin(pluginId);
  }, []);

  const handleAddRemotePlugin = useCallback((plugin) => {
    setRemotePlugins((prev) => {
      const filtered = prev.filter((current) => current.id !== plugin.id);
      return [...filtered, plugin];
    });
  }, []);

  // --- Sidebar ---

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      saveSidebarCollapsed(next);
      return next;
    });
  }, []);

  return (
    <div className="app">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        collapsed={sidebarCollapsed}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onToggleCollapse={handleToggleSidebar}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenPlugins={() => setPluginsOpen(true)}
      />

      <main className="app__main">
        <Chat
          chat={activeChat}
          onSend={handleSendMessage}
          isLoading={isLoading}
          apiKeySet={!!apiKey}
          activePlugin={activePlugin}
          pluginsConfig={pluginsConfig}
        />
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        model={model}
        onSaveApiKey={handleSaveApiKey}
        onSaveModel={handleSaveModel}
      />

      <PluginsPanel
        isOpen={pluginsOpen}
        onClose={() => setPluginsOpen(false)}
        activePluginId={activePluginId}
        onTogglePlugin={handleTogglePlugin}
        remotePlugins={remotePlugins}
        onAddPlugin={handleAddRemotePlugin}
      />
    </div>
  );
}

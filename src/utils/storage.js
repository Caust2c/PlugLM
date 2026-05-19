/**
 * LocalStorage utility for PlugLM
 * Handles persistence of chats, API key, and app settings.
 */

const STORAGE_KEYS = {
  CHATS: 'pluglm_chats',
  ACTIVE_CHAT_ID: 'pluglm_active_chat_id',
  API_KEY: 'pluglm_api_key',
  MODEL: 'pluglm_model',
  SIDEBAR_COLLAPSED: 'pluglm_sidebar_collapsed',
  ACTIVE_PLUGIN: 'pluglm_active_plugin',
  REMOTE_PLUGINS: 'pluglm_remote_plugins',
};

/**
 * Safely read JSON from localStorage
 */
function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Safely write JSON to localStorage
 */
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to write to localStorage:', e);
  }
}

// --- Chats ---

export function loadChats() {
  return readJSON(STORAGE_KEYS.CHATS, []);
}

export function saveChats(chats) {
  writeJSON(STORAGE_KEYS.CHATS, chats);
}

// --- Active Chat ---

export function loadActiveChatId() {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT_ID) || null;
}

export function saveActiveChatId(id) {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT_ID, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAT_ID);
  }
}

// --- Plugins ---

export function loadActivePlugin() {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_PLUGIN) || null;
}

export function saveActivePlugin(pluginId) {
  if (pluginId) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PLUGIN, pluginId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PLUGIN);
  }
}

export function loadRemotePlugins() {
  return readJSON(STORAGE_KEYS.REMOTE_PLUGINS, []);
}

export function saveRemotePlugins(plugins) {
  writeJSON(STORAGE_KEYS.REMOTE_PLUGINS, plugins);
}

export function loadApiKey() {
  return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
}

export function saveApiKey(key) {
  if (key) {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
  } else {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
  }
}

export function loadModel() {
  return localStorage.getItem(STORAGE_KEYS.MODEL) || '';
}

export function saveModel(model) {
  if (model) {
    localStorage.setItem(STORAGE_KEYS.MODEL, model);
  } else {
    localStorage.removeItem(STORAGE_KEYS.MODEL);
  }
}

// --- Sidebar ---

export function loadSidebarCollapsed() {
  return readJSON(STORAGE_KEYS.SIDEBAR_COLLAPSED, false);
}

export function saveSidebarCollapsed(collapsed) {
  writeJSON(STORAGE_KEYS.SIDEBAR_COLLAPSED, collapsed);
}

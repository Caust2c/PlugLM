import React, { useState } from 'react';

const REQUIRED_MANIFEST_FIELDS = ['prompt', 'schema', 'renderer'];

/**
 * RemotePluginLoader – UI to load a plugin manifest from a URL.
 * It fetches the JSON manifest plus its referenced assets and reports the
 * normalized plugin object to the parent via `onAddPlugin`.
 */
function resolveAssetUrl(manifestUrl, assetPath) {
  return new URL(assetPath, manifestUrl).href;
}

async function fetchJson(url, label) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${label}: HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchText(url, label) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${label}: HTTP ${response.status}`);
  }
  return response.text();
}

async function loadRemotePlugin(manifestUrl) {
  const manifest = await fetchJson(manifestUrl, 'manifest.json');

  REQUIRED_MANIFEST_FIELDS.forEach((field) => {
    if (typeof manifest[field] !== 'string' || !manifest[field].trim()) {
      throw new Error(`Manifest is missing required field: ${field}`);
    }
  });

  const id = manifest.id || manifest.name || 'remote-plugin';
  const promptUrl = resolveAssetUrl(manifestUrl, manifest.prompt);
  const schemaUrl = resolveAssetUrl(manifestUrl, manifest.schema);
  const rendererUrl = resolveAssetUrl(manifestUrl, manifest.renderer);

  const [prompt, schema, renderer] = await Promise.all([
    fetchText(promptUrl, 'prompt.md'),
    fetchJson(schemaUrl, 'schema.json'),
    fetchText(rendererUrl, 'renderer.js'),
  ]);

  return {
    source: 'remote',
    folder: 'remote',
    id,
    name: manifest.name || id,
    description: manifest.description || '',
    version: manifest.version || '0.0.0',
    manifestUrl,
    manifest: {
      ...manifest,
      prompt: promptUrl,
      schema: schemaUrl,
      renderer: rendererUrl,
    },
    prompt,
    schema,
    renderer,
  };
}

export default function RemotePluginLoader({ onAddPlugin }) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');

  const load = async () => {
    if (!url) return;
    setStatus('Loading…');
    try {
      const plugin = await loadRemotePlugin(url);
      onAddPlugin(plugin);
      setStatus('Plugin loaded');
      setUrl('');
    } catch (e) {
      console.error(e);
      setStatus(e.message || 'Failed to load plugin');
    }
  };

  return (
    <div className="remote-plugin-loader">
      <input
        type="text"
        placeholder="Manifest JSON URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="remote-plugin-loader__input"
      />
      <button onClick={load} className="remote-plugin-loader__button">
        Load Plugin
      </button>
      {status && <div className="remote-plugin-loader__status">{status}</div>}
    </div>
  );
}

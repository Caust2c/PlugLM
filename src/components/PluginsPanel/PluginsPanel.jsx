import { X, Puzzle, Cpu } from 'lucide-react';
import RemotePluginLoader from '../../maniload/RemotePluginLoader';
import './PluginsPanel.css';

const manifestsRaw = import.meta.glob('../../plugins/*/manifest.json', { eager: true });

const PLUGINS = Object.entries(manifestsRaw).map(([path, module]) => {
  const folder = path.split('/').slice(-2, -1)[0];
  const manifest = module.default || module;
  return {
    source: 'local',
    folder,
    id: manifest.id || folder,
    name: manifest.name || folder,
    description: manifest.description || '',
    version: manifest.version || '0.0.0'
  };
});

export default function PluginsPanel({ isOpen, onClose, activePluginId, onTogglePlugin, remotePlugins = [], onAddPlugin }) {
  if (!isOpen) return null;

  const allPlugins = [...PLUGINS, ...remotePlugins].reduce((acc, plugin) => {
    acc.set(plugin.id, plugin);
    return acc;
  }, new Map());

  return (
    <div className="plugins-overlay" onClick={onClose}>
      <div className="plugins-panel" onClick={(e) => e.stopPropagation()}>
        <div className="plugins-panel__header">
          <h2 className="plugins-panel__title">
            <Puzzle size={18} />
            Plugins
          </h2>
          <button
            className="plugins-panel__close"
            onClick={onClose}
            aria-label="Close plugins"
            id="close-plugins"
          >
            <X size={18} />
          </button>
        </div>

        <p className="plugins-panel__desc">
          Extend PlugLM with powerful plugins that add new capabilities.
        </p>

        <div className="plugins-panel__list">
          {Array.from(allPlugins.values()).map((plugin) => {
            const isActive = activePluginId === plugin.id;
            return (
              <div key={plugin.id} className={`plugins-panel__item ${isActive ? 'plugins-panel__item--active' : ''}`}>
                <div className="plugins-panel__item-icon">
                  <Cpu size={20} />
                </div>
                <div className="plugins-panel__item-info">
                  <div className="plugins-panel__item-header">
                    <h3 className="plugins-panel__item-name">{plugin.name}</h3>
                    {plugin.source === 'remote' && <span className="plugins-panel__badge">Remote</span>}
                    <input 
                      type="checkbox" 
                      checked={isActive} 
                      onChange={() => onTogglePlugin(isActive ? null : plugin.id)}
                      className="plugins-panel__checkbox" 
                    />
                  </div>
                  <p className="plugins-panel__item-desc">{plugin.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        <RemotePluginLoader onAddPlugin={onAddPlugin} />
        
        <div className="plugins-panel__footer">
          <p>More plugins coming soon. Only one plugin can be active at a time.</p>
        </div>
      </div>
    </div>
  );
}

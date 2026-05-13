import {
  Plus,
  MessageSquare,
  Settings,
  Puzzle,
  PanelLeftClose,
  PanelLeft,
  Trash2,
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({
  chats,
  activeChatId,
  collapsed,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onToggleCollapse,
  onOpenSettings,
  onOpenPlugins,
}) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Top Section */}
      <div className="sidebar__top">
        <button
          className="sidebar__toggle"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle sidebar"
          id="sidebar-toggle"
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {!collapsed && (
          <button className="sidebar__new-chat" onClick={onNewChat} id="new-chat-button">
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        )}

        {collapsed && (
          <button
            className="sidebar__icon-btn"
            onClick={onNewChat}
            title="New Chat"
            aria-label="New Chat"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* Chat List */}
      {!collapsed && (
        <div className="sidebar__chats">
          <div className="sidebar__section-label">Recent Chats</div>
          <div className="sidebar__chat-list">
            {chats.length === 0 && (
              <p className="sidebar__empty">No conversations yet</p>
            )}
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`sidebar__chat-item ${chat.id === activeChatId ? 'sidebar__chat-item--active' : ''}`}
                onClick={() => onSelectChat(chat.id)}
                title={chat.title}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelectChat(chat.id)}
              >
                <MessageSquare size={14} className="sidebar__chat-icon" />
                <span className="sidebar__chat-title">{chat.title}</span>
                <button
                  className="sidebar__chat-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  title="Delete chat"
                  aria-label={`Delete ${chat.title}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Section */}
      <div className="sidebar__bottom">
        {!collapsed ? (
          <>
            <button className="sidebar__bottom-btn" onClick={onOpenPlugins} id="plugins-button">
              <Puzzle size={16} />
              <span>Plugins</span>
            </button>
            <button className="sidebar__bottom-btn" onClick={onOpenSettings} id="settings-button">
              <Settings size={16} />
              <span>Settings</span>
            </button>
          </>
        ) : (
          <>
            <button
              className="sidebar__icon-btn"
              onClick={onOpenPlugins}
              title="Plugins"
              aria-label="Plugins"
            >
              <Puzzle size={18} />
            </button>
            <button
              className="sidebar__icon-btn"
              onClick={onOpenSettings}
              title="Settings"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

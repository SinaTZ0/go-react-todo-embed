interface HeaderProps {
  connectionStatus: 'checking' | 'online' | 'offline';
  isRetrying: boolean;
  onRetryConnection: () => Promise<void>;
}

export function Header({ connectionStatus, isRetrying, onRetryConnection }: HeaderProps) {
  return (
    <header className="todo-header">
      <div>
        <h1>FlowTask</h1>
        <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '14px' }}>
          Interactive Todo Platform powered by Go, gRPC, and React
        </p>
      </div>

      <button
        className="status-badge"
        onClick={onRetryConnection}
        disabled={isRetrying}
        title="Click to retry connection to Connect-Go backend"
      >
        <span className={`status-indicator ${connectionStatus === 'online' ? 'online' : 'offline'}`} />
        <span>
          {connectionStatus === 'checking'
            ? 'Checking status...'
            : connectionStatus === 'online'
            ? 'Go RPC Server'
            : 'Local Demo'}
        </span>
        {isRetrying && (
          <svg style={{ animation: 'spin 1s linear infinite', width: '12px', height: '12px' }} viewBox="0 0 24 24">
            <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
          </svg>
        )}
      </button>
    </header>
  );
}

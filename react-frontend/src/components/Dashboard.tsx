interface DashboardProps {
  stats: {
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
  };
}

export function Dashboard({ stats }: DashboardProps) {
  return (
    <section className="dashboard-grid">
      <div className="stat-card">
        <span className="stat-label">Total Tasks</span>
        <span className="stat-value">{stats.total}</span>
        <span className="stat-sub" style={{ color: 'var(--text)' }}>
          Inbox items
        </span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Completed</span>
        <span className="stat-value" style={{ color: '#10b981' }}>
          {stats.completed}
        </span>
        <span className="stat-sub" style={{ color: '#10b981', opacity: 0.8 }}>
          Good job!
        </span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Pending</span>
        <span className="stat-value" style={{ color: 'var(--accent)' }}>
          {stats.pending}
        </span>
        <span className="stat-sub" style={{ color: 'var(--accent)', opacity: 0.8 }}>
          Awaiting action
        </span>
      </div>
      <div className="stat-card progress-card">
        <span className="stat-label">Completion</span>
        <span className="stat-value">
          {stats.completionRate}<span style={{ fontSize: '18px', fontWeight: '500' }}>%</span>
        </span>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${stats.completionRate}%` }} />
        </div>
      </div>
    </section>
  );
}


interface ControlBarProps {
  searchQuery: string;
  activeFilter: 'all' | 'active' | 'completed';
  sortOption: 'newest' | 'oldest' | 'alphabetical';
  onSearchChange: (val: string) => void;
  onFilterChange: (filter: 'all' | 'active' | 'completed') => void;
  onSortChange: (sort: 'newest' | 'oldest' | 'alphabetical') => void;
}

export function ControlBar({
  searchQuery,
  activeFilter,
  sortOption,
  onSearchChange,
  onFilterChange,
  onSortChange,
}: ControlBarProps) {
  return (
    <section className="control-bar">
      {/* Search */}
      <div className="search-wrapper">
        <span className="search-icon-left">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </span>
        <input
          type="text"
          className="search-input"
          placeholder="Search title or notes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear-btn" onClick={() => onSearchChange('')}>
            &times;
          </button>
        )}
      </div>

      {/* Filter Group */}
      <div className="filter-group">
        <button
          className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${activeFilter === 'active' ? 'active' : ''}`}
          onClick={() => onFilterChange('active')}
        >
          Active
        </button>
        <button
          className={`filter-btn ${activeFilter === 'completed' ? 'active' : ''}`}
          onClick={() => onFilterChange('completed')}
        >
          Completed
        </button>
      </div>

      {/* Sorters */}
      <div className="sort-wrapper">
        <label style={{ fontSize: '13px', color: 'var(--text)' }}>Sort:</label>
        <select
          className="sort-select"
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value as 'newest' | 'oldest' | 'alphabetical')}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>
    </section>
  );
}

import { useTodos } from './hooks/useTodos';
import { ToastList } from './components/ToastList';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TodoCreator } from './components/TodoCreator';
import { ControlBar } from './components/ControlBar';
import { TodoList } from './components/TodoList';
import { Pagination } from './components/Pagination';
import './App.css';

function App() {
  const {
    isLoading,
    connectionStatus,
    isRetrying,
    searchQuery,
    activeFilter,
    sortOption,
    currentPage,
    toasts,
    stats,
    filteredAndSortedTodos,
    paginatedTodos,
    totalPages,
    setCurrentPage,
    handleCreateTodo,
    handleToggleComplete,
    handleDeleteTodo,
    handleSaveEdit,
    handleRetryConnection,
    handleSearchChange,
    handleFilterChange,
    handleSortChange,
    removeToast,
  } = useTodos();

  return (
    <div className="todo-container">
      {/* Toast Alert Drawer */}
      <ToastList toasts={toasts} onRemoveToast={removeToast} />

      {/* Header Area */}
      <Header
        connectionStatus={connectionStatus}
        isRetrying={isRetrying}
        onRetryConnection={handleRetryConnection}
      />

      {/* Stats Dashboard */}
      <Dashboard stats={stats} />

      {/* Expandable Form Creator */}
      <TodoCreator onCreateTodo={handleCreateTodo} />

      {/* Control Bar (Filters / Sorters / Search) */}
      <ControlBar
        searchQuery={searchQuery}
        activeFilter={activeFilter}
        sortOption={sortOption}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
      />

      {/* Main Todo List */}
      <TodoList
        todos={paginatedTodos}
        isLoading={isLoading}
        searchQuery={searchQuery}
        activeFilter={activeFilter}
        onToggleComplete={handleToggleComplete}
        onDeleteTodo={handleDeleteTodo}
        onSaveEdit={handleSaveEdit}
      />

      {/* Pagination Footer */}
      {!isLoading && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredAndSortedTodos.length}
          currentPageSize={paginatedTodos.length}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Footer Info */}
      <footer style={{ marginTop: '60px', padding: '16px 0', borderTop: '1px solid var(--border)', textAlign: 'center', opacity: 0.7, fontSize: '13px' }}>
        <p>Built with ❤️ using React, ConnectRPC, TypeScript and Go</p>
      </footer>
    </div>
  );
}

export default App;

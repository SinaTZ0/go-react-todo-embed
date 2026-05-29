import { useState, useEffect, useMemo, useCallback } from 'react';
import { useClient } from '../helper/use-client';
import { TodoService, type Todo } from '../gen/todo/v1/todo_pb';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const INITIAL_LOCAL_TODOS: Todo[] = [
  {
    id: 1,
    title: '🚀 Explore Connect-RPC & Go Backend',
    description: 'Understand how the generated TypeScript code connects directly to the high-performance Go RPC microservice using h2c protocol.',
    completed: true,
    secret: 'HEHEHE',
  } as Todo,
  {
    id: 2,
    title: '💅 Craft an Ultra-Premium UI System',
    description: 'Leverage modern CSS variables, neon status indicators, stats dashboards, and elegant hover transitions to create a premium experience.',
    completed: false,
    secret: 'HEHEHE',
  } as Todo,
  {
    id: 3,
    title: '🛡️ Design a Resilient Hybrid Architecture',
    description: 'Build a seamless local fallback utilizing localStorage so the app remains fully interactive even when the Go backend is unreachable.',
    completed: false,
    secret: 'HEHEHE',
  } as Todo,
];

export function useTodos() {
  const client = useClient(TodoService);

  // Connection and Mode States
  const [mode, setMode] = useState<'rpc' | 'local'>('rpc');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isRetrying, setIsRetrying] = useState(false);

  // Todo States
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const todosPerPage = 5;

  // Toast System State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add Toast Alert Helper
  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch / Sync Todos from Server or LocalStorage
  const fetchTodos = useCallback(async (currentMode: 'rpc' | 'local') => {
    setIsLoading(true);
    if (currentMode === 'rpc') {
      try {
        const response = await client.listTodos({ limit: 100, offset: 0 });
        setTodos(response.todos);
        setConnectionStatus('online');
      } catch (err) {
        console.error('Failed to connect to ConnectRPC backend:', err);
        setConnectionStatus('offline');
        setMode('local');
        addToast('Go RPC server unreachable. Switched to Local Simulation Mode.', 'error');
        
        const localData = localStorage.getItem('antigravity_todos');
        if (localData) {
          setTodos(JSON.parse(localData));
        } else {
          setTodos(INITIAL_LOCAL_TODOS);
          localStorage.setItem('antigravity_todos', JSON.stringify(INITIAL_LOCAL_TODOS));
        }
      }
    } else {
      const localData = localStorage.getItem('antigravity_todos');
      if (localData) {
        setTodos(JSON.parse(localData));
      } else {
        setTodos(INITIAL_LOCAL_TODOS);
        localStorage.setItem('antigravity_todos', JSON.stringify(INITIAL_LOCAL_TODOS));
      }
      setConnectionStatus('offline');
    }
    setIsLoading(false);
  }, [client, addToast]);

  // Initial connection check & load
  useEffect(() => {
    const checkServer = async () => {
      try {
        await client.listTodos({ limit: 1, offset: 0 });
        setConnectionStatus('online');
        setMode('rpc');
        fetchTodos('rpc');
      } catch (e) {
        console.warn('Backend is down at start. Falling back to local.', e);
        setConnectionStatus('offline');
        setMode('local');
        fetchTodos('local');
      }
    };
    checkServer();
  }, [client, fetchTodos]);

  // Handle Manual Connection Retry
  const handleRetryConnection = async () => {
    setIsRetrying(true);
    addToast('Testing connection to Go RPC backend...', 'success');
    try {
      await client.listTodos({ limit: 1, offset: 0 });
      setConnectionStatus('online');
      setMode('rpc');
      await fetchTodos('rpc');
      addToast('Successfully connected to Go RPC Server!', 'success');
    } catch (err) {
      console.error(err);
      setConnectionStatus('offline');
      setMode('local');
      addToast('Connection failed. Remaining in Local Simulation Mode.', 'error');
    } finally {
      setIsRetrying(false);
    }
  };

  const saveLocalTodos = (updatedTodos: Todo[]) => {
    setTodos(updatedTodos);
    localStorage.setItem('antigravity_todos', JSON.stringify(updatedTodos));
  };

  // CREATE Todo Operation
  const handleCreateTodo = async (title: string, description: string): Promise<boolean> => {
    if (!title.trim()) {
      addToast('Task title cannot be empty!', 'error');
      return false;
    }
    if (title.trim().length < 3) {
      addToast('Title must be at least 3 characters.', 'error');
      return false;
    }

    try {
      if (mode === 'rpc') {
        const response = await client.createTodo({
          title: title.trim(),
          description: description.trim() || undefined,
        });
        if (response.todo) {
          setTodos((prev) => [response.todo!, ...prev]);
          addToast('Task created successfully on Go server!');
        }
      } else {
        const newLocalTodo: Todo = {
          id: Date.now(),
          title: title.trim(),
          description: description.trim(),
          completed: false,
          secret: 'LOCAL_MODE',
        } as Todo;
        saveLocalTodos([newLocalTodo, ...todos]);
        addToast('Task created locally!');
      }
      setCurrentPage(1);
      return true;
    } catch (err) {
      console.error('Create error:', err);
      addToast('Failed to create task.', 'error');
      return false;
    }
  };

  // UPDATE (Toggle completed) Operation
  const handleToggleComplete = async (todo: Todo) => {
    const nextCompleted = !todo.completed;
    const previousTodos = [...todos];
    const updated = todos.map((t) => (t.id === todo.id ? { ...t, completed: nextCompleted } : t));
    
    if (mode === 'rpc') {
      setTodos(updated);
      try {
        await client.updateTodo({
          id: todo.id,
          title: todo.title,
          description: todo.description || undefined,
          completed: nextCompleted,
        });
        addToast(nextCompleted ? 'Task completed! Keep it up 🎉' : 'Task active.');
      } catch (err) {
        console.error('Update error:', err);
        setTodos(previousTodos);
        addToast('Failed to update task on server.', 'error');
      }
    } else {
      saveLocalTodos(updated);
      addToast(nextCompleted ? 'Task completed locally! 🎉' : 'Task active.');
    }
  };

  // DELETE Todo Operation
  const handleDeleteTodo = async (id: number) => {
    const previousTodos = [...todos];
    const updated = todos.filter((t) => t.id !== id);

    if (mode === 'rpc') {
      setTodos(updated);
      try {
        await client.deleteTodo({ id });
        addToast('Task deleted successfully.');
      } catch (err) {
        console.error('Delete error:', err);
        setTodos(previousTodos);
        addToast('Failed to delete task on server.', 'error');
      }
    } else {
      saveLocalTodos(updated);
      addToast('Task deleted locally.');
    }
  };

  // SAVE Inline Edit Operation
  const handleSaveEdit = async (id: number, title: string, description: string, completed: boolean): Promise<boolean> => {
    if (!title.trim()) {
      addToast('Title cannot be empty!', 'error');
      return false;
    }

    const previousTodos = [...todos];
    const updated = todos.map((t) =>
      t.id === id ? { ...t, title: title.trim(), description: description.trim() } : t
    );

    if (mode === 'rpc') {
      setTodos(updated);
      try {
        await client.updateTodo({
          id,
          title: title.trim(),
          description: description.trim() || undefined,
          completed,
        });
        addToast('Task updated successfully.');
        return true;
      } catch (err) {
        console.error('Update error:', err);
        setTodos(previousTodos);
        addToast('Failed to update task on server.', 'error');
        return false;
      }
    } else {
      saveLocalTodos(updated);
      addToast('Task updated locally.');
      return true;
    }
  };

  // Filter / Sorters wrap methods that reset page
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleFilterChange = (filter: 'all' | 'active' | 'completed') => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: 'newest' | 'oldest' | 'alphabetical') => {
    setSortOption(sort);
    setCurrentPage(1);
  };

  // Calculations
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, completionRate };
  }, [todos]);

  const filteredAndSortedTodos = useMemo(() => {
    let result = [...todos];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    if (activeFilter === 'active') {
      result = result.filter((t) => !t.completed);
    } else if (activeFilter === 'completed') {
      result = result.filter((t) => t.completed);
    }

    result.sort((a, b) => {
      if (sortOption === 'newest') {
        return b.id - a.id;
      } else if (sortOption === 'oldest') {
        return a.id - b.id;
      } else if (sortOption === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [todos, searchQuery, activeFilter, sortOption]);

  const paginatedTodos = useMemo(() => {
    const startIndex = (currentPage - 1) * todosPerPage;
    return filteredAndSortedTodos.slice(startIndex, startIndex + todosPerPage);
  }, [filteredAndSortedTodos, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedTodos.length / todosPerPage) || 1;

  return {
    todos,
    isLoading,
    mode,
    connectionStatus,
    isRetrying,
    searchQuery,
    activeFilter,
    sortOption,
    currentPage,
    todosPerPage,
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
  };
}

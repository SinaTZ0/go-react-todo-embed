import { type Todo } from '../gen/todo/v1/todo_pb';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  isLoading: boolean;
  searchQuery: string;
  activeFilter: 'all' | 'active' | 'completed';
  onToggleComplete: (todo: Todo) => Promise<void>;
  onDeleteTodo: (id: number) => Promise<void>;
  onSaveEdit: (id: number, title: string, description: string, completed: boolean) => Promise<boolean>;
}

export function TodoList({
  todos,
  isLoading,
  searchQuery,
  activeFilter,
  onToggleComplete,
  onDeleteTodo,
  onSaveEdit,
}: TodoListProps) {
  if (isLoading) {
    return (
      <div className="todo-list-wrapper">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">✨</div>
        <h3>All clear!</h3>
        <p>
          {searchQuery
            ? 'No tasks match your search criteria. Try a different query.'
            : activeFilter === 'completed'
            ? "You haven't completed any tasks yet. Keep moving forward!"
            : activeFilter === 'active'
            ? 'Hooray! No pending tasks left to do.'
            : 'Start your day by organizing your inbox. Create your first task above!'}
        </p>
      </div>
    );
  }

  return (
    <div className="todo-list-wrapper">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggleComplete={onToggleComplete}
          onDeleteTodo={onDeleteTodo}
          onSaveEdit={onSaveEdit}
        />
      ))}
    </div>
  );
}

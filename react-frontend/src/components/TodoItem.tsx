import { useState } from 'react';
import { type Todo } from '../gen/todo/v1/todo_pb';

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (todo: Todo) => Promise<void>;
  onDeleteTodo: (id: number) => Promise<void>;
  onSaveEdit: (id: number, title: string, description: string, completed: boolean) => Promise<boolean>;
}

export function TodoItem({ todo, onToggleComplete, onDeleteTodo, onSaveEdit }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(todo.title);
  const [editingDescription, setEditingDescription] = useState(todo.description || '');

  const handleSave = async () => {
    const success = await onSaveEdit(todo.id, editingTitle, editingDescription, todo.completed);
    if (success) {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="todo-card" onClick={(e) => e.stopPropagation()}>
        <div className="edit-todo-form">
          <input
            type="text"
            className="edit-input"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            placeholder="Task Title"
          />
          <textarea
            className="edit-textarea"
            value={editingDescription}
            onChange={(e) => setEditingDescription(e.target.value)}
            placeholder="Optional notes or details..."
          />
          <div className="edit-actions">
            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`todo-card ${todo.completed ? 'completed' : ''}`}>
      <div className="todo-checkbox-container">
        <button
          className={`todo-checkbox-custom ${todo.completed ? 'checked' : ''}`}
          onClick={() => onToggleComplete(todo)}
        >
          {todo.completed && (
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </button>
      </div>

      <div className="todo-content-area" onClick={() => setIsEditing(true)}>
        <div className="todo-title-row">
          <h3 className="todo-title">{todo.title}</h3>
        </div>
        {todo.description && <p className="todo-description">{todo.description}</p>}
        <div className="todo-meta">
          <span className="todo-meta-item">
            ID: #{todo.id}
          </span>
          {todo.secret && todo.secret !== 'HEHEHE' && (
            <span className="todo-meta-item" style={{ color: 'var(--accent)' }}>
              Secret: {todo.secret}
            </span>
          )}
        </div>
      </div>

      <div className="todo-actions-area">
        <button
          className="icon-btn icon-btn-edit"
          onClick={() => setIsEditing(true)}
          title="Edit Task"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 20.013a4.5 4.5 0 01-1.897 1.13l-3.935 1.071 1.07-3.936a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
          </svg>
        </button>
        <button
          className="icon-btn icon-btn-delete"
          onClick={() => onDeleteTodo(todo.id)}
          title="Delete Task"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0M4.5 6h15" />
          </svg>
        </button>
      </div>
    </div>
  );
}

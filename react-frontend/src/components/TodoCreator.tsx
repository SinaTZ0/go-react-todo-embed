import { useState } from 'react';

interface TodoCreatorProps {
  onCreateTodo: (title: string, description: string) => Promise<boolean>;
}

export function TodoCreator({ onCreateTodo }: TodoCreatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onCreateTodo(newTitle, newDescription);
    if (success) {
      setNewTitle('');
      setNewDescription('');
      setIsExpanded(false);
    }
  };

  return (
    <section className={`creator-container ${isExpanded ? 'expanded' : ''}`}>
      <form onSubmit={handleSubmit}>
        <div className="creator-quick-input">
          <span className="creator-icon">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </span>
          <input
            type="text"
            className="creator-input"
            placeholder="What needs to be done? (Click to expand details)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onFocus={() => setIsExpanded(true)}
          />
        </div>

        <div className="creator-details">
          <textarea
            className="creator-textarea"
            placeholder="Add optional notes, links or action points..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <div className="creator-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setNewTitle('');
                setNewDescription('');
                setIsExpanded(false);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Task
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

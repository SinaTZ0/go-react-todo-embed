interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  currentPageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  currentPageSize,
  onPageChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  return (
    <section className="pagination-container">
      <div className="pagination-info">
        Showing <b>{currentPageSize}</b> of <b>{totalItems}</b> task
        {totalItems !== 1 ? 's' : ''}
      </div>
      <div className="pagination-controls">
        <button
          className="page-btn"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            className={`page-btn ${currentPage === page ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button
          className="page-btn"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </section>
  );
}

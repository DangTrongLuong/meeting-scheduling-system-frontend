
import React from "react";
import "../styles/Pagination.css";

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showFirstLast = false,
  maxButtons = 5
}) => {
  if (totalPages <= 1) return null;

  const go = (p) => {
    const safe = Math.min(Math.max(1, p), totalPages);
    onPageChange && onPageChange(safe);
  };

  // tính dải nút trang (ví dụ tối đa 5 nút)
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxButtons - 1);
  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }

  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="pagination">
      {showFirstLast && (
        <>
          <button onClick={() => go(1)} disabled={currentPage === 1}>« First</button>
          <button onClick={() => go(currentPage - 1)} disabled={currentPage === 1}>‹ Prev</button>
        </>
      )}

      {!showFirstLast && (
        <button onClick={() => go(currentPage - 1)} disabled={currentPage === 1}>‹</button>
      )}

      {start > 1 && <span className="ellipsis">…</span>}
      {pages.map(p => (
        <button
          key={p}
          className={p === currentPage ? "active" : ""}
          onClick={() => go(p)}
        >
          {p}
        </button>
      ))}
      {end < totalPages && <span className="ellipsis">…</span>}

      {!showFirstLast && (
        <button onClick={() => go(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
      )}
      {showFirstLast && (
        <>
          <button onClick={() => go(currentPage + 1)} disabled={currentPage === totalPages}>Next ›</button>
          <button onClick={() => go(totalPages)} disabled={currentPage === totalPages}>Last »</button>
        </>
      )}
    </div>
  );
};

export default Pagination;

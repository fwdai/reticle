import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  /** Current page (1-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Called when page changes */
  onPageChange: (page: number) => void;
  /** Label for items, e.g. "runs" for "Showing 1-10 of 42 runs" */
  itemLabel?: string;
}

function getVisiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [];
  const showLeft = current > 2;
  const showRight = current < total - 1;

  pages.push(1);
  if (showLeft && current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) pages.push(i);
  }

  if (showRight && current < total - 2) pages.push("ellipsis");
  if (total > 1) pages.push(total);

  return pages;
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  itemLabel = "items",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-8 w-full">
      <div className="text-xs text-text-muted font-medium">
        Showing <span className="text-text-main">{start}</span>-<span className="text-text-main">{end}</span> of{" "}
        <span className="text-text-main">{totalItems.toLocaleString()}</span> {itemLabel}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="p-1.5 rounded-lg border border-border-light text-text-muted hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex items-center gap-1">
          {visiblePages.map((p, i) =>
            p === "ellipsis" ? (
              <span key={`ellipsis-${i}`} className="px-2 text-text-muted">
                …
              </span>
            ) : (
              <button
                key={p}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${p === page
                  ? "bg-primary text-white"
                  : "text-text-muted hover:bg-slate-50"
                  }`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            )
          )}
        </div>
        <button
          className="p-1.5 rounded-lg border border-border-light text-text-muted hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}

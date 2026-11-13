import type { RefObject } from 'react';
import type { DisplayMode, EntityMeta } from '../types';
import Pagination from './Pagination';

interface Props {
  meta: EntityMeta;
  currentMode: DisplayMode;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  makeLink: (p: number) => string;
  sentinelRef: RefObject<HTMLDivElement | null>;
  itemName?: string;
}

export default function PaginationControls({
  meta,
  currentMode,
  hasMore,
  loadingMore,
  onLoadMore,
  makeLink,
  sentinelRef,
  itemName = 'kết quả',
}: Props) {
  if (meta.total === 0) return null;

  if (currentMode === 'numbered') {
    return <Pagination meta={meta} makeLink={makeLink} />;
  }

  return (
    <div className="mt-12 flex flex-col items-center justify-center gap-4">
      {currentMode === 'load_more' && (
        <>
          {hasMore ? (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-xl bg-olive px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-olive-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Đang tải thêm...</span>
                </>
              ) : (
                <>
                  <span>Xem Thêm {itemName.toUpperCase()}</span>
                  <span className="text-xs font-normal opacity-90">
                    (Trang {meta.page + 1}/{meta.totalPages})
                  </span>
                </>
              )}
            </button>
          ) : (
            <p className="rounded-full border border-sand bg-ivory px-5 py-2 text-xs font-semibold text-muted">
              ✦ Đã hiển thị tất cả {meta.total} {itemName} ✦
            </p>
          )}
        </>
      )}

      {currentMode === 'infinite' && (
        <>
          <div ref={sentinelRef} className="h-8 w-full flex items-center justify-center">
            {loadingMore && (
              <div className="inline-flex items-center gap-2 rounded-full border border-sand bg-ivory px-4 py-1.5 text-xs font-semibold text-olive">
                <svg className="h-4 w-4 animate-spin text-olive" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Đang tự động tải trang tiếp theo...</span>
              </div>
            )}
          </div>
          {!hasMore && (
            <p className="rounded-full border border-sand bg-ivory px-5 py-2 text-xs font-semibold text-muted">
              ✦ Đã cuộn hết tất cả {meta.total} {itemName} ✦
            </p>
          )}
        </>
      )}
    </div>
  );
}

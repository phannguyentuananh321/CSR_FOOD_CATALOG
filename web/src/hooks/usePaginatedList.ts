import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUserPreferences } from '../context/UserPreferencesContext';
import type { DisplayMode, EntityMeta, ListResponse } from '../types';

interface Identifiable {
  id: number;
}

interface UsePaginatedListOptions<T extends Identifiable> {
  fetchFn: (params: Record<string, string | number | number[] | undefined>) => Promise<ListResponse<T>>;
  filterParams: Record<string, string | number | number[] | undefined>;
  filterKey: string; // chuỗi đại diện cho filter (q, category, sort...) để reset khi filter đổi
}

export function usePaginatedList<T extends Identifiable>({
  fetchFn,
  filterParams,
  filterKey,
}: UsePaginatedListOptions<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { displayMode: prefMode, setDisplayMode } = useUserPreferences();

  // Xác định chế độ hiện tại: URL ghi đè preference, mặc định là preference hoặc 'numbered'
  const urlMode = searchParams.get('displayMode') as DisplayMode | null;
  const currentMode: DisplayMode =
    urlMode === 'numbered' || urlMode === 'load_more' || urlMode === 'infinite'
      ? urlMode
      : prefMode;

  const rawPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const startPage = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  const [currentPage, setCurrentPage] = useState<number>(startPage);
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<EntityMeta & { categories?: string[] }>({
    total: 0,
    page: startPage,
    pageSize: 9,
    totalPages: 1,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Theo dõi cờ nội bộ khi loadNextPage tự cập nhật URL page để tránh re-fetch lặp
  const isInternalPageChangeRef = useRef<boolean>(false);
  const prevFilterKeyRef = useRef<string>(filterKey);

  // Khi filterKey hoặc startPage đổi:
  // - Nếu filter thay đổi -> nạp lại từ đầu
  // - Nếu mở link trực tiếp ở trang N (Phương án A): nạp toàn bộ từ trang 1 đến trang N nếu là load_more/infinite, hoặc nạp đúng trang N nếu là numbered
  // - Nếu do loadNextPage chủ động cập nhật URL -> bỏ qua re-fetch
  useEffect(() => {
    let cancelled = false;
    const filterChanged = prevFilterKeyRef.current !== filterKey;
    prevFilterKeyRef.current = filterKey;

    // Nếu vừa do loadNextPage chủ động đổi URL page và filter không đổi -> bỏ qua fetch lại
    if (!filterChanged && isInternalPageChangeRef.current) {
      isInternalPageChangeRef.current = false;
      return;
    }
    isInternalPageChangeRef.current = false;

    setLoading(true);
    setError(null);
    setCurrentPage(startPage);

    const isAccumulative = currentMode === 'load_more' || currentMode === 'infinite';

    if (isAccumulative && startPage > 1) {
      // Phương án A: Khôi phục toàn bộ số món đã tải từ trang 1 đến startPage
      // Ví dụ: chia sẻ link trang 3 -> nạp đồng thời trang 1, 2, 3 và ghép đủ 27 món
      const promises = [];
      for (let p = 1; p <= startPage; p++) {
        promises.push(fetchFn({ ...filterParams, page: p }));
      }

      Promise.all(promises)
        .then((responses) => {
          if (!cancelled) {
            const allItems: T[] = [];
            const seen = new Set<number>();
            for (const res of responses) {
              for (const item of res.data) {
                if (!seen.has(item.id)) {
                  seen.add(item.id);
                  allItems.push(item);
                }
              }
            }
            const lastRes = responses[responses.length - 1];
            setItems(allItems);
            setMeta(lastRes.meta);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err?.message || 'Không thể tải dữ liệu.');
            setLoading(false);
          }
        });
    } else {
      fetchFn({ ...filterParams, page: startPage })
        .then((res) => {
          if (!cancelled) {
            setItems(res.data);
            setMeta(res.meta);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err?.message || 'Không thể tải dữ liệu.');
            setLoading(false);
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [filterKey, startPage, currentMode]);

  // Đổi chế độ hiển thị: lưu localStorage và đồng bộ lên URL param mà không mất filter
  const changeMode = (newMode: DisplayMode) => {
    setDisplayMode(newMode);
    const next = new URLSearchParams(searchParams);
    next.set('displayMode', newMode);
    setSearchParams(next);
  };

  // Tải trang tiếp theo (cho Load More và Infinite Scroll)
  const loadNextPage = useCallback(async () => {
    if (loading || loadingMore || currentPage >= meta.totalPages) return;
    setLoadingMore(true);

    const nextPage = currentPage + 1;
    try {
      const res = await fetchFn({ ...filterParams, page: nextPage });
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        const news = res.data.filter((i) => !seen.has(i.id));
        return [...prev, ...news];
      });
      setCurrentPage(nextPage);
      setMeta(res.meta);

      // Đánh dấu URL cập nhật nội bộ trước khi setSearchParams
      isInternalPageChangeRef.current = true;
      const next = new URLSearchParams(searchParams);
      next.set('page', String(nextPage));
      next.set('displayMode', currentMode);
      setSearchParams(next, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Không thể tải thêm dữ liệu.');
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, currentPage, meta.totalPages, filterParams, searchParams, currentMode]);

  // Observer cho Infinite Scroll
  useEffect(() => {
    if (currentMode !== 'infinite') return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadNextPage();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [currentMode, loadNextPage]);

  const makePageLink = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    next.set('displayMode', currentMode);
    return `?${next.toString()}`;
  };

  const hasMore = currentPage < meta.totalPages;

  return {
    items,
    meta,
    loading,
    loadingMore,
    error,
    currentMode,
    currentPage,
    hasMore,
    changeMode,
    loadNextPage,
    makePageLink,
    sentinelRef,
    retry: () => {
      setLoading(true);
      fetchFn({ ...filterParams, page: currentPage })
        .then((res) => {
          setItems(res.data);
          setMeta(res.meta);
          setLoading(false);
        })
        .catch((err) => {
          setError(err?.message || 'Không thể tải dữ liệu.');
          setLoading(false);
        });
    },
  };
}

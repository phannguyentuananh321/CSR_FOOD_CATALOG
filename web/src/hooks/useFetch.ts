import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';

type FetchState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; apiError?: ApiError }
  | { status: 'success'; data: T };

// Mỗi trang tự quản lý dữ liệu của mình: loading / lỗi kỹ thuật / thành công.
// apiError giữ nguyên lỗi nghiệp vụ (vd: NOT_FOUND) để trang hiển thị đúng trạng thái.
export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): { state: FetchState<T>; retry: () => void } {
  const [state, setState] = useState<FetchState<T>>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  // Bỏ qua kết quả của lần fetch cũ nếu deps đổi giữa chừng.
  const tokenRef = useRef(0);

  useEffect(() => {
    const token = ++tokenRef.current;
    setState({ status: 'loading' });
    fetcher()
      .then((data) => {
        if (token === tokenRef.current) setState({ status: 'success', data });
      })
      .catch((err: unknown) => {
        if (token !== tokenRef.current) return;
        if (err instanceof ApiError) {
          setState({ status: 'error', message: err.message, apiError: err });
        } else {
          setState({ status: 'error', message: 'Đã xảy ra lỗi không mong muốn.' });
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);
  return { state, retry };
}

import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-terracotta font-serif text-3xl font-bold text-white">
        404
      </div>
      <h1 className="font-serif text-3xl font-semibold text-charcoal sm:text-4xl">
        Không Tìm Thấy Trang Yêu Cầu
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
        Trang bạn đang tìm kiếm có thể đã bị đổi tên, tạm thời không khả dụng hoặc chưa từng tồn
        tại trên thực đơn của Ấm Vị.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/dishes"
          className="rounded-xl bg-olive px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark"
        >
          Về Danh Sách Món Ăn
        </Link>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-xl border border-sand-dark bg-ivory px-6 py-2.5 text-sm font-semibold text-olive transition hover:bg-sand"
        >
          Quay Lại
        </button>
      </div>
    </div>
  );
}

export function ServerErrorPage() {
  const isDev = import.meta.env.DEV;
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-terracotta font-serif text-3xl font-bold text-white">
        500
      </div>
      <h1 className="font-serif text-3xl font-semibold text-charcoal sm:text-4xl">
        Đã Xảy Ra Lỗi Hệ Thống
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
        {isDev
          ? 'Có lỗi xảy ra trong quá trình xử lý giao diện. Vui lòng thử tải lại trang.'
          : 'Hệ thống đang gặp sự cố tạm thời. Vui lòng quay lại sau ít phút.'}
      </p>
      <Link
        to="/dishes"
        className="mt-8 inline-block rounded-xl bg-olive px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark"
      >
        Về Trang Chủ
      </Link>
    </div>
  );
}

interface BoundaryState {
  hasError: boolean;
}

// Bắt lỗi render toàn cây route → hiển thị trang 500 thân thiện, không lộ stack trace.
export class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  override state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown): void {
    console.error('[web] Lỗi render:', error);
  }

  override render(): ReactNode {
    if (this.state.hasError) return <ServerErrorPage />;
    return this.props.children;
  }
}

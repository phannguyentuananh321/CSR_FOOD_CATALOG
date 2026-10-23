import type { ReactNode } from 'react';

export function LoadingBlock({ label = 'Đang tải dữ liệu...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted" role="status">
      <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-sand-dark border-t-olive" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function ErrorPanel({
  title = 'Không Tải Được Dữ Liệu',
  message = 'Hệ thống đang gặp sự cố tạm thời. Vui lòng quay lại sau ít phút.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-sand bg-ivory px-8 py-12 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-terracotta/10 text-3xl" aria-hidden="true">
        ⚠
      </div>
      <h2 className="font-serif text-2xl font-semibold text-charcoal">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-xl bg-olive px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark"
        >
          Thử Tải Lại
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon = '🔍',
  title,
  description,
  actionText,
  actionLink,
  onAction,
}: {
  icon?: string;
  title: string;
  description: string;
  actionText: string;
  actionLink?: string;
  onAction?: () => void;
}) {
  const actionClasses =
    'mt-6 inline-block rounded-xl bg-olive px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark';
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-sand-dark bg-ivory px-8 py-14 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sand text-2xl" aria-hidden="true">
        {icon}
      </div>
      <h3 className="font-serif text-2xl font-semibold text-charcoal">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
      {actionLink ? (
        <a href={actionLink} className={actionClasses}>
          {actionText}
        </a>
      ) : onAction ? (
        <button type="button" onClick={onAction} className={actionClasses}>
          {actionText}
        </button>
      ) : null}
    </div>
  );
}

export function NotFoundPanel({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-terracotta font-serif text-3xl font-bold text-white">
        404
      </div>
      <h1 className="font-serif text-3xl font-semibold text-charcoal sm:text-4xl">{title}</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
        {children ??
          'Trang bạn đang tìm kiếm có thể đã bị đổi tên, tạm thời không khả dụng hoặc chưa từng tồn tại trên thực đơn của Ấm Vị.'}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href="/dishes"
          className="rounded-xl bg-olive px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark"
        >
          Về Danh Sách Món Ăn
        </a>
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

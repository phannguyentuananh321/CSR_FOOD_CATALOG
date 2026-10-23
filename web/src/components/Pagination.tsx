import { Link } from 'react-router-dom';
import type { EntityMeta } from '../types';

interface Props {
  meta: EntityMeta;
  // Tạo URL giữ nguyên bộ lọc hiện tại, chỉ đổi page.
  makeLink: (page: number) => string;
}

const range = (page: number, totalPages: number): number[] => {
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  const s = Math.max(1, end - 4);
  const pages: number[] = [];
  for (let i = s; i <= end; i += 1) pages.push(i);
  return pages;
};

export default function Pagination({ meta, makeLink }: Props) {
  if (meta.totalPages <= 1) return null;

  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  const to = Math.min(meta.total, meta.page * meta.pageSize);
  const pages = range(meta.page, meta.totalPages);

  const btn =
    'inline-flex h-10 min-w-10 items-center justify-center border border-sand bg-ivory px-3 text-sm font-semibold text-olive transition first:rounded-l-xl last:rounded-r-xl hover:bg-sand/60';
  const disabledBtn =
    'inline-flex h-10 min-w-10 cursor-not-allowed items-center justify-center border border-sand bg-ivory px-3 text-sm font-medium text-disabled first:rounded-l-xl last:rounded-r-xl';

  return (
    <div className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
      <p className="text-sm text-muted">
        Hiển thị <strong className="text-charcoal">{from}</strong> -{' '}
        <strong className="text-charcoal">{to}</strong> trong{' '}
        <strong className="text-charcoal">{meta.total}</strong> kết quả
      </p>
      <nav aria-label="Phân trang" className="flex">
        {meta.page <= 1 ? (
          <span className={disabledBtn} aria-disabled="true">
            « Trước
          </span>
        ) : (
          <Link className={btn} to={makeLink(meta.page - 1)}>
            « Trước
          </Link>
        )}
        {pages.map((p) =>
          p === meta.page ? (
            <span
              key={p}
              aria-current="page"
              className="inline-flex h-10 min-w-10 items-center justify-center border border-olive bg-olive px-3 text-sm font-bold text-white"
            >
              {p}
            </span>
          ) : (
            <Link key={p} className={btn} to={makeLink(p)}>
              {p}
            </Link>
          )
        )}
        {meta.page >= meta.totalPages ? (
          <span className={disabledBtn} aria-disabled="true">
            Sau »
          </span>
        ) : (
          <Link className={btn} to={makeLink(meta.page + 1)}>
            Sau »
          </Link>
        )}
      </nav>
    </div>
  );
}

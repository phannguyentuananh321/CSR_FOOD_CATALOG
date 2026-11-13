import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import BookmarkButton from '../../components/BookmarkButton';
import EntityImage from '../../components/EntityImage';
import ShareButton from '../../components/ShareButton';
import { DishMiniCard } from '../../components/cards';
import { ErrorPanel, LoadingBlock, NotFoundPanel } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import { DEFAULT_CHEF_DESCRIPTION, entityCode, formatDate } from '../../utils/format';

export default function ChefDetailPage() {
  const { id } = useParams<{ id: string }>();
  const chefId = Number(id);
  const invalidId = !Number.isInteger(chefId) || chefId <= 0;

  const { state, retry } = useFetch(() => api.chefs.detail(chefId), [id]);

  if (invalidId) return <NotFoundPanel title="Không Tìm Thấy Đầu Bếp" />;
  if (state.status === 'loading') return <LoadingBlock label="Đang tải hồ sơ đầu bếp..." />;
  if (state.status === 'error') {
    if (state.apiError?.code === 'NOT_FOUND') return <NotFoundPanel title="Không Tìm Thấy Đầu Bếp" />;
    return (
      <div className="mx-auto max-w-[1024px] px-4 py-10">
        <ErrorPanel message={state.message} onRetry={retry} />
      </div>
    );
  }

  const chef = state.data;
  const dishes = chef.dishes ?? [];

  return (
    <div className="mx-auto max-w-[1024px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/chefs" className="text-sm font-semibold text-olive underline-offset-4 hover:underline">
          ← Quay lại Danh Sách Đầu Bếp
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <BookmarkButton type="chefs" id={chef.id} showText />
          <ShareButton />
          <Link
            to={`/admin/chefs/${chef.id}/edit`}
            className="text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
          >
            ✎ Quản trị đầu bếp này
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="relative">
          <EntityImage src={chef.imagePath} alt={chef.name} className="rounded-2xl" eager />
          {chef.isFeatured && (
            <span className="absolute left-4 top-4 rounded-full bg-olive px-4 py-1.5 text-xs font-bold text-white shadow">
              ★ Bếp Trưởng Danh Tiếng
            </span>
          )}
        </div>
        <div>
          <p className="inline-block rounded-full bg-sand px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-terracotta">
            {chef.title?.trim() || 'Đầu Bếp'}
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-charcoal sm:text-4xl">{chef.name}</h1>
          {chef.experience?.trim() && (
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-muted">
              <span aria-hidden="true">🕒</span> Kinh nghiệm: {chef.experience}
            </p>
          )}
          <hr className="my-6 border-olive/30" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal">Tiểu Sử & Triết Lý Ẩm Thực</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            {chef.description?.trim() || DEFAULT_CHEF_DESCRIPTION}
          </p>
          <div className="mt-6 space-y-2 text-sm">
            <p>
              <span className="font-semibold text-charcoal">Mã đầu bếp:</span>{' '}
              <span className="text-muted">{entityCode('chef', chef.id)}</span>
            </p>
            <p>
              <span className="font-semibold text-charcoal">Cập nhật:</span>{' '}
              <span className="text-muted">{formatDate(chef.updatedAt)}</span>
            </p>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-semibold text-charcoal">
          🍽 Món Ăn Có Thể Chế Biến ({dishes.length})
        </h2>
        {dishes.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-sand-dark bg-ivory px-4 py-8 text-center text-sm text-muted">
            Đầu bếp này chưa được gán vào món ăn nào.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {dishes.map((dish) => (
              <DishMiniCard key={dish.id} dish={dish} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

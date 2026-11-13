import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import BookmarkButton from '../../components/BookmarkButton';
import EntityImage from '../../components/EntityImage';
import ShareButton from '../../components/ShareButton';
import { DishMiniCard } from '../../components/cards';
import { ErrorPanel, LoadingBlock, NotFoundPanel } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import { DEFAULT_INGREDIENT_DESCRIPTION, entityCode, formatDate } from '../../utils/format';

export default function IngredientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ingredientId = Number(id);
  const invalidId = !Number.isInteger(ingredientId) || ingredientId <= 0;

  const { state, retry } = useFetch(() => api.ingredients.detail(ingredientId), [id]);

  if (invalidId) return <NotFoundPanel title="Không Tìm Thấy Nguyên Liệu" />;
  if (state.status === 'loading') return <LoadingBlock label="Đang tải thông tin nguyên liệu..." />;
  if (state.status === 'error') {
    if (state.apiError?.code === 'NOT_FOUND') {
      return <NotFoundPanel title="Không Tìm Thấy Nguyên Liệu" />;
    }
    return (
      <div className="mx-auto max-w-[1024px] px-4 py-10">
        <ErrorPanel message={state.message} onRetry={retry} />
      </div>
    );
  }

  const ingredient = state.data;
  const dishes = ingredient.dishes ?? [];

  return (
    <div className="mx-auto max-w-[1024px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/ingredients"
          className="text-sm font-semibold text-olive underline-offset-4 hover:underline"
        >
          ← Quay lại Danh Sách Nguyên Liệu
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <BookmarkButton type="ingredients" id={ingredient.id} showText />
          <ShareButton />
          <Link
            to={`/admin/ingredients/${ingredient.id}/edit`}
            className="text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
          >
            ✎ Quản trị nguyên liệu này
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <EntityImage src={ingredient.imagePath} alt={ingredient.name} className="rounded-2xl" eager />
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-sand px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-terracotta">
              {ingredient.category?.trim() || 'Gia vị truyền thống'}
            </span>
            {ingredient.unit?.trim() && (
              <span className="rounded-full border border-sand-dark bg-ivory px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-olive">
                Quy cách: {ingredient.unit}
              </span>
            )}
          </div>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-charcoal sm:text-4xl">
            {ingredient.name}
          </h1>
          <hr className="my-6 border-olive/30" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal">Đặc Tính & Nguồn Gốc</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            {ingredient.description?.trim() || DEFAULT_INGREDIENT_DESCRIPTION}
          </p>
          <div className="mt-6 space-y-2 text-sm">
            <p>
              <span className="font-semibold text-charcoal">Mã nguyên liệu:</span>{' '}
              <span className="text-muted">{entityCode('ingredient', ingredient.id)}</span>
            </p>
            <p>
              <span className="font-semibold text-charcoal">Cập nhật:</span>{' '}
              <span className="text-muted">{formatDate(ingredient.updatedAt)}</span>
            </p>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-semibold text-charcoal">
          🍽 Món Ăn Sử Dụng Nguyên Liệu Này ({dishes.length})
        </h2>
        {dishes.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-sand-dark bg-ivory px-4 py-8 text-center text-sm text-muted">
            Nguyên liệu này chưa được dùng trong món ăn nào.
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

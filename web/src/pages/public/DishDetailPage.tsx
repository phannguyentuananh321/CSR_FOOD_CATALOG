import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import EntityImage from '../../components/EntityImage';
import { ErrorPanel, LoadingBlock, NotFoundPanel } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import type { Dish } from '../../types';
import { DEFAULT_DISH_DESCRIPTION, entityCode, formatDate, formatPrice } from '../../utils/format';

export default function DishDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dishId = Number(id);
  const invalidId = !Number.isInteger(dishId) || dishId <= 0;

  const { state, retry } = useFetch<Dish>(() => api.dishes.detail(dishId), [id]);

  if (invalidId) return <NotFoundPanel title="Không Tìm Thấy Món Ăn" />;
  if (state.status === 'loading') return <LoadingBlock label="Đang tải thông tin món ăn..." />;
  if (state.status === 'error') {
    if (state.apiError?.code === 'NOT_FOUND') {
      return <NotFoundPanel title="Không Tìm Thấy Món Ăn" />;
    }
    return (
      <div className="mx-auto max-w-[1024px] px-4 py-10">
        <ErrorPanel message={state.message} onRetry={retry} />
      </div>
    );
  }

  const dish = state.data;
  const ingredients = dish.ingredients ?? [];
  const chefs = dish.chefs ?? [];

  return (
    <div className="mx-auto max-w-[1024px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/dishes" className="text-sm font-semibold text-olive underline-offset-4 hover:underline">
          ← Quay lại Danh Sách Thực Đơn
        </Link>
        <Link
          to={`/admin/dishes/${dish.id}/edit`}
          className="text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
        >
          ✎ Quản trị món này
        </Link>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="relative">
          <EntityImage src={dish.imagePath} alt={dish.name} className="rounded-2xl" eager />
          {dish.isFeatured && (
            <span className="absolute left-4 top-4 rounded-full bg-terracotta px-4 py-1.5 text-xs font-bold text-white shadow">
              ★ Món Nổi Bật Tuyển Chọn
            </span>
          )}
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-terracotta">{dish.category}</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-charcoal sm:text-4xl">{dish.name}</h1>
          <p className="mt-3 font-serif text-3xl font-bold text-olive">
            {dish.price > 0 ? formatPrice(dish.price) : 'Liên hệ'}
          </p>
          <hr className="my-6 border-olive/30" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal">Câu Chuyện & Hương Vị</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            {dish.description?.trim() || DEFAULT_DISH_DESCRIPTION}
          </p>
          <div className="mt-6 space-y-2 text-sm">
            <p>
              <span className="font-semibold text-charcoal">Mã món:</span>{' '}
              <span className="text-muted">{entityCode('dish', dish.id)}</span>
            </p>
            <p>
              <span className="font-semibold text-charcoal">Cập nhật:</span>{' '}
              <span className="text-muted">{formatDate(dish.updatedAt)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-sand bg-ivory p-6">
          <h2 className="font-serif text-xl font-semibold text-charcoal">🥬 Nguyên Liệu ({ingredients.length})</h2>
          {ingredients.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-sand-dark bg-cream px-4 py-6 text-center text-sm text-muted">
              Chưa cập nhật nguyên liệu cho món ăn này.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {ingredients.map((ingredient) => (
                <li key={ingredient.id}>
                  <Link
                    to={`/ingredients/${ingredient.id}`}
                    className="flex items-center gap-4 rounded-xl border border-sand p-3 transition hover:bg-cream"
                  >
                    <EntityImage src={ingredient.imagePath} alt={ingredient.name} className="w-20 rounded-lg" />
                    <span>
                      <span className="block font-semibold text-charcoal">{ingredient.name}</span>
                      <span className="block text-xs text-muted">
                        {ingredient.category?.trim() || 'Gia vị'} • {ingredient.unit?.trim() || 'gram'}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-sand bg-ivory p-6">
          <h2 className="font-serif text-xl font-semibold text-charcoal">👨‍🍳 Đầu Bếp Có Thể Chế Biến ({chefs.length})</h2>
          {chefs.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-sand-dark bg-cream px-4 py-6 text-center text-sm text-muted">
              Chưa cập nhật đầu bếp cho món ăn này.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {chefs.map((chef) => (
                <li key={chef.id}>
                  <Link
                    to={`/chefs/${chef.id}`}
                    className="flex items-center gap-4 rounded-xl border border-sand p-3 transition hover:bg-cream"
                  >
                    <EntityImage src={chef.imagePath} alt={chef.name} className="w-20 rounded-lg" />
                    <span>
                      <span className="block font-semibold text-charcoal">{chef.name}</span>
                      <span className="block text-xs text-muted">
                        {chef.title?.trim() || 'Đầu Bếp'}
                        {chef.experience?.trim() ? ` • ${chef.experience}` : ''}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

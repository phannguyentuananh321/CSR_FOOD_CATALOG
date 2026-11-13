import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { ChefCard, DishCard, IngredientCard } from '../../components/cards';
import ShareButton from '../../components/ShareButton';
import { EmptyState, LoadingBlock } from '../../components/States';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import type { BookmarkResourceType, Chef, Dish, Ingredient } from '../../types';

export default function BookmarksPage() {
  const { bookmarks, removeBookmark, clearBookmarks } = useUserPreferences();
  const [activeTab, setActiveTab] = useState<BookmarkResourceType>('dishes');

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        if (bookmarks.dishes.length > 0) {
          const res = await api.dishes.list({ ids: bookmarks.dishes, limit: 50 });
          if (!isCancelled) {
            setDishes(res.data);
            // Dọn sạch các ID đã bị xoá khỏi database
            const validIds = new Set(res.data.map((d) => d.id));
            bookmarks.dishes.forEach((id) => {
              if (!validIds.has(id)) removeBookmark('dishes', id);
            });
          }
        } else if (!isCancelled) {
          setDishes([]);
        }

        if (bookmarks.chefs.length > 0) {
          const res = await api.chefs.list({ ids: bookmarks.chefs, limit: 50 });
          if (!isCancelled) {
            setChefs(res.data);
            const validIds = new Set(res.data.map((c) => c.id));
            bookmarks.chefs.forEach((id) => {
              if (!validIds.has(id)) removeBookmark('chefs', id);
            });
          }
        } else if (!isCancelled) {
          setChefs([]);
        }

        if (bookmarks.ingredients.length > 0) {
          const res = await api.ingredients.list({ ids: bookmarks.ingredients, limit: 50 });
          if (!isCancelled) {
            setIngredients(res.data);
            const validIds = new Set(res.data.map((i) => i.id));
            bookmarks.ingredients.forEach((id) => {
              if (!validIds.has(id)) removeBookmark('ingredients', id);
            });
          }
        } else if (!isCancelled) {
          setIngredients([]);
        }
      } catch {
        // lỗi tải bookmarks
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [bookmarks.dishes.length, bookmarks.chefs.length, bookmarks.ingredients.length]);

  const tabs: { key: BookmarkResourceType; label: string; count: number }[] = [
    { key: 'dishes', label: 'Món Ăn', count: bookmarks.dishes.length },
    { key: 'chefs', label: 'Đầu Bếp', count: bookmarks.chefs.length },
    { key: 'ingredients', label: 'Nguyên Liệu', count: bookmarks.ingredients.length },
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-sand pb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-terracotta">
            Bộ Sưu Tập Của Bạn
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-charcoal sm:text-4xl">
            Mục Đã Lưu & Yêu Thích
          </h1>
          <p className="mt-2 text-sm text-muted">
            Danh sách món ăn, đầu bếp và nguyên liệu bạn đã đánh dấu để tham khảo nhanh.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ShareButton label="Chia sẻ danh sách lưu" />
          {(bookmarks.dishes.length > 0 || bookmarks.chefs.length > 0 || bookmarks.ingredients.length > 0) && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn xóa tất cả mục đã lưu không?')) {
                  clearBookmarks();
                }
              }}
              className="rounded-xl border border-sand-dark bg-ivory px-3.5 py-2 text-xs font-semibold text-terracotta transition hover:bg-terracotta/10"
            >
              Xóa tất cả
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-2 border-b border-sand">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
                active
                  ? 'border-olive text-olive-dark'
                  : 'border-transparent text-muted hover:border-sand-dark hover:text-charcoal'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  active ? 'bg-olive text-white' : 'bg-sand text-charcoal'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mt-8">
        {loading && <LoadingBlock label="Đang tải các mục đã lưu..." />}

        {!loading && activeTab === 'dishes' && (
          <>
            {dishes.length === 0 ? (
              <EmptyState
                title="Chưa Có Món Ăn Nào Được Lưu"
                description="Bạn chưa lưu món ăn nào vào danh sách yêu thích. Khám phá thực đơn và nhấn biểu tượng bookmark để lưu lại nhé!"
                actionText="Khám Phá Thực Đơn"
                actionLink="/dishes"
              />
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {dishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </div>
            )}
          </>
        )}

        {!loading && activeTab === 'chefs' && (
          <>
            {chefs.length === 0 ? (
              <EmptyState
                title="Chưa Có Đầu Bếp Nào Được Lưu"
                description="Bạn chưa lưu đầu bếp nào. Ghé thăm trang đầu bếp để tìm hiểu thêm về các nghệ nhân ẩm thực của Ấm Vị!"
                actionText="Xem Danh Sách Đầu Bếp"
                actionLink="/chefs"
              />
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {chefs.map((chef) => (
                  <ChefCard key={chef.id} chef={chef} />
                ))}
              </div>
            )}
          </>
        )}

        {!loading && activeTab === 'ingredients' && (
          <>
            {ingredients.length === 0 ? (
              <EmptyState
                title="Chưa Có Nguyên Liệu Nào Được Lưu"
                description="Bạn chưa lưu nguyên liệu nào. Khám phá các nguyên liệu tươi sạch bản địa và lưu lại công thức yêu thích nhé!"
                actionText="Xem Danh Sách Nguyên Liệu"
                actionLink="/ingredients"
              />
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {ingredients.map((ingredient) => (
                  <IngredientCard key={ingredient.id} ingredient={ingredient} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Back to Home */}
      <div className="mt-12 text-center">
        <Link
          to="/dishes"
          className="text-sm font-semibold text-olive underline-offset-4 hover:underline"
        >
          ← Quay lại trang chủ thực đơn
        </Link>
      </div>
    </div>
  );
}

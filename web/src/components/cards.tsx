import { Link } from 'react-router-dom';
import type { Chef, Dish, DishBrief, Ingredient } from '../types';
import { DEFAULT_CHEF_DESCRIPTION, DEFAULT_DISH_DESCRIPTION, DEFAULT_INGREDIENT_DESCRIPTION, formatPrice } from '../utils/format';
import BookmarkButton from './BookmarkButton';
import EntityImage from './EntityImage';

export function DishCard({ dish }: { dish: Dish }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-sand bg-ivory transition duration-300 hover:shadow-md">
      <div className="relative">
        <EntityImage
          src={dish.imagePath}
          alt={dish.name}
          className="transition duration-500 group-hover:scale-105"
        />
        {dish.isFeatured && (
          <span className="absolute left-3 top-3 rounded-full bg-terracotta px-3 py-1 text-[11px] font-bold text-white shadow-sm">
            ★ Tuyển chọn
          </span>
        )}
        <div className="absolute right-3 top-3 z-10">
          <BookmarkButton type="dishes" id={dish.id} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-terracotta">
          {dish.category}
        </p>
        <h3 className="mt-1.5 font-serif text-lg font-semibold leading-snug text-charcoal transition group-hover:text-olive line-clamp-2">
          <Link to={`/dishes/${dish.id}`}>{dish.name}</Link>
        </h3>
        <p className="mt-1.5 text-sm font-bold text-olive">
          {dish.price > 0 ? formatPrice(dish.price) : 'Liên hệ'}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-2">
          {dish.description?.trim() || DEFAULT_DISH_DESCRIPTION}
        </p>
        <div className="mt-4 pt-1">
          <Link
            to={`/dishes/${dish.id}`}
            className="text-sm font-semibold text-olive underline-offset-4 transition hover:underline"
          >
            Xem Chi Tiết Món Ăn »
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ChefCard({ chef }: { chef: Chef }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-sand bg-ivory transition duration-300 hover:shadow-md">
      <div className="relative">
        <EntityImage
          src={chef.imagePath}
          alt={chef.name}
          className="transition duration-500 group-hover:scale-105"
        />
        {chef.isFeatured && (
          <span className="absolute left-3 top-3 rounded-full bg-olive px-3 py-1 text-[11px] font-bold text-white shadow-sm">
            ★ Bếp trưởng tiêu biểu
          </span>
        )}
        <div className="absolute right-3 top-3 z-10">
          <BookmarkButton type="chefs" id={chef.id} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-terracotta">
          {chef.title?.trim() || 'Nghệ nhân Ẩm thực'}
        </p>
        <h3 className="mt-1.5 font-serif text-lg font-semibold leading-snug text-charcoal transition group-hover:text-olive">
          <Link to={`/chefs/${chef.id}`}>{chef.name}</Link>
        </h3>
        {chef.experience?.trim() && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-muted">
            <span aria-hidden="true">🕒</span> {chef.experience}
          </p>
        )}
        <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-3">
          {chef.description?.trim() || DEFAULT_CHEF_DESCRIPTION}
        </p>
        <div className="mt-4 pt-1">
          <Link
            to={`/chefs/${chef.id}`}
            className="text-sm font-semibold text-olive underline-offset-4 transition hover:underline"
          >
            Xem Tiểu Sử & Triết Lý »
          </Link>
        </div>
      </div>
    </article>
  );
}

export function IngredientCard({ ingredient }: { ingredient: Ingredient }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-sand bg-ivory transition duration-300 hover:shadow-md">
      <div className="relative">
        <EntityImage
          src={ingredient.imagePath}
          alt={ingredient.name}
          className="transition duration-500 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3 z-10">
          <BookmarkButton type="ingredients" id={ingredient.id} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-terracotta">
            {ingredient.category?.trim() || 'Gia vị'}
          </p>
          {ingredient.unit?.trim() && (
            <span className="rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-semibold text-muted">
              Đơn vị: {ingredient.unit}
            </span>
          )}
        </div>
        <h3 className="mt-1.5 font-serif text-lg font-semibold leading-snug text-charcoal transition group-hover:text-olive">
          <Link to={`/ingredients/${ingredient.id}`}>{ingredient.name}</Link>
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-3">
          {ingredient.description?.trim() || DEFAULT_INGREDIENT_DESCRIPTION}
        </p>
        <div className="mt-4 pt-1">
          <Link
            to={`/ingredients/${ingredient.id}`}
            className="text-sm font-semibold text-olive underline-offset-4 transition hover:underline"
          >
            Xem Chi Tiết Nguyên Liệu »
          </Link>
        </div>
      </div>
    </article>
  );
}

export function DishMiniCard({ dish }: { dish: DishBrief }) {
  return (
    <Link
      to={`/dishes/${dish.id}`}
      className="group block overflow-hidden rounded-2xl border border-sand bg-ivory transition duration-300 hover:shadow-md"
    >
      <EntityImage
        src={dish.imagePath}
        alt={dish.name}
        className="transition duration-500 group-hover:scale-105"
      />
      <div className="p-4">
        <h4 className="font-serif text-base font-semibold text-charcoal transition group-hover:text-olive line-clamp-2">
          {dish.name}
        </h4>
        <p className="mt-1 text-sm font-bold text-olive">
          {dish.price > 0 ? formatPrice(dish.price) : 'Liên hệ'}
        </p>
      </div>
    </Link>
  );
}

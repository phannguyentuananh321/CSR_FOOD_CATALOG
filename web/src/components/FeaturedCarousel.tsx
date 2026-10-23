import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Dish } from '../types';
import { formatPriceHero } from '../utils/format';
import EntityImage from './EntityImage';

// Carousel món nổi bật: tối đa 4 món (API đã giới hạn), nhảy slide bằng nút tròn đánh số.
export default function FeaturedCarousel({ dishes }: { dishes: Dish[] }) {
  const [index, setIndex] = useState(0);
  if (dishes.length === 0) return null;

  const current = dishes[Math.min(index, dishes.length - 1)];
  const shortDescription = (current.description || '').trim().split('\n')[0];

  return (
    <div className="rounded-3xl border border-sand bg-ivory/90 p-4 shadow-sm backdrop-blur-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-charcoal">
          Món Nổi Bật Được Yêu Thích
        </h2>
        <span className="rounded-full bg-sand px-3 py-1 text-xs font-bold text-olive">
          {dishes.length} món tuyển chọn
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl">
        <EntityImage src={current.imagePath} alt={current.name} />
      </div>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-terracotta">
        {current.category}
      </p>
      <h3 className="mt-1 font-serif text-xl font-semibold text-charcoal line-clamp-1">
        {current.name}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-muted line-clamp-2">
        {shortDescription || 'Món ăn mang đậm phong vị Việt Nam, được chế biến từ nguyên liệu tươi ngon chọn lọc.'}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <p className="font-serif text-2xl font-bold text-olive">
          {current.price > 0 ? formatPriceHero(current.price) : 'Liên hệ'}
        </p>
        <Link
          to={`/dishes/${current.id}`}
          className="rounded-xl bg-olive px-4 py-2 text-sm font-semibold text-white transition hover:bg-olive-dark"
        >
          Chi tiết »
        </Link>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {dishes.map((dish, i) => (
          <button
            key={dish.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Xem món ${dish.name}`}
            aria-current={i === index}
            className={`h-3 w-3 rounded-full text-[10px] font-bold leading-none transition ${
              i === index ? 'bg-olive text-white' : 'bg-sand-dark text-muted hover:bg-sand'
            }`}
          >
            <span className="sr-only">{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

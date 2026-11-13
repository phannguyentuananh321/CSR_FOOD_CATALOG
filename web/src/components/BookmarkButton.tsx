import type { MouseEvent } from 'react';
import { useUserPreferences } from '../context/UserPreferencesContext';
import type { BookmarkResourceType } from '../types';

interface BookmarkButtonProps {
  type: BookmarkResourceType;
  id: number;
  showText?: boolean;
  className?: string;
}

export default function BookmarkButton({
  type,
  id,
  showText = false,
  className = '',
}: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useUserPreferences();
  const active = isBookmarked(type, id);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(type, id);
  };

  const label = active ? 'Bỏ lưu mục này' : 'Lưu vào danh sách';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={`group inline-flex items-center gap-1.5 rounded-full transition-transform active:scale-90 ${
        showText
          ? active
            ? 'border border-terracotta bg-terracotta/10 px-3 py-1.5 text-xs font-semibold text-terracotta'
            : 'border border-sand-dark bg-ivory px-3 py-1.5 text-xs font-semibold text-charcoal hover:border-terracotta hover:text-terracotta'
          : active
          ? 'bg-ivory/90 p-2 text-terracotta shadow-sm hover:scale-105'
          : 'bg-ivory/90 p-2 text-muted shadow-sm hover:scale-105 hover:text-terracotta'
      } ${className}`}
    >
      <svg
        className={`h-4 w-4 transition-colors ${
          active ? 'fill-terracotta stroke-terracotta' : 'fill-none stroke-current stroke-2'
        }`}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      {showText && <span>{active ? 'Đã lưu' : 'Lưu lại'}</span>}
    </button>
  );
}

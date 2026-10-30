import type { DisplayMode } from '../types';

interface Props {
  currentMode: DisplayMode;
  onModeChange: (mode: DisplayMode) => void;
}

const MODES: { value: DisplayMode; label: string; icon: string }[] = [
  { value: 'numbered', label: 'Trang số', icon: '🔢' },
  { value: 'load_more', label: 'Xem thêm', icon: '⏬' },
  { value: 'infinite', label: 'Cuộn vô tận', icon: '♾️' },
];

export default function PaginationModeSelector({ currentMode, onModeChange }: Props) {
  return (
    <div className="inline-flex items-center rounded-xl border border-sand bg-ivory p-1 text-xs font-semibold text-charcoal shadow-xs">
      <span className="px-2.5 text-muted hidden sm:inline">Chế độ hiển thị:</span>
      <div className="flex gap-1" role="radiogroup" aria-label="Chế độ phân trang">
        {MODES.map((m) => {
          const active = currentMode === m.value;
          return (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onModeChange(m.value)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                active
                  ? 'bg-olive text-white shadow-xs'
                  : 'text-charcoal hover:bg-sand/60'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

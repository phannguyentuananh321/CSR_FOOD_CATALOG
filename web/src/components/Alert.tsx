interface Props {
  type: 'success' | 'error';
  text: string;
  onClose?: () => void;
}

export default function Alert({ type, text, onClose }: Props) {
  const styles =
    type === 'success'
      ? 'border-olive bg-olive/10 text-olive'
      : 'border-terracotta bg-terracotta/10 text-terracotta-dark';
  const icon =
    type === 'success' ? (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ) : (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M8.5 2.9c.7-1.2 2.3-1.2 3 0l6 10.4c.7 1.2-.2 2.7-1.5 2.7H4c-1.3 0-2.2-1.5-1.5-2.7l6-10.4zM10 7a1 1 0 011 1v3a1 1 0 11-2 0V8a1 1 0 011-1zm0 8a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4z"
          clipRule="evenodd"
        />
      </svg>
    );

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${styles}`}
    >
      {icon}
      <span className="flex-1 leading-relaxed">{text}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông báo"
          className="shrink-0 rounded-md px-1 opacity-70 transition hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  );
}

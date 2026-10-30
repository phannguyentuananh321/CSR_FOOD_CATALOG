import { useState } from 'react';

interface ShareButtonProps {
  className?: string;
  label?: string;
}

export default function ShareButton({
  className = '',
  label = 'Chia sẻ trang này',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback nếu clipboard API bị chặn
      const el = document.createElement('input');
      el.value = window.location.href;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Sao chép liên kết trang hiện tại"
      aria-label="Sao chép liên kết chia sẻ"
      className={`inline-flex items-center gap-2 rounded-xl border border-sand-dark bg-ivory px-3.5 py-2 text-xs font-semibold transition hover:bg-sand/60 ${
        copied ? 'border-olive bg-olive/10 text-olive-dark' : 'text-charcoal'
      } ${className}`}
    >
      {copied ? (
        <>
          <svg className="h-4 w-4 text-olive" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Đã sao chép liên kết!</span>
        </>
      ) : (
        <>
          <svg className="h-4 w-4 text-muted" viewBox="0 0 20 20" fill="currentColor">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

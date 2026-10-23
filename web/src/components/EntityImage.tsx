import { useState } from 'react';

interface Props {
  src: string | null | undefined;
  alt: string;
  className?: string;
  eager?: boolean;
}

// Ảnh giữ tỉ lệ 4:3; lỗi hoặc rỗng → placeholder, không vỡ layout.
export default function EntityImage({ src, alt, className = '', eager = false }: Props) {
  const [failed, setFailed] = useState(false);
  const usable = src && !failed ? src : '/images/placeholder.svg';

  return (
    <div className={`relative aspect-[4/3] overflow-hidden bg-sand ${className}`}>
      <img
        src={usable}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}

import { useEffect, useRef } from 'react';
import type { VantaEffect } from 'vanta/dist/vanta.birds.min';

// Nền động Vanta Birds cho hero trang công khai.
// - Canvas nằm sau nội dung và không bắt sự kiện chuột (pointer-events: none).
// - Tôn trọng prefers-reduced-motion: chỉ hiển thị nền gradient tĩnh.
// - Nếu WebGL/thư viện lỗi, nền gradient tĩnh vẫn còn nên bố cục không bị vỡ.
// - Hủy hiệu ứng khi unmount hoặc khi người dùng bật giảm chuyển động.
export default function VantaBirdsBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let effect: VantaEffect | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let disposed = false;
    let generation = 0;

    const destroy = () => {
      generation += 1;
      resizeObserver?.disconnect();
      resizeObserver = null;
      effect?.destroy();
      effect = null;
    };

    const start = async () => {
      const run = ++generation;
      try {
        const [{ default: BIRDS }, THREE] = await Promise.all([
          import('vanta/dist/vanta.birds.min'),
          import('three'),
        ]);
        if (disposed || run !== generation || reducedMotion.matches) return;

        effect = BIRDS({
          el: container,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
          scale: 1,
          scaleMobile: 1,
          backgroundColor: 0xfaf5ec,
          color1: 0x354b35,
          color2: 0xb86f45,
          colorMode: 'variance',
          birdSize: 1.1,
          wingSpan: 22,
          speedLimit: 3,
          separation: 35,
          alignment: 40,
          cohesion: 40,
          quantity: 3,
        });

        // Nội dung hero (carousel nổi bật) tải bất đồng bộ làm chiều cao section
        // thay đổi sau khi Vanta khởi tạo. Theo dõi kích thước thật của khung nền
        // để canvas luôn phủ kín toàn bộ banner.
        effect.resize();
        resizeObserver = new ResizeObserver(() => effect?.resize());
        resizeObserver.observe(container);
      } catch (error) {
        // Nền gradient tĩnh bên dưới vẫn hiển thị bình thường.
        console.error('[vanta] Không khởi tạo được hiệu ứng Birds:', error);
      }
    };

    const handleMotionChange = () => {
      if (reducedMotion.matches) destroy();
      else start();
    };

    if (!reducedMotion.matches) start();
    reducedMotion.addEventListener('change', handleMotionChange);

    return () => {
      disposed = true;
      reducedMotion.removeEventListener('change', handleMotionChange);
      destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_18%_20%,rgba(53,75,53,0.14),transparent_55%),radial-gradient(circle_at_82%_32%,rgba(184,111,69,0.16),transparent_50%),linear-gradient(180deg,#faf5ec_0%,#f6efe2_100%)]"
    />
  );
}

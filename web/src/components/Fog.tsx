// Hiệu ứng nền sương mù cho hero khu công khai.
// Thuần CSS: tự tắt khi người dùng bật prefers-reduced-motion (định nghĩa trong index.css),
// không phụ thuộc WebGL nên không có trường hợp thư viện lỗi; nằm sau nội dung, không chặn click.
export default function Fog() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(53,75,53,0.16),transparent_65%)] blur-2xl animate-fog-a" />
      <div className="absolute right-[-120px] top-1/4 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(184,111,69,0.18),transparent_65%)] blur-2xl animate-fog-b" />
      <div className="absolute bottom-[-160px] left-1/3 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(212,199,179,0.5),transparent_70%)] blur-3xl animate-fog-c" />
      <div className="absolute left-1/2 top-[-80px] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(250,245,236,0.9),transparent_70%)] blur-xl animate-fog-b" />
    </div>
  );
}

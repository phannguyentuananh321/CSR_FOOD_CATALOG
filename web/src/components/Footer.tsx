import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-sand bg-ivory">
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-olive font-serif text-xl font-semibold text-white">
                Ấ
              </span>
              <span className="leading-tight">
                <span className="block font-serif text-xl font-semibold text-charcoal">Ấm Vị</span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-terracotta">
                  Food Editorial
                </span>
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              Tuyển tập ẩm thực Việt theo phong cách tạp chí — nơi mỗi món ăn là một bản hòa ca
              giữa nguyên liệu tươi ngon chọn lọc và niềm say mê của những nghệ nhân ẩm thực.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal">Danh Mục</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/dishes" className="text-muted transition hover:text-olive">
                  Món Ăn
                </Link>
              </li>
              <li>
                <Link to="/chefs" className="text-muted transition hover:text-olive">
                  Đầu Bếp
                </Link>
              </li>
              <li>
                <Link to="/ingredients" className="text-muted transition hover:text-olive">
                  Nguyên Liệu
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal">Kiến Trúc</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>React 19 + TypeScript SPA</li>
              <li>Vite + React Router (client-side)</li>
              <li>REST API — Express (Node.js)</li>
              <li>PostgreSQL + Prisma ORM</li>
              <li>Supabase Storage / lưu ảnh cục bộ</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-sand pt-6 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Ấm Vị Food Editorial. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-olive" aria-hidden="true" />
            Phong cách Warm Cream — Modern Editorial
          </p>
        </div>
      </div>
    </footer>
  );
}

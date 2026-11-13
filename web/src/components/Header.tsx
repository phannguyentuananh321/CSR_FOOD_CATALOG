import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { useAuth } from '../context/AuthContext';

const publicLinks = [
  { to: '/dishes', label: 'Món Ăn' },
  { to: '/chefs', label: 'Đầu Bếp' },
  { to: '/ingredients', label: 'Nguyên Liệu' },
];

const adminLinks = [
  { to: '/admin/dishes', label: 'Quản lý Món ăn', icon: '🍳' },
  { to: '/admin/chefs', label: 'Quản lý Đầu bếp', icon: '👨‍🍳' },
  { to: '/admin/ingredients', label: 'Quản lý Nguyên liệu', icon: '🌿' },
];

function Logo() {
  return (
    <Link to="/dishes" className="flex items-center gap-3" aria-label="Ấm Vị — về danh sách món ăn">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-olive font-serif text-xl font-semibold text-white">
        Ấ
      </span>
      <span className="leading-tight">
        <span className="block font-serif text-xl font-semibold text-charcoal">Ấm Vị</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-terracotta">
          Food Editorial
        </span>
      </span>
    </Link>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { totalBookmarks } = useUserPreferences();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const adminRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi chuyển trang.
  useEffect(() => {
    setMobileOpen(false);
    setAdminOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Đóng dropdown khi click ra ngoài.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) setAdminOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-4 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-cream text-olive-dark' : 'text-charcoal hover:bg-sand/60'
    }`;

  const isAdminActive = adminLinks.some((l) => location.pathname.startsWith(l.to));

  const handleLogout = async () => {
    await logout();
    navigate('/login', {
      state: {
        notice: {
          type: 'info',
          text: 'Bạn đã đăng xuất an toàn khỏi hệ thống.',
        },
      },
    });
  };

  return (
    <header className="sticky top-0 z-40 h-20 border-b border-sand bg-ivory/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Menu desktop */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
          {publicLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass}>
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/bookmarks" className={navClass} aria-label="Mục đã lưu">
            <span className="flex items-center gap-1.5">
              <span>Đã Lưu</span>
              {totalBookmarks > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta px-1 text-[10px] font-bold text-white">
                  {totalBookmarks}
                </span>
              )}
            </span>
          </NavLink>

          {/* Admin dropdown (hiển thị cho bất kỳ ai đã đăng nhập) */}
          {user && (
            <div className="relative ml-2" ref={adminRef}>
              <button
                type="button"
                onClick={() => setAdminOpen((v) => !v)}
                aria-expanded={adminOpen}
                aria-haspopup="menu"
                className={`flex items-center gap-2 rounded-xl border border-sand px-4 py-2 text-sm font-semibold transition ${
                  isAdminActive ? 'bg-cream text-olive-dark' : 'text-charcoal hover:bg-sand/60'
                }`}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M11.1 2.6a1.5 1.5 0 00-2.2 0l-.5.8a1.5 1.5 0 01-1.2.7l-.9-.1a1.5 1.5 0 00-1.6 1.5v.9c0 .5-.2 1-.7 1.2l-.8.5a1.5 1.5 0 00-.5 2.1l.5.9c.3.4.3 1 0 1.4l-.5.9a1.5 1.5 0 00.5 2.1l.8.5c.4.3.7.7.7 1.2v.9c0 .8.7 1.5 1.6 1.5l.9-.1c.5 0 1 .2 1.2.7l.5.8c.5.8 1.7.8 2.2 0l.5-.8c.2-.5.7-.7 1.2-.7l.9.1c.8 0 1.6-.7 1.6-1.5v-.9c0-.5.2-1 .7-1.2l.8-.5c.8-.5 1-1.4.5-2.1l-.5-.9a1.5 1.5 0 010-1.4l.5-.9c.5-.7.3-1.7-.5-2.1l-.8-.5a1.5 1.5 0 01-.7-1.2v-.9c0-.8-.7-1.5-1.6-1.5l-.9.1a1.5 1.5 0 01-1.2-.7l-.5-.8zM10 13.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
                    clipRule="evenodd"
                  />
                </svg>
                Quản trị
                <span aria-hidden="true">▾</span>
              </button>
              {adminOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 rounded-2xl border border-sand bg-ivory p-2 shadow-md"
                >
                  <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                    Quản lý danh mục
                  </p>
                  {adminLinks.map((link) => {
                    const active = location.pathname.startsWith(link.to);
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        role="menuitem"
                        className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition ${
                          active ? 'bg-cream font-bold text-olive' : 'text-charcoal hover:bg-sand/60'
                        }`}
                      >
                        <span aria-hidden="true">{link.icon}</span>
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* User Auth Section */}
          <div className="ml-3 pl-3 border-l border-sand flex items-center gap-2">
            {user ? (
              <div className="relative" ref={userRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl border border-sand bg-cream/70 px-3 py-1.5 text-sm font-semibold text-charcoal hover:bg-cream transition"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-olive text-xs font-bold text-white uppercase">
                    {(user.displayName || user.email)[0]}
                  </span>
                  <span className="max-w-[120px] truncate">{user.displayName || user.email}</span>
                  {user.role === 'admin' && (
                    <span className="rounded-md bg-terracotta/15 px-1.5 py-0.5 text-[10px] font-bold text-terracotta">
                      Admin
                    </span>
                  )}
                  <span aria-hidden="true">▾</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-sand bg-ivory p-2 shadow-md">
                    <div className="px-3 py-2 border-b border-sand/60">
                      <p className="text-xs font-bold text-charcoal">{user.displayName || 'Người dùng'}</p>
                      <p className="text-[11px] text-muted truncate">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-700 hover:bg-red-50 transition font-semibold"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-xl px-3.5 py-1.5 text-sm font-semibold text-charcoal hover:bg-sand/60 transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-olive px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-olive-dark transition"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Nút hamburger mobile */}
        <button
          type="button"
          className="rounded-xl border border-sand p-2 text-olive md:hidden"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true">
            {mobileOpen ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Menu mobile */}
      {mobileOpen && (
        <nav
          aria-label="Menu mobile"
          className="border-t border-sand bg-ivory px-4 pb-6 pt-3 md:hidden shadow-lg"
        >
          {user ? (
            <div className="mb-4 rounded-xl border border-sand bg-cream/50 p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-charcoal">{user.displayName || user.email}</p>
                <p className="text-xs text-muted">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="mb-4 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                className="rounded-xl border border-sand py-2 text-center text-sm font-semibold text-charcoal"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-olive py-2 text-center text-sm font-semibold text-white"
              >
                Đăng ký
              </Link>
            </div>
          )}

          <p className="mt-2 px-2 text-[11px] font-bold uppercase tracking-wider text-muted">
            Khám phá
          </p>
          <div className="mt-1 flex flex-col">
            {publicLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClass}>
                {link.label}
              </NavLink>
            ))}
            <NavLink key="/bookmarks" to="/bookmarks" className={navClass}>
              <span className="flex items-center justify-between">
                <span>Mục Đã Lưu</span>
                {totalBookmarks > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta px-1.5 text-[10px] font-bold text-white">
                    {totalBookmarks}
                  </span>
                )}
              </span>
            </NavLink>
          </div>

          {user && (
            <>
              <p className="mt-4 px-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                Quản trị
              </p>
              <div className="mt-1 flex flex-col">
                {adminLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} className={navClass}>
                    <span aria-hidden="true">{link.icon}</span> {link.label}
                  </NavLink>
                ))}
              </div>
            </>
          )}
        </nav>
      )}
    </header>
  );
}

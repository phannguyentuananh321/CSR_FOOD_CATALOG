import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import type { Notice } from '../types';
import Alert from './Alert';
import Footer from './Footer';
import Header from './Header';

// Khung trang dùng chung: header sticky 80px, vùng thông báo, nội dung, footer.
// Thông báo được truyền qua navigation state (location.state.notice) sau điều hướng POST-Redirect-GET,
// không dùng global store; xóa state sau khi hiển thị để refresh không lặp lại.
export default function AppLayout() {
  const location = useLocation();
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const state = location.state as { notice?: Notice } | null;
    if (state?.notice) {
      setNotice(state.notice);
      window.history.replaceState(null, '', location.pathname + location.search);
    } else {
      setNotice(null);
    }
  }, [location]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {notice && (
        <div className="mx-auto w-full max-w-[1280px] px-4 pt-4 sm:px-6 lg:px-8">
          <Alert type={notice.type} text={notice.text} onClose={() => setNotice(null)} />
        </div>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordApi } from '../../api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await forgotPasswordApi(email);
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl border border-sand bg-ivory p-8 shadow-sm">
        <div className="text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-olive font-serif text-2xl font-bold text-white">
            🔑
          </span>
          <h1 className="mt-4 font-serif text-2xl font-bold text-charcoal sm:text-3xl">Quên mật khẩu</h1>
          <p className="mt-2 text-sm text-charcoal/70">
            Nhập email của bạn để nhận liên kết đặt lại mật khẩu
          </p>
        </div>

        {submitted ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6 text-center text-sm text-green-900">
            <p className="font-bold text-base mb-1">Đã gửi yêu cầu thành công</p>
            <p className="text-green-800">
              Nếu email <strong>{email}</strong> tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi vào hòm thư. Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam).
            </p>
            <div className="mt-6">
              <Link to="/login" className="font-bold text-olive underline hover:text-olive-dark">
                ← Quay lại trang đăng nhập
              </Link>
            </div>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/80">
                  Email đã đăng ký
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ten@vidu.com"
                  className="mt-1.5 block w-full rounded-xl border border-sand bg-white px-3.5 py-2.5 text-sm text-charcoal shadow-sm outline-none transition focus:border-olive focus:ring-1 focus:ring-olive"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-olive py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-olive-dark disabled:opacity-60"
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-charcoal/70">
              <Link to="/login" className="font-bold text-olive hover:underline">
                ← Quay lại đăng nhập
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

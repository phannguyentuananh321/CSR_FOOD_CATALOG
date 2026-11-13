import { useState, type FormEvent } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPasswordApi } from '../../api/auth';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Password rules
  const hasMinLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasLower && hasUpper && hasDigit && hasSpecial;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token) {
      setErrorMsg('Mã liên kết xác thực (token) không tồn tại hoặc đã hết hạn.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg('Mật khẩu mới chưa đáp ứng đầy đủ yêu cầu bảo mật.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPasswordApi({ token, password });
      navigate('/login', {
        state: {
          notice: {
            type: 'info',
            text: res.message || 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.',
          },
        },
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl border border-sand bg-ivory p-8 shadow-sm">
        <div className="text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-olive font-serif text-2xl font-bold text-white">
            🔒
          </span>
          <h1 className="mt-4 font-serif text-2xl font-bold text-charcoal sm:text-3xl">Đặt lại mật khẩu</h1>
          <p className="mt-2 text-sm text-charcoal/70">Thiết lập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        {!token && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            Không tìm thấy token đặt lại mật khẩu trong liên kết. Vui lòng kiểm tra lại email.
          </div>
        )}

        {errorMsg && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {errorMsg}
          </div>
        )}

        {token && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/80">
                Mật khẩu mới *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 block w-full rounded-xl border border-sand bg-white px-3.5 py-2.5 text-sm text-charcoal shadow-sm outline-none transition focus:border-olive focus:ring-1 focus:ring-olive"
              />
              <div className="mt-2 space-y-1 text-xs text-charcoal/70">
                <div className={hasMinLength ? 'text-green-600 font-semibold' : ''}>
                  {hasMinLength ? '✓' : '•'} Tối thiểu 8 ký tự
                </div>
                <div className={hasUpper && hasLower ? 'text-green-600 font-semibold' : ''}>
                  {hasUpper && hasLower ? '✓' : '•'} Chữ hoa và chữ thường
                </div>
                <div className={hasDigit ? 'text-green-600 font-semibold' : ''}>
                  {hasDigit ? '✓' : '•'} Ít nhất 1 chữ số
                </div>
                <div className={hasSpecial ? 'text-green-600 font-semibold' : ''}>
                  {hasSpecial ? '✓' : '•'} Ít nhất 1 ký tự đặc biệt
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/80">
                Nhập lại mật khẩu mới *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 block w-full rounded-xl border border-sand bg-white px-3.5 py-2.5 text-sm text-charcoal shadow-sm outline-none transition focus:border-olive focus:ring-1 focus:ring-olive"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-olive py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-olive-dark disabled:opacity-60"
            >
              {isSubmitting ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-charcoal/70">
          <Link to="/login" className="font-bold text-olive hover:underline">
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

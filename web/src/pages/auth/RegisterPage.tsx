import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RecaptchaWidget from '../../components/RecaptchaWidget';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password rules validation helpers
  const hasMinLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasLower && hasUpper && hasDigit && hasSpecial;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isPasswordValid) {
      setErrorMsg('Mật khẩu chưa đáp ứng đủ các tiêu chuẩn bảo mật.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không khớp.');
      return;
    }

    // Kiểm tra reCAPTCHA bắt buộc trước khi gửi lên server
    if (!recaptchaToken) {
      setErrorMsg('Vui lòng hoàn thành xác thực reCAPTCHA để tiếp tục đăng ký.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        email,
        password,
        displayName: displayName || undefined,
        recaptchaToken,
      });

      navigate(`/activate?email=${encodeURIComponent(res.email || email)}`, {
        state: {
          notice: {
            type: 'info',
            text: res.message || 'Mã OTP kích hoạt đã được gửi đến email của bạn.',
          },
        },
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng ký không thành công. Vui lòng thử lại.');
      // Reset captcha sau khi lỗi (token cũ không dùng lại được)
      setRecaptchaToken('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl border border-sand bg-ivory p-8 shadow-sm">
        <div className="text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-olive font-serif text-2xl font-bold text-white">
            Ấ
          </span>
          <h1 className="mt-4 font-serif text-2xl font-bold text-charcoal sm:text-3xl">Đăng ký tài khoản</h1>
          <p className="mt-2 text-sm text-charcoal/70">Khám phá thế giới ẩm thực phong vị Việt</p>
        </div>

        {errorMsg && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/80">
              Email *
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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/80">
              Tên hiển thị
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="mt-1.5 block w-full rounded-xl border border-sand bg-white px-3.5 py-2.5 text-sm text-charcoal shadow-sm outline-none transition focus:border-olive focus:ring-1 focus:ring-olive"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/80">
              Mật khẩu *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 block w-full rounded-xl border border-sand bg-white px-3.5 py-2.5 text-sm text-charcoal shadow-sm outline-none transition focus:border-olive focus:ring-1 focus:ring-olive"
            />
            {/* Password strength checklist */}
            <div className="mt-2 space-y-1 text-xs text-charcoal/70">
              <div className={hasMinLength ? 'text-green-600 font-semibold' : ''}>
                {hasMinLength ? '✓' : '•'} Tối thiểu 8 ký tự
              </div>
              <div className={hasUpper && hasLower ? 'text-green-600 font-semibold' : ''}>
                {hasUpper && hasLower ? '✓' : '•'} Có cả chữ hoa (A-Z) và chữ thường (a-z)
              </div>
              <div className={hasDigit ? 'text-green-600 font-semibold' : ''}>
                {hasDigit ? '✓' : '•'} Có ít nhất 1 chữ số (0-9)
              </div>
              <div className={hasSpecial ? 'text-green-600 font-semibold' : ''}>
                {hasSpecial ? '✓' : '•'} Có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/80">
              Nhập lại mật khẩu *
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

          <div className="pt-2">
            <RecaptchaWidget
              onChange={(tok) => {
                setRecaptchaToken(tok);
                // Xóa thông báo lỗi captcha khi người dùng hoàn thành xác thực
                if (tok && errorMsg.includes('reCAPTCHA')) setErrorMsg('');
              }}
              onExpired={() => {
                setRecaptchaToken('');
                setErrorMsg('Phiên xác thực reCAPTCHA đã hết hạn. Vui lòng xác thực lại trước khi đăng ký.');
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !recaptchaToken}
            title={!recaptchaToken ? 'Hãy hoàn thành xác thực reCAPTCHA trước' : undefined}
            className="w-full rounded-xl bg-olive py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-olive-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Đang khởi tạo tài khoản...' : !recaptchaToken ? '🔒 Hoàn thành reCAPTCHA để tiếp tục' : 'Đăng ký'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-charcoal/70">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-bold text-olive hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}

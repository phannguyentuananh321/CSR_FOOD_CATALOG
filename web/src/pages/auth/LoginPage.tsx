import { useState, useEffect, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAuthStatusApi } from '../../api/auth';
import RecaptchaWidget from '../../components/RecaptchaWidget';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [requireCaptcha, setRequireCaptcha] = useState(false);
  const [lockRemaining, setLockRemaining] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unactivatedEmail, setUnactivatedEmail] = useState<string | null>(null);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/dishes';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockRemaining]);

  // Check rate limit status when email changes (debounced)
  useEffect(() => {
    if (!email || !email.includes('@')) return;

    const timer = setTimeout(async () => {
      try {
        const status = await getAuthStatusApi(email);
        if (status.isLocked) {
          setLockRemaining(status.remainingSeconds);
        }
        if (status.requireCaptcha) {
          setRequireCaptcha(true);
        }
      } catch {
        // ignore
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [email]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setUnactivatedEmail(null);

    if (lockRemaining > 0) {
      setErrorMsg(`Tài khoản đang bị khóa tạm thời. Vui lòng chờ ${lockRemaining} giây.`);
      return;
    }

    if (requireCaptcha && !recaptchaToken) {
      setErrorMsg('Vui lòng hoàn thành xác thực mã reCAPTCHA.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password, recaptchaToken });
      const from = (location.state as any)?.from?.pathname || '/dishes';
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.message || 'Đăng nhập không thành công';
      setErrorMsg(msg);

      if (err.code === 'ACCOUNT_NOT_ACTIVATED') {
        setUnactivatedEmail(err.data?.email || email);
      }

      if (err.data?.remainingSeconds) {
        setLockRemaining(err.data.remainingSeconds);
      }

      if (err.data?.requireCaptcha) {
        setRequireCaptcha(true);
      }
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
          <h1 className="mt-4 font-serif text-2xl font-bold text-charcoal sm:text-3xl">Đăng nhập Ấm Vị</h1>
          <p className="mt-2 text-sm text-charcoal/70">Chào mừng bạn quay lại với không gian ẩm thực</p>
        </div>

        {errorMsg && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">{errorMsg}</p>
            {unactivatedEmail && (
              <div className="mt-2">
                <Link
                  to={`/activate?email=${encodeURIComponent(unactivatedEmail)}`}
                  className="font-bold underline hover:text-red-900"
                >
                  Nhấn vào đây để kích hoạt tài khoản bằng mã OTP →
                </Link>
              </div>
            )}
          </div>
        )}

        {lockRemaining > 0 && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            ⏱️ Đang tạm khóa do đăng nhập sai nhiều lần. Thử lại sau <strong>{lockRemaining}s</strong>.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/80">
              Email
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
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/80">
                Mật khẩu
              </label>
              <Link to="/forgot-password" className="text-xs font-semibold text-olive hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 block w-full rounded-xl border border-sand bg-white px-3.5 py-2.5 text-sm text-charcoal shadow-sm outline-none transition focus:border-olive focus:ring-1 focus:ring-olive"
            />
          </div>

          {requireCaptcha && (
            <div className="pt-2">
              <p className="mb-2 text-center text-xs font-semibold text-terracotta">
                Phát hiện nhiều lần đăng nhập không thành công. Vui lòng xác thực reCAPTCHA:
              </p>
              <RecaptchaWidget
                onChange={(tok) => setRecaptchaToken(tok)}
                onExpired={() => setRecaptchaToken('')}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || lockRemaining > 0}
            className="w-full rounded-xl bg-olive py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-olive-dark disabled:opacity-60"
          >
            {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-charcoal/70">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-bold text-olive hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ActivatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activate, resendOtp } = useAuth();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !otp) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mã OTP.');
      return;
    }

    setIsSubmitting(true);
    try {
      await activate({ email, otp });
      navigate('/dishes', {
        state: {
          notice: {
            type: 'info',
            text: 'Chúc mừng! Tài khoản của bạn đã được kích hoạt thành công.',
          },
        },
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await resendOtp(email);
      setSuccessMsg(res.message || 'Mã OTP mới đã được gửi vào hòm thư của bạn.');
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể gửi lại mã OTP lúc này.');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl border border-sand bg-ivory p-8 shadow-sm">
        <div className="text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-olive font-serif text-2xl font-bold text-white">
            ✉️
          </span>
          <h1 className="mt-4 font-serif text-2xl font-bold text-charcoal sm:text-3xl">Kích hoạt tài khoản</h1>
          <p className="mt-2 text-sm text-charcoal/70">
            Vui lòng nhập mã OTP 6 chữ số vừa được gửi đến email của bạn
          </p>
        </div>

        {errorMsg && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
            {successMsg}
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
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/80">
              Mã OTP (6 chữ số)
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="mt-1.5 block w-full text-center tracking-[0.5em] font-mono text-2xl font-bold rounded-xl border border-sand bg-white px-3.5 py-2.5 text-charcoal shadow-sm outline-none transition focus:border-olive focus:ring-1 focus:ring-olive"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otp.length < 6}
            className="w-full rounded-xl bg-olive py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-olive-dark disabled:opacity-60"
          >
            {isSubmitting ? 'Đang kích hoạt...' : 'Xác thực & Kích hoạt'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between border-t border-sand pt-4 text-xs">
          <span className="text-charcoal/70">Không nhận được mã?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="font-bold text-olive hover:underline disabled:text-charcoal/40"
          >
            {resendCooldown > 0 ? `Gửi lại sau (${resendCooldown}s)` : 'Gửi lại mã OTP'}
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-charcoal/70">
          <Link to="/login" className="font-semibold text-olive hover:underline">
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

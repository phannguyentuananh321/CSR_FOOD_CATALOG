import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (
        container: HTMLElement | string,
        parameters: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark';
        }
      ) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

interface RecaptchaWidgetProps {
  siteKey?: string;
  onChange: (token: string) => void;
  onExpired?: () => void;
}

export default function RecaptchaWidget({ siteKey, onChange, onExpired }: RecaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  const key = siteKey || (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string) || '';

  useEffect(() => {
    if (!key) return;

    let isMounted = true;

    function renderWidget() {
      if (!isMounted || !containerRef.current || !window.grecaptcha) return;
      if (widgetIdRef.current !== null) return; // already rendered

      try {
        const id = window.grecaptcha.render(containerRef.current, {
          sitekey: key,
          callback: (token: string) => {
            onChange(token);
          },
          'expired-callback': () => {
            if (onExpired) onExpired();
          },
        });
        widgetIdRef.current = id;
      } catch (err) {
        console.warn('reCAPTCHA render notice:', err);
      }
    }

    // Load reCAPTCHA script if not already present
    if (!window.grecaptcha) {
      const scriptId = 'google-recaptcha-v2-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (window.grecaptcha) {
            window.grecaptcha.ready(renderWidget);
          }
        };
        document.body.appendChild(script);
      } else {
        script.addEventListener('load', () => {
          if (window.grecaptcha) {
            window.grecaptcha.ready(renderWidget);
          }
        });
      }
    } else {
      window.grecaptcha.ready(renderWidget);
    }

    return () => {
      isMounted = false;
    };
  }, [key, onChange, onExpired]);

  if (!key) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Chưa cấu hình VITE_RECAPTCHA_SITE_KEY trong file .env
      </div>
    );
  }

  return (
    <div className="my-2 flex justify-center">
      <div ref={containerRef} />
    </div>
  );
}

import React, { useState } from 'react';
import { isFirebaseConfigured } from '../lib/firebase';
import TermsOfServiceModal from './TermsOfServiceModal';

interface LoginModalProps {
  onLogin: () => void;
  onAppleLogin?: () => void;
  onGuestLogin: () => void;
  isLoading: boolean;
  error: string | null;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onAppleLogin, onGuestLogin, isLoading, error }) => {
  const hasConfig = isFirebaseConfigured;
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <>
      <style>{`
        .fog-background {
          position: relative;
          overflow: hidden;
        }
        .fog-background::before,
        .fog-background::after {
          content: '';
          position: absolute;
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(234, 179, 163, 0.25) 0%, rgba(234, 179, 163, 0) 60%);
          border-radius: 50%;
          animation: fog-animation 30s linear infinite;
          will-change: transform, opacity;
          z-index: 0;
        }
        .fog-background::after {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(234, 179, 163, 0.2) 0%, rgba(234, 179, 163, 0) 70%);
          animation-delay: -15s;
          animation-duration: 40s;
        }
        @keyframes fog-animation {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
          25% { transform: translate(0%, -25%) scale(1.2); opacity: 1; }
          50% { transform: translate(50%, 0%) scale(1); opacity: 0.8; }
          75% { transform: translate(0%, 50%) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
        }
      `}</style>
      <div className="fixed inset-0 bg-brand-bg bg-opacity-90 flex justify-center items-center z-50">
        <div className="bg-brand-surface rounded-lg shadow-xl w-full max-w-md m-4 p-10 relative fog-background">
          <div className="relative z-10 flex flex-col items-center text-center">
            <h1 className="text-4xl font-light mb-2 text-brand-primary font-display">
              Orchid
            </h1>
            <p className="text-brand-text-primary font-medium tracking-wide text-sm uppercase mb-6 opacity-60">
              The Brand Curator
            </p>
            <p className="text-brand-text-secondary mb-8">
              {hasConfig
                ? "Your personal curation assistant, now in the cloud."
                : "Development Mode: Firebase keys not found."}
            </p>

            <div className="w-full flex items-start gap-3 mb-6 p-3 bg-gray-50 rounded-lg text-left">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary cursor-pointer"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                I agree to the <span className="text-brand-primary underline hover:text-brand-primary-dark" onClick={(e) => { e.preventDefault(); setShowTerms(true); }}>Terms of Service & Privacy Policy</span>.
              </label>
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={onLogin}
                disabled={isLoading || !hasConfig || !agreed}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-md text-brand-text-primary font-medium hover:bg-gray-50 transition-all shadow-subtle hover:shadow-subtle-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-brand-secondary border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    <span>{hasConfig ? "Sign in with Google" : "Google Auth Disabled"}</span>
                  </>
                )}
              </button>

              <button
                onClick={onAppleLogin}
                disabled={isLoading || !hasConfig || !agreed || !onAppleLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-md font-medium hover:opacity-90 transition-all shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.5 12.6c0-2.4 2-3.6 2.1-3.7-.1-.3-1.4-4.8-5.4-4.8-1.6 0-2.8.9-3.7.9-.9 0-2.3-1-3.8-1-3.9 0-6.1 4.5-6.1 9.4 0 3.7 1.4 7.6 5.4 7.6 1.3 0 1.8-1 3.4-1 1.6 0 2 .9 3.4.9 2.3 0 4.2-3.9 4.2-3.9-.1 0-2.4-1.4-2.4-4.4zM13.4 4c.8-1 1.3-2.3 1.2-3.6-1.1 0-2.5.8-3.3 1.7-.8.9-1.4 2.2-1.2 3.6 1.2.1 2.6-.7 3.3-1.7z" />
                </svg>
                <span>{hasConfig ? "Sign in with Apple" : "Apple Auth Disabled"}</span>
              </button>

              <div className="border-t border-gray-200 my-2"></div>

              <button
                onClick={onGuestLogin}
                disabled={!agreed}
                className="w-full px-4 py-3 bg-brand-primary text-white font-semibold rounded-md hover:opacity-90 transition shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue as Guest (Local Mode)
              </button>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-500">{error}</p>
            )}

            <p className="mt-8 text-xs text-brand-text-secondary/60">
              {hasConfig
                ? "By continuing, you agree to store your data safely in our cloud database."
                : "Running in local state mode. Data will not persist across browser sessions."}
            </p>
          </div>
        </div>
      </div>
      <TermsOfServiceModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </>
  );
};

export default LoginModal;
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Cpu, AlertCircle, ArrowLeft } from 'lucide-react';
import { User as UserType } from '../types';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from '../lib/firebase';

interface LoginViewProps {
  onLoginSuccess: (token: string, user: UserType) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const navigate = useNavigate();

  // Mode: 'login' or 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Local helper for email validation
  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Field Validations
    if (!email || !password) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    if (!validateEmail(email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters in length.');
      return;
    }

    if (mode === 'register' && !name) {
      setValidationError('Please provide your name.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const mappedUser: UserType = {
          id: user.uid,
          email: user.email || '',
          name: user.displayName || user.email?.split('@')[0] || 'User',
          avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || user.email || 'User')}`
        };
        onLoginSuccess('firebase-auth-token', mappedUser);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: name });
        const mappedUser: UserType = {
          id: user.uid,
          email: user.email || '',
          name: name,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
        };
        onLoginSuccess('firebase-auth-token', mappedUser);
      }
      navigate('/explore');
    } catch (err: any) {
      console.error(err);
      setValidationError(err.message || 'Authentication operation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Google Social Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setValidationError('');

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;
      const mappedUser: UserType = {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'User',
        avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || user.email || 'User')}`
      };
      onLoginSuccess('firebase-auth-token', mappedUser);
      navigate('/explore');
    } catch (err: any) {
      console.error('Google login failed', err);
      setValidationError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16 space-y-8 min-h-[80vh] flex flex-col justify-center">
      {/* Back button */}
      <div className="flex justify-start">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO HOME
        </Link>
      </div>

      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-accent/10 border border-emerald-accent/20 mb-2">
          <Cpu className="h-6 w-6 text-emerald-accent" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-white">
          {mode === 'login' ? 'Sign In to CircuitHub' : 'Create Student Account'}
        </h1>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Unlock full access to active calculation boards and premium Gemini PDF analysis.
        </p>
      </div>

      {/* Main card */}
      <div className="bg-navy-card border border-navy-light p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6">
        {validationError && (
          <div className="flex items-start gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-xl">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {/* Register Name */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Your Name (e.g. Firoz Ahmed)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-navy-dark border border-navy-light focus:border-emerald-accent rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-navy-dark border border-navy-light focus:border-emerald-accent rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold block">Access Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-navy-dark border border-navy-light focus:border-emerald-accent rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center rounded-xl bg-emerald-accent hover:bg-emerald-hover disabled:bg-slate-700 text-navy-dark py-3 font-bold shadow-lg shadow-emerald-accent/15 transition-all cursor-pointer"
          >
            {loading ? 'Processing Workspace...' : mode === 'login' ? 'Authenticate Account' : 'Initialize Account'}
          </button>
        </form>

        {/* OR Divider */}
        <div className="flex items-center gap-3 text-[10px] uppercase font-bold text-slate-500">
          <div className="h-[1px] bg-navy-light flex-1" />
          <span>Or login instantly</span>
          <div className="h-[1px] bg-navy-light flex-1" />
        </div>

        {/* Social controls */}
        <div className="space-y-2 text-xs">
          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-navy-light bg-navy-dark hover:bg-navy-light/40 text-slate-300 py-2.5 font-bold transition-all cursor-pointer"
          >
            <svg className="h-4 w-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.46 1 0 6.46 0 13.2s5.46 12.2 12.24 12.2c7.09 0 11.81-4.99 11.81-12.03 0-.81-.08-1.43-.19-2.09H12.24z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Toggle Mode Link */}
        <div className="text-center text-[11px] text-slate-400">
          {mode === 'login' ? (
            <>
              New to CircuitHub?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-emerald-accent font-bold hover:underline cursor-pointer"
              >
                Create an Account
              </button>
            </>
          ) : (
            <>
              Already registered?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-emerald-accent font-bold hover:underline cursor-pointer"
              >
                Sign In Instead
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

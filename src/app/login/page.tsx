'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, User, Lock, Mail, Loader2 } from 'lucide-react';

type Mode = 'login' | 'register';

export default function AuthPage() {
    const [mode, setMode] = useState<Mode>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, loading: authLoading, login } = useAuth();
    const router = useRouter();

    // Redirect if already logged in
    React.useEffect(() => {
        if (!authLoading && user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    const switchMode = (m: Mode) => {
        setMode(m);
        setError('');
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (mode === 'register' && password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            if (mode === 'login') {
                const response = await api.post('token/', { username, password });
                login(response.data.access, response.data.refresh);
            } else {
                await api.post('register/', { username, email, password });
                const response = await api.post('token/', { username, password });
                login(response.data.access, response.data.refresh);
            }
        } catch (err: any) {
            const data = err.response?.data;
            if (data && typeof data === 'object') {
                const first = Object.values(data)[0];
                setError(Array.isArray(first) ? first[0] as string : String(first));
            } else if (err.message) {
                setError(err.message);
            } else {
                setError('Something went wrong. Please check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap');

                .auth-root {
                    font-family: 'DM Sans', sans-serif;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1.5rem;
                    background: #08080f;
                    background-image:
                        radial-gradient(ellipse 70% 50% at 15% 0%, rgba(167,139,250,0.12) 0%, transparent 65%),
                        radial-gradient(ellipse 55% 40% at 85% 100%, rgba(96,165,250,0.08) 0%, transparent 60%),
                        radial-gradient(ellipse 40% 30% at 50% 50%, rgba(52,211,153,0.04) 0%, transparent 70%);
                    position: relative;
                    overflow: hidden;
                }

                /* Decorative orbs */
                .auth-root::before,
                .auth-root::after {
                    content: '';
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    pointer-events: none;
                }
                .auth-root::before {
                    width: 420px; height: 420px;
                    background: rgba(167,139,250,0.09);
                    top: -120px; left: -100px;
                }
                .auth-root::after {
                    width: 320px; height: 320px;
                    background: rgba(96,165,250,0.07);
                    bottom: -100px; right: -80px;
                }

                .auth-card {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    max-width: 420px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 24px;
                    padding: 2.5rem 2.25rem;
                    box-shadow: 0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    animation: authCardIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
                }

                @keyframes authCardIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0)  scale(1); }
                }

                /* Logo */
                .auth-logo {
                    font-family: 'Syne', sans-serif;
                    font-weight: 800;
                    font-size: 1.5rem;
                    letter-spacing: -0.04em;
                    background: linear-gradient(135deg, #a78bfa 0%, #60a5fa 60%, #34d399 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-decoration: none;
                    display: inline-block;
                    margin-bottom: 2rem;
                }

                /* Mode tabs */
                .auth-tabs {
                    display: flex;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 14px;
                    padding: 4px;
                    margin-bottom: 2rem;
                    gap: 4px;
                }

                .auth-tab {
                    flex: 1;
                    padding: 9px 0;
                    border-radius: 10px;
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    background: transparent;
                    color: rgba(255,255,255,0.4);
                    transition: color 0.2s, background 0.25s;
                    font-family: 'DM Sans', sans-serif;
                    letter-spacing: -0.01em;
                }

                .auth-tab.active {
                    background: rgba(167,139,250,0.18);
                    color: rgba(255,255,255,0.92);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
                }

                /* Heading */
                .auth-heading {
                    font-family: 'Syne', sans-serif;
                    font-size: 1.5rem;
                    font-weight: 800;
                    letter-spacing: -0.03em;
                    color: #fff;
                    margin-bottom: 0.375rem;
                }

                .auth-subheading {
                    font-size: 0.875rem;
                    color: rgba(255,255,255,0.45);
                    margin-bottom: 1.75rem;
                }

                /* Fields */
                .field-group {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .field-label {
                    display: block;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    color: rgba(255,255,255,0.6);
                    margin-bottom: 0.4rem;
                    letter-spacing: 0.01em;
                }

                .field-wrap {
                    position: relative;
                }

                .field-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: rgba(255,255,255,0.25);
                    pointer-events: none;
                    display: flex;
                    align-items: center;
                }

                .auth-input {
                    width: 100%;
                    padding: 0.75rem 1rem 0.75rem 2.75rem;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 12px;
                    color: rgba(255,255,255,0.92);
                    font-size: 0.9375rem;
                    font-family: 'DM Sans', sans-serif;
                    outline: none;
                    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
                    -webkit-appearance: none;
                }

                .auth-input::placeholder {
                    color: rgba(255,255,255,0.2);
                }

                .auth-input:hover {
                    border-color: rgba(255,255,255,0.15);
                }

                .auth-input:focus {
                    border-color: rgba(167,139,250,0.7);
                    background: rgba(167,139,250,0.07);
                    box-shadow: 0 0 0 3px rgba(167,139,250,0.12);
                }

                .auth-input.has-toggle {
                    padding-right: 2.75rem;
                }

                .toggle-btn {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.3);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    padding: 2px;
                    transition: color 0.2s;
                }

                .toggle-btn:hover { color: rgba(255,255,255,0.65); }

                /* Error */
                .auth-error {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                    background: rgba(248,113,113,0.1);
                    border: 1px solid rgba(248,113,113,0.2);
                    color: #fca5a5;
                    font-size: 0.875rem;
                    margin-bottom: 1.25rem;
                    animation: fadeIn 0.25s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* Submit */
                .auth-submit {
                    width: 100%;
                    padding: 0.8125rem 1.5rem;
                    border-radius: 12px;
                    border: none;
                    background: linear-gradient(135deg, #a78bfa 0%, #818cf8 100%);
                    color: #fff;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 0.9375rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    letter-spacing: -0.01em;
                    box-shadow: 0 4px 24px rgba(167,139,250,0.3);
                    transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
                }

                .auth-submit:hover:not(:disabled) {
                    opacity: 0.92;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 32px rgba(167,139,250,0.45);
                }

                .auth-submit:active { transform: translateY(0); }
                .auth-submit:disabled { opacity: 0.55; cursor: not-allowed; }

                /* Footer */
                .auth-footer {
                    margin-top: 1.5rem;
                    text-align: center;
                    font-size: 0.8125rem;
                    color: rgba(255,255,255,0.35);
                }

                .auth-footer button {
                    background: none;
                    border: none;
                    color: rgba(167,139,250,0.9);
                    font-weight: 600;
                    cursor: pointer;
                    font-family: 'DM Sans', sans-serif;
                    font-size: inherit;
                    transition: color 0.2s;
                    padding: 0;
                }

                .auth-footer button:hover { color: #c4b5fd; }

                /* Fields slide animation */
                .fields-enter {
                    animation: fieldsIn 0.3s cubic-bezier(0.16,1,0.3,1) both;
                }

                @keyframes fieldsIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* Forgot password */
                .forgot-link {
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.3);
                    text-decoration: none;
                    transition: color 0.2s;
                    float: right;
                    margin-top: -0.1rem;
                }
                .forgot-link:hover { color: rgba(167,139,250,0.8); }
            `}</style>

            <div className="auth-root">
                <div className="auth-card">
                    {/* Logo */}
                    <Link href="/" className="auth-logo">XPENSE</Link>

                    {/* Tabs */}
                    <div className="auth-tabs" role="tablist">
                        <button
                            className={`auth-tab${mode === 'login' ? ' active' : ''}`}
                            onClick={() => switchMode('login')}
                            role="tab"
                            aria-selected={mode === 'login'}
                        >
                            Sign In
                        </button>
                        <button
                            className={`auth-tab${mode === 'register' ? ' active' : ''}`}
                            onClick={() => switchMode('register')}
                            role="tab"
                            aria-selected={mode === 'register'}
                        >
                            Register
                        </button>
                    </div>

                    {/* Heading */}
                    <p className="auth-heading">
                        {mode === 'login' ? 'Welcome back' : 'Create account'}
                    </p>
                    <p className="auth-subheading">
                        {mode === 'login'
                            ? 'Sign in to manage your finances'
                            : 'Start tracking your expenses today'}
                    </p>

                    {/* Error */}
                    {error && (
                        <div className="auth-error">
                            <span>⚠</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="field-group fields-enter" key={mode}>

                            {/* Username */}
                            <div>
                                <label className="field-label">Username</label>
                                <div className="field-wrap">
                                    <span className="field-icon"><User size={15} /></span>
                                    <input
                                        type="text"
                                        className="auth-input"
                                        placeholder="your_username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        autoComplete="username"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email — register only */}
                            {mode === 'register' && (
                                <div>
                                    <label className="field-label">Email</label>
                                    <div className="field-wrap">
                                        <span className="field-icon"><Mail size={15} /></span>
                                        <input
                                            type="email"
                                            className="auth-input"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoComplete="email"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Password */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                                    <label className="field-label">Password</label>
                                    {mode === 'login' && (
                                        <Link href="/forgot-password" className="forgot-link">Forgot password?</Link>
                                    )}
                                </div>
                                <div className="field-wrap">
                                    <span className="field-icon"><Lock size={15} /></span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="auth-input has-toggle"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password — register only */}
                            {mode === 'register' && (
                                <div>
                                    <label className="field-label">Confirm Password</label>
                                    <div className="field-wrap">
                                        <span className="field-icon"><Lock size={15} /></span>
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            className="auth-input has-toggle"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            autoComplete="new-password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="toggle-btn"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                        >
                                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading
                                ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Processing…</>
                                : <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={17} /></>
                            }
                        </button>
                    </form>

                    {/* Footer switch */}
                    <p className="auth-footer">
                        {mode === 'login'
                            ? <>Don't have an account? <button onClick={() => switchMode('register')}>Register here</button></>
                            : <>Already have an account? <button onClick={() => switchMode('login')}>Sign in</button></>
                        }
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}
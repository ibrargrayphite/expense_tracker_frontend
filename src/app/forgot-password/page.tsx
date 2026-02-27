'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/error-handler';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('users/forgot_password/', { email });
            setSuccess(true);
        } catch (err: any) {
            setError(getErrorMessage(err));
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
                    animation: authCardIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
                }

                @keyframes authCardIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0)  scale(1); }
                }

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

                .field-label {
                    display: block;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    color: rgba(255,255,255,0.6);
                    margin-bottom: 0.4rem;
                }

                .field-wrap { position: relative; }

                .field-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: rgba(255,255,255,0.25);
                    pointer-events: none;
                }

                .auth-input {
                    width: 100%;
                    padding: 0.75rem 1rem 0.75rem 2.75rem;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 12px;
                    color: rgba(255,255,255,0.92);
                    font-size: 0.9375rem;
                    outline: none;
                    transition: border-color 0.2s, background 0.2s;
                }

                .auth-input:focus {
                    border-color: rgba(167,139,250,0.7);
                    background: rgba(167,139,250,0.07);
                }

                .auth-error {
                    display: flex;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                    background: rgba(248,113,113,0.1);
                    border: 1px solid rgba(248,113,113,0.2);
                    color: #fca5a5;
                    font-size: 0.875rem;
                    margin-bottom: 1.25rem;
                }

                .auth-success {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    padding: 1rem;
                }

                .auth-submit {
                    width: 100%;
                    padding: 0.8125rem 1.5rem;
                    border-radius: 12px;
                    border: none;
                    background: linear-gradient(135deg, #a78bfa 0%, #818cf8 100%);
                    color: #fff;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    box-shadow: 0 4px 24px rgba(167,139,250,0.3);
                    transition: opacity 0.2s;
                }

                .auth-submit:disabled { opacity: 0.5; }

                .back-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: rgba(255,255,255,0.4);
                    text-decoration: none;
                    font-size: 0.875rem;
                    margin-bottom: 1.5rem;
                    transition: color 0.2s;
                }

                .back-link:hover { color: #fff; }
            `}</style>

            <div className="auth-root">
                <div className="auth-card">
                    <Link href="/login" className="back-link">
                        <ArrowLeft size={16} /> Back to Login
                    </Link>

                    <Link href="/" className="auth-logo">XPENSE</Link>

                    {!success ? (
                        <>
                            <p className="auth-heading">Forgot Password?</p>
                            <p className="auth-subheading">
                                Enter your email and we'll send you a link to reset your password.
                            </p>

                            {error && <div className="auth-error">⚠ {error}</div>}

                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label className="field-label">Email Address</label>
                                    <div className="field-wrap">
                                        <span className="field-icon"><Mail size={15} /></span>
                                        <input
                                            type="email"
                                            className="auth-input"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="auth-submit" disabled={loading || !email}>
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Send Reset Link'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="auth-success">
                            <CheckCircle2 size={48} color="#34d399" style={{ marginBottom: '1.5rem' }} />
                            <p className="auth-heading">Check your email</p>
                            <p className="auth-subheading">
                                We've sent a password reset link to <strong>{email}</strong>.
                                Please check your inbox (and spam folder).
                            </p>
                            <Link href="/login" className="auth-submit" style={{ textDecoration: 'none', marginTop: '1rem' }}>
                                Return to Login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

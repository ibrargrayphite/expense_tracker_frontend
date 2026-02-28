'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/error-handler';
import { User, Mail, Lock, Eye, EyeOff, Save, ArrowLeft, Shield, Phone } from 'lucide-react';

export default function EditProfilePage() {
    const { user, loading, refreshUser } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone_number: '' });
    const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (user) {
            setForm({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone_number: user.phone_number || '',
            });
        }
    }, [user, loading]);

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            await api.patch('users/update_me/', form);
            await refreshUser();
            showToast('Profile updated successfully!', 'success');
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handlePasswordSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pwForm.new_password !== pwForm.confirm_password) {
            showToast('New passwords do not match.', 'error');
            return;
        }
        setIsSavingPassword(true);
        try {
            await api.patch('users/update_me/', {
                current_password: pwForm.current_password,
                new_password: pwForm.new_password,
            });
            showToast('Password changed successfully!', 'success');
            setPwForm({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
        } finally {
            setIsSavingPassword(false);
        }
    };

    if (loading) return null;

    const userInitial = (user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase();
    const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'My Account';

    return (
        <>
            <style>{`
                .ep-page {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg, #f8f9fb);
                }

                .dark .ep-page { --bg: #06060f; }

                .ep-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 40px 16px 64px;
                }

                .ep-inner {
                    width: 100%;
                    max-width: 580px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                /* Back */
                .ep-back {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    color: rgba(100,100,120,0.85);
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    transition: color 0.18s;
                    align-self: flex-start;
                }
                .ep-back:hover { color: #7c3aed; }

                /* Hero card */
                .ep-hero {
                    background: linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(59,130,246,0.08) 100%);
                    border: 1px solid rgba(124,58,237,0.18);
                    border-radius: 20px;
                    padding: 24px 28px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .ep-hero-avatar {
                    width: 68px;
                    height: 68px;
                    border-radius: 18px;
                    background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.75rem;
                    font-weight: 900;
                    color: #fff;
                    flex-shrink: 0;
                    box-shadow: 0 8px 24px rgba(124,58,237,0.35);
                    letter-spacing: -0.02em;
                }

                .ep-hero-name {
                    font-size: 1.375rem;
                    font-weight: 800;
                    color: #1a1a2e;
                    line-height: 1.2;
                    letter-spacing: -0.03em;
                }

                .dark .ep-hero-name { color: #f0f0ff; }

                .ep-hero-email {
                    font-size: 0.8125rem;
                    color: rgba(100,100,120,0.75);
                    margin-top: 3px;
                }

                .ep-hero-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    margin-top: 8px;
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: #7c3aed;
                    background: rgba(124,58,237,0.1);
                    padding: 4px 10px;
                    border-radius: 100px;
                }

                /* Section cards */
                .ep-card {
                    background: #fff;
                    border: 1px solid rgba(0,0,0,0.07);
                    border-radius: 20px;
                    padding: 28px;
                    box-shadow: 0 2px 16px rgba(0,0,0,0.05);
                }

                .dark .ep-card {
                    background: rgba(16,15,30,0.9);
                    border-color: rgba(255,255,255,0.07);
                    box-shadow: 0 2px 24px rgba(0,0,0,0.25);
                }

                .ep-card-header {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding-bottom: 20px;
                    margin-bottom: 20px;
                    border-bottom: 1px solid rgba(0,0,0,0.06);
                }

                .dark .ep-card-header { border-bottom-color: rgba(255,255,255,0.07); }

                .ep-card-icon {
                    width: 38px;
                    height: 38px;
                    border-radius: 11px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .ep-card-icon.violet { background: rgba(124,58,237,0.1); color: #7c3aed; }
                .ep-card-icon.amber  { background: rgba(245,158,11,0.1); color: #d97706; }

                .ep-card-title {
                    font-size: 0.9375rem;
                    font-weight: 700;
                    color: #1a1a2e;
                    line-height: 1.2;
                }

                .dark .ep-card-title { color: #f0f0ff; }

                .ep-card-subtitle {
                    font-size: 0.75rem;
                    color: rgba(100,100,120,0.7);
                    margin-top: 2px;
                }

                /* Form grid */
                .ep-grid-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                @media (max-width: 480px) {
                    .ep-grid-2 { grid-template-columns: 1fr; }
                }

                .ep-field { display: flex; flex-direction: column; gap: 6px; }

                .ep-label {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: rgba(100,100,120,0.75);
                }

                .ep-input-wrap { position: relative; }

                .ep-input-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: rgba(150,150,170,0.7);
                    pointer-events: none;
                }

                .ep-input {
                    width: 100%;
                    padding: 11px 14px;
                    border-radius: 12px;
                    border: 1px solid rgba(0,0,0,0.1);
                    background: rgba(0,0,0,0.02);
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #1a1a2e;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    font-family: inherit;
                }

                .dark .ep-input {
                    background: rgba(255,255,255,0.04);
                    border-color: rgba(255,255,255,0.09);
                    color: #f0f0ff;
                }

                .ep-input::placeholder { color: rgba(150,150,170,0.6); }

                .ep-input:focus {
                    border-color: rgba(124,58,237,0.45);
                    box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
                }

                .ep-input.with-left-icon { padding-left: 42px; }
                .ep-input.with-right-icon { padding-right: 42px; }

                .ep-eye-btn {
                    position: absolute;
                    right: 13px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: rgba(150,150,170,0.7);
                    display: flex;
                    align-items: center;
                    transition: color 0.18s;
                    padding: 2px;
                }

                .ep-eye-btn:hover { color: #7c3aed; }

                .ep-match-hint {
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-top: 4px;
                }

                .ep-match-hint.match   { color: #10b981; }
                .ep-match-hint.no-match { color: #ef4444; }

                /* Buttons */
                .ep-btn {
                    width: 100%;
                    padding: 12px 20px;
                    border-radius: 13px;
                    border: none;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: transform 0.15s, box-shadow 0.15s, opacity 0.2s;
                    font-family: inherit;
                    letter-spacing: 0.01em;
                }

                .ep-btn:hover:not(:disabled) { transform: translateY(-1px); }
                .ep-btn:disabled { opacity: 0.55; cursor: not-allowed; }

                .ep-btn.violet {
                    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
                    color: #fff;
                    box-shadow: 0 4px 16px rgba(124,58,237,0.3);
                    margin-top: 4px;
                }

                .ep-btn.violet:hover:not(:disabled) {
                    box-shadow: 0 6px 24px rgba(124,58,237,0.4);
                }

                .ep-btn.amber {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: #fff;
                    box-shadow: 0 4px 16px rgba(245,158,11,0.28);
                    margin-top: 4px;
                }

                .ep-btn.amber:hover:not(:disabled) {
                    box-shadow: 0 6px 24px rgba(245,158,11,0.38);
                }

                .ep-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                    flex-shrink: 0;
                }

                @keyframes spin { to { transform: rotate(360deg); } }

                .ep-form-fields { display: flex; flex-direction: column; gap: 14px; }
            `}</style>

            <div className="ep-page">
                <Navbar />
                <main className="ep-main">
                    <div className="ep-inner">

                        {/* Back */}
                        <button className="ep-back" onClick={() => router.back()}>
                            <ArrowLeft size={15} />
                            Back
                        </button>

                        {/* Hero */}
                        <div className="ep-hero">
                            <div className="ep-hero-avatar">{userInitial}</div>
                            <div>
                                <div className="ep-hero-name">{displayName}</div>
                                <div className="ep-hero-email">{user?.email}</div>
                                <div className="ep-hero-badge">
                                    <Shield size={10} />
                                    Active Account
                                </div>
                            </div>
                        </div>

                        {/* Personal Info */}
                        <div className="ep-card">
                            <div className="ep-card-header">
                                <div className="ep-card-icon violet"><User size={18} /></div>
                                <div>
                                    <div className="ep-card-title">Personal Information</div>
                                    <div className="ep-card-subtitle">Update your name and email address</div>
                                </div>
                            </div>

                            <form onSubmit={handleProfileSave} className="ep-form-fields">
                                <div className="ep-grid-2">
                                    <div className="ep-field">
                                        <label className="ep-label">First Name</label>
                                        <input
                                            type="text"
                                            className="ep-input"
                                            placeholder="John"
                                            value={form.first_name}
                                            onChange={e => setForm({ ...form, first_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="ep-field">
                                        <label className="ep-label">Last Name</label>
                                        <input
                                            type="text"
                                            className="ep-input"
                                            placeholder="Doe"
                                            value={form.last_name}
                                            onChange={e => setForm({ ...form, last_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="ep-field">
                                    <label className="ep-label">Email Address</label>
                                    <div className="ep-input-wrap">
                                        <Mail size={15} className="ep-input-icon" />
                                        <input
                                            type="email"
                                            className="ep-input with-left-icon"
                                            placeholder="john@example.com"
                                            value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="ep-field">
                                    <label className="ep-label">Phone Number</label>
                                    <div className="ep-input-wrap">
                                        <Phone size={15} className="ep-input-icon" />
                                        <input
                                            type="tel"
                                            className="ep-input with-left-icon"
                                            placeholder="+1 (555) 000-0000"
                                            value={form.phone_number}
                                            onChange={e => setForm({ ...form, phone_number: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button type="submit" disabled={isSavingProfile} className="ep-btn violet">
                                    {isSavingProfile ? (
                                        <><div className="ep-spinner" /> Saving…</>
                                    ) : (
                                        <><Save size={15} /> Save Changes</>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Change Password */}
                        <div className="ep-card">
                            <div className="ep-card-header">
                                <div className="ep-card-icon amber"><Lock size={18} /></div>
                                <div>
                                    <div className="ep-card-title">Change Password</div>
                                    <div className="ep-card-subtitle">Leave blank to keep your current password</div>
                                </div>
                            </div>

                            <form onSubmit={handlePasswordSave} className="ep-form-fields">
                                {/* Current password */}
                                <div className="ep-field">
                                    <label className="ep-label">Current Password</label>
                                    <div className="ep-input-wrap">
                                        <Lock size={15} className="ep-input-icon" />
                                        <input
                                            type={showCurrent ? 'text' : 'password'}
                                            className="ep-input with-left-icon with-right-icon"
                                            placeholder="Your current password"
                                            value={pwForm.current_password}
                                            onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
                                            required
                                        />
                                        <button type="button" className="ep-eye-btn" onClick={() => setShowCurrent(!showCurrent)}>
                                            {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                {/* New password */}
                                <div className="ep-field">
                                    <label className="ep-label">New Password</label>
                                    <div className="ep-input-wrap">
                                        <Lock size={15} className="ep-input-icon" />
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            className="ep-input with-left-icon with-right-icon"
                                            placeholder="Min 8 characters"
                                            value={pwForm.new_password}
                                            onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
                                            required
                                            minLength={8}
                                        />
                                        <button type="button" className="ep-eye-btn" onClick={() => setShowNew(!showNew)}>
                                            {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm password */}
                                <div className="ep-field">
                                    <label className="ep-label">Confirm New Password</label>
                                    <div className="ep-input-wrap">
                                        <Lock size={15} className="ep-input-icon" />
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            className="ep-input with-left-icon with-right-icon"
                                            placeholder="Repeat new password"
                                            value={pwForm.confirm_password}
                                            onChange={e => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                                            required
                                            minLength={8}
                                        />
                                        <button type="button" className="ep-eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                                            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {pwForm.confirm_password && (
                                        <p className={`ep-match-hint ${pwForm.new_password === pwForm.confirm_password ? 'match' : 'no-match'}`}>
                                            {pwForm.new_password === pwForm.confirm_password ? '✓ Passwords match' : '✗ Passwords do not match'}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSavingPassword || pwForm.new_password !== pwForm.confirm_password}
                                    className="ep-btn amber"
                                >
                                    {isSavingPassword ? (
                                        <><div className="ep-spinner" /> Updating…</>
                                    ) : (
                                        <><Shield size={15} /> Update Password</>
                                    )}
                                </button>
                            </form>
                        </div>

                    </div>
                </main>
            </div>
        </>
    );
}
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Wallet, HandCoins, BookUser, History, LogOut, Menu, X, Tags, ChevronDown, Pencil, CalendarClock } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

const NAV_LINKS = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/accounts', label: 'Accounts', icon: Wallet },
    { href: '/loans', label: 'Loans', icon: HandCoins },
    { href: '/contacts', label: 'Contacts', icon: BookUser },
    { href: '/categories', label: 'Categories', icon: Tags },
    { href: '/transactions', label: 'History', icon: History },
    { href: '/planned-expenses', label: 'Planned', icon: CalendarClock },
];

export default function Navbar() {
    const { logout, user } = useAuth();
    const { showToast } = useToast();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        showToast('Logged out successfully', 'info');
    };

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 600) setMobileMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const userInitial = user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
    const userName = user?.username || user?.email || 'Account';

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&family=Syne:wght@700;800&display=swap');

                *, *::before, *::after { box-sizing: border-box; }

                .xpense-nav-root {
                    position: sticky;
                    top: 12px;
                    z-index: 50;
                    padding: 0 16px;
                    margin-top: 12px;
                }

                .xpense-nav {
                    font-family: 'DM Sans', sans-serif;
                    width: 100%;
                    padding: 8px 12px;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 6px;
                    background: rgba(10, 10, 20, 0.75);
                    backdrop-filter: blur(20px) saturate(160%);
                    -webkit-backdrop-filter: blur(20px) saturate(160%);
                    border: 1px solid rgba(255,255,255,0.08);
                    box-shadow: 0 4px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07);
                    transition: box-shadow 0.3s ease, background 0.3s ease;
                }

                .xpense-nav.scrolled {
                    box-shadow: 0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09);
                    background: rgba(8, 8, 18, 0.92);
                }

                /* ── Logo ── */
                .nav-logo {
                    font-family: 'Syne', sans-serif;
                    font-weight: 800;
                    font-size: 1.25rem;
                    letter-spacing: -0.04em;
                    background: linear-gradient(135deg, #a78bfa 0%, #60a5fa 60%, #34d399 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-decoration: none;
                    line-height: 1;
                    flex-shrink: 0;
                }

                /* ── Center nav links ── */
                .nav-center {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    flex: 1;
                    justify-content: center;
                    overflow: hidden;
                    min-width: 0;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 7px 11px;
                    border-radius: 11px;
                    font-size: 0.8125rem;
                    font-weight: bold;
                    color: rgba(255,255,255);
                    text-decoration: none;
                    transition: color 0.2s, background 0.2s;
                    white-space: nowrap;
                    flex-shrink: 0;
                }

                .nav-link:hover {
                    color: rgba(255,255,255,0.92);
                    background: rgba(255,255,255,0.07);
                }

                .nav-link svg { opacity: 0.65; transition: opacity 0.2s; flex-shrink: 0; }
                .nav-link:hover svg { opacity: 1; }
                .nav-link.active { color: #fff; background: rgba(167,139,250,0.15); }
                .nav-link.active svg { opacity: 1; color: #a78bfa; }

                .nav-link-label { display: inline; }

                /* ── Divider ── */
                .nav-divider {
                    width: 1px;
                    height: 22px;
                    background: rgba(255,255,255,0.1);
                    flex-shrink: 0;
                    margin: 0 2px;
                }

                /* ── Right side (profile + mobile toggle) ── */
                .nav-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-shrink: 0;
                }

                /* ── Profile trigger ── */
                .profile-wrapper { position: relative; }

                .profile-trigger {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 5px 9px 5px 5px;
                    border-radius: 13px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.09);
                    cursor: pointer;
                    transition: background 0.2s, border-color 0.2s, transform 0.15s;
                    font-family: 'DM Sans', sans-serif;
                }

                .profile-trigger:hover {
                    background: rgba(255,255,255,0.09);
                    border-color: rgba(167,139,250,0.3);
                    transform: translateY(-1px);
                }

                .profile-trigger.open {
                    background: rgba(167,139,250,0.1);
                    border-color: rgba(167,139,250,0.35);
                }

                .profile-avatar {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: #fff;
                    font-family: 'Syne', sans-serif;
                    flex-shrink: 0;
                }

                .profile-name {
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: rgba(255,255,255,0.8);
                    max-width: 90px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .profile-chevron {
                    color: rgba(255,255,255,0.35);
                    transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), color 0.2s;
                    flex-shrink: 0;
                }

                .profile-trigger.open .profile-chevron {
                    transform: rotate(180deg);
                    color: rgba(167,139,250,0.8);
                }

                /* ── Dropdown panel ── */
                .profile-dropdown {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    min-width: 210px;
                    background: #45464E;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 18px;
                    padding: 8px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(167,139,250,0.07);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    transform-origin: top right;
                    animation: dropdownReveal 0.2s cubic-bezier(0.16,1,0.3,1);
                    z-index: 100;
                }

                @keyframes dropdownReveal {
                    from { opacity: 0; transform: scale(0.94) translateY(-6px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }

                .dropdown-header {
                    padding: 10px 12px 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                    margin-bottom: 6px;
                }

                .dropdown-header-avatar {
                    width: 38px;
                    height: 38px;
                    border-radius: 11px;
                    background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.95rem;
                    font-weight: 800;
                    color: #fff;
                    font-family: 'Syne', sans-serif;
                    margin-bottom: 8px;
                    box-shadow: 0 4px 16px rgba(124,58,237,0.35);
                }

                .dropdown-header-name {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: rgba(255,255,255,0.9);
                    line-height: 1.3;
                }

                .dropdown-header-email {
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.35);
                    margin-top: 2px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    border-radius: 11px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: rgba(255,255,255,0.65);
                    text-decoration: none;
                    transition: color 0.18s, background 0.18s;
                    cursor: pointer;
                    width: 100%;
                    border: none;
                    background: transparent;
                    font-family: 'DM Sans', sans-serif;
                    text-align: left;
                }

                .dropdown-item:hover { color: rgba(255,255,255,0.95); background: rgba(255,255,255,0.07); }
                .dropdown-item svg { opacity: 0.6; flex-shrink: 0; transition: opacity 0.18s; }
                .dropdown-item:hover svg { opacity: 1; }
                .dropdown-item.edit:hover { background: rgba(167,139,250,0.12); color: #c4b5fd; }
                .dropdown-item.edit:hover svg { color: #a78bfa; opacity: 1; }
                .dropdown-separator { height: 1px; background: rgba(255,255,255,0.07); margin: 6px 0; }
                .dropdown-item.logout { color: rgba(248,113,113,0.75); }
                .dropdown-item.logout:hover { color: #fff; background: rgba(239,68,68,0.65); }

                /* ── Mobile toggle ── */
                .mobile-toggle {
                    display: none;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.08);
                    color: rgba(255,255,255,0.8);
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: background 0.2s;
                }
                .mobile-toggle:hover { background: rgba(255,255,255,0.1); }

                /* ── Tablet (861–600): icon-only nav links, hide profile name ── */
                @media (max-width: 860px) and (min-width: 601px) {
                    .nav-link { padding: 7px 9px; }
                    .nav-link-label { display: none; }
                    .profile-name { display: none; }
                    .profile-trigger { padding: 5px 6px 5px 5px; gap: 5px; }
                }

                /* ── Mobile (≤600px): hamburger only ── */
                @media (max-width: 600px) {
                    .nav-center { display: none; }
                    .nav-divider { display: none; }
                    .profile-wrapper { display: none; }
                    .mobile-toggle { display: flex; }
                }

                /* ── Mobile overlay ── */
                .mobile-overlay {
                    display: none;
                    position: fixed;
                    inset: 0;
                    z-index: 40;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px);
                    animation: fadeIn 0.18s ease;
                }

                .mobile-overlay.open { display: block; }

                .mobile-drawer {
                    position: absolute;
                    top: 68px;
                    left: 12px;
                    right: 12px;
                    background: rgba(12, 12, 24, 0.98);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 20px;
                    padding: 10px;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
                    animation: slideDown 0.22s cubic-bezier(0.16,1,0.3,1);
                    overflow-y: auto;
                    max-height: calc(100dvh - 90px);
                }

                .mobile-user-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 14px 14px;
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                    margin-bottom: 8px;
                }

                .mobile-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.875rem;
                    font-weight: 800;
                    color: #fff;
                    font-family: 'Syne', sans-serif;
                    flex-shrink: 0;
                    box-shadow: 0 3px 12px rgba(124,58,237,0.35);
                }

                .mobile-user-name {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: rgba(255,255,255,0.9);
                    line-height: 1.3;
                }

                .mobile-user-email {
                    font-size: 0.72rem;
                    color: rgba(255,255,255,0.35);
                    margin-top: 1px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .mobile-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 11px 14px;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: rgba(255,255,255,0.6);
                    text-decoration: none;
                    transition: color 0.2s, background 0.2s;
                }

                .mobile-link:hover { color: #fff; background: rgba(255,255,255,0.07); }
                .mobile-link svg { opacity: 0.65; flex-shrink: 0; }
                .mobile-link:hover svg { opacity: 1; }

                .mobile-separator { height: 1px; background: rgba(255,255,255,0.07); margin: 8px 0; }

                .mobile-action {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 11px 14px;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: color 0.2s, background 0.2s;
                    font-family: 'DM Sans', sans-serif;
                    text-align: left;
                    text-decoration: none;
                }

                .mobile-action.edit { color: rgba(167,139,250,0.85); }
                .mobile-action.edit:hover { color: #c4b5fd; background: rgba(167,139,250,0.1); }
                .mobile-action.logout { color: rgba(248,113,113,0.85); }
                .mobile-action.logout:hover { color: #fff; background: rgba(239,68,68,0.6); }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>

            <div className="xpense-nav-root">
                <nav className={`xpense-nav${scrolled ? ' scrolled' : ''}`}>
                    {/* Logo */}
                    <Link href="/" className="nav-logo">XPENSE</Link>

                    {/* Center links — desktop & tablet */}
                    <div className="nav-center">
                        {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                            <Link key={href} href={href} className="nav-link">
                                <Icon size={15} />
                                <span className="nav-link-label">{label}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Right side */}
                    <div className="nav-right">
                        <div className="nav-divider" />

                        {/* Profile dropdown */}
                        <div className="profile-wrapper" ref={profileRef}>
                            <button
                                className={`profile-trigger${profileOpen ? ' open' : ''}`}
                                onClick={() => setProfileOpen(!profileOpen)}
                                aria-label="Profile menu"
                            >
                                <div className="profile-avatar">{userInitial}</div>
                                <span className="profile-name">{userName}</span>
                                <ChevronDown size={13} className="profile-chevron" />
                            </button>

                            {profileOpen && (
                                <div className="profile-dropdown">
                                    <div className="dropdown-header">
                                        <div className="dropdown-header-avatar">{userInitial}</div>
                                        <div className="dropdown-header-name">{user?.first_name + ' ' + user?.last_name || 'My Account'}</div>
                                        {user?.email && (
                                            <div className="dropdown-header-email">{user.email}</div>
                                        )}
                                    </div>

                                    <Link
                                        href="/profile/edit"
                                        className="dropdown-item edit"
                                        onClick={() => setProfileOpen(false)}
                                    >
                                        <Pencil size={15} />
                                        Edit Profile
                                    </Link>

                                    <div className="dropdown-separator" />

                                    <button
                                        className="dropdown-item logout"
                                        onClick={() => { handleLogout(); setProfileOpen(false); }}
                                    >
                                        <LogOut size={15} />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            className="mobile-toggle"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
                        </button>
                    </div>
                </nav>
            </div>

            {/* Mobile drawer */}
            <div
                className={`mobile-overlay${mobileMenuOpen ? ' open' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
            >
                <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
                    <div className="mobile-user-info">
                        <div className="mobile-avatar">{userInitial}</div>
                        <div style={{ minWidth: 0 }}>
                            <div className="mobile-user-name">{user?.first_name + ' ' + user?.last_name || 'My Account'}</div>
                            {user?.email && <div className="mobile-user-email">{user.email}</div>}
                        </div>
                    </div>

                    {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="mobile-link"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Icon size={19} />
                            {label}
                        </Link>
                    ))}

                    <div className="mobile-separator" />

                    <Link
                        href="/profile/edit"
                        className="mobile-action edit"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <Pencil size={19} />
                        Edit Profile
                    </Link>

                    <button
                        className="mobile-action logout"
                        onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    >
                        <LogOut size={19} />
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
}
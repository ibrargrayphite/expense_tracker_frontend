'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Wallet, HandCoins, BookUser, History, LogOut, Menu, X } from 'lucide-react';

const NAV_LINKS = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/accounts', label: 'Accounts', icon: Wallet },
    { href: '/loans', label: 'Loans', icon: HandCoins },
    { href: '/contacts', label: 'Contacts', icon: BookUser },
    { href: '/transactions', label: 'History', icon: History },
];

export default function Navbar() {
    const { logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap');

                .xpense-nav {
                    font-family: 'DM Sans', sans-serif;
                    position: sticky;
                    top: 16px;
                    z-index: 50;
                    margin: 16px 20px 0;
                    padding: 10px 16px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(10, 10, 20, 0.72);
                    backdrop-filter: blur(20px) saturate(160%);
                    -webkit-backdrop-filter: blur(20px) saturate(160%);
                    border: 1px solid rgba(255,255,255,0.08);
                    box-shadow: 0 4px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07);
                    transition: box-shadow 0.3s ease, background 0.3s ease;
                }

                .xpense-nav.scrolled {
                    box-shadow: 0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09);
                    background: rgba(8, 8, 18, 0.88);
                }

                .nav-logo {
                    font-family: 'Syne', sans-serif;
                    font-weight: 800;
                    font-size: 1.35rem;
                    letter-spacing: -0.04em;
                    background: linear-gradient(135deg, #a78bfa 0%, #60a5fa 60%, #34d399 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-decoration: none;
                    line-height: 1;
                }

                .nav-links {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    padding: 8px 14px;
                    border-radius: 12px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: rgba(255,255,255,0.55);
                    text-decoration: none;
                    transition: color 0.2s, background 0.2s;
                    position: relative;
                    white-space: nowrap;
                }

                .nav-link:hover {
                    color: rgba(255,255,255,0.95);
                    background: rgba(255,255,255,0.07);
                }

                .nav-link svg {
                    opacity: 0.7;
                    transition: opacity 0.2s;
                    flex-shrink: 0;
                }

                .nav-link:hover svg {
                    opacity: 1;
                }

                .nav-link.active {
                    color: #fff;
                    background: rgba(167,139,250,0.15);
                }

                .nav-link.active svg {
                    opacity: 1;
                    color: #a78bfa;
                }

                /* Logout button */
                .logout-btn {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    padding: 8px 14px;
                    border-radius: 12px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: rgba(248,113,113,0.8);
                    background: rgba(248,113,113,0.08);
                    border: 1px solid rgba(248,113,113,0.12);
                    cursor: pointer;
                    margin-left: 8px;
                    transition: color 0.2s, background 0.2s, border-color 0.2s, transform 0.15s;
                    white-space: nowrap;
                }

                .logout-btn:hover {
                    color: #fff;
                    background: rgba(239,68,68,0.7);
                    border-color: transparent;
                    transform: translateY(-1px);
                }

                /* Divider */
                .nav-divider {
                    width: 1px;
                    height: 24px;
                    background: rgba(255,255,255,0.1);
                    margin: 0 8px;
                    flex-shrink: 0;
                }

                /* Desktop only */
                .desktop-links { display: flex; align-items: center; }
                .mobile-toggle { display: none; }

                @media (max-width: 768px) {
                    .desktop-links { display: none; }
                    .mobile-toggle {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 38px;
                        height: 38px;
                        border-radius: 10px;
                        background: rgba(255,255,255,0.06);
                        border: 1px solid rgba(255,255,255,0.08);
                        color: rgba(255,255,255,0.8);
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    .mobile-toggle:hover { background: rgba(255,255,255,0.1); }
                }

                /* Mobile overlay */
                .mobile-overlay {
                    display: none;
                    position: fixed;
                    inset: 0;
                    z-index: 40;
                    background: rgba(0,0,0,0.65);
                    backdrop-filter: blur(4px);
                    animation: fadeIn 0.18s ease;
                }

                .mobile-overlay.open { display: block; }

                .mobile-drawer {
                    position: absolute;
                    top: 76px;
                    left: 16px;
                    right: 16px;
                    background: rgba(12, 12, 24, 0.97);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 20px;
                    padding: 12px;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
                    animation: slideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .mobile-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    font-size: 0.9375rem;
                    font-weight: 500;
                    color: rgba(255,255,255,0.6);
                    text-decoration: none;
                    transition: color 0.2s, background 0.2s;
                }

                .mobile-link:hover {
                    color: #fff;
                    background: rgba(255,255,255,0.07);
                }

                .mobile-link svg { opacity: 0.7; }
                .mobile-link:hover svg { opacity: 1; }

                .mobile-separator {
                    height: 1px;
                    background: rgba(255,255,255,0.07);
                    margin: 8px 0;
                }

                .mobile-logout {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 12px 16px;
                    border-radius: 12px;
                    font-size: 0.9375rem;
                    font-weight: 500;
                    color: rgba(248,113,113,0.85);
                    background: rgba(248,113,113,0.07);
                    border: none;
                    cursor: pointer;
                    transition: color 0.2s, background 0.2s;
                    font-family: 'DM Sans', sans-serif;
                }

                .mobile-logout:hover {
                    color: #fff;
                    background: rgba(239,68,68,0.6);
                }

                /* Pill indicator for active */
                .active-dot {
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: #a78bfa;
                    position: absolute;
                    bottom: 5px;
                    left: 50%;
                    transform: translateX(-50%);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>

            <nav className={`xpense-nav${scrolled ? ' scrolled' : ''}`}>
                <Link href="/" className="nav-logo">XPENSE</Link>

                {/* Desktop */}
                <div className="desktop-links">
                    <ul className="nav-links">
                        {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                            <li key={href}>
                                <Link href={href} className="nav-link">
                                    <Icon size={16} />
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="nav-divider" />
                    <button className="logout-btn" onClick={logout}>
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>

                {/* Mobile toggle */}
                <button
                    className="mobile-toggle"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </nav>

            {/* Mobile Menu */}
            <div
                className={`mobile-overlay${mobileMenuOpen ? ' open' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
            >
                <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
                    {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="mobile-link"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Icon size={20} />
                            {label}
                        </Link>
                    ))}
                    <div className="mobile-separator" />
                    <button
                        className="mobile-logout"
                        onClick={() => { logout(); setMobileMenuOpen(false); }}
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
}
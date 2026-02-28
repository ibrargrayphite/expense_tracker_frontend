'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Wallet, TrendingUp, Users, Shield, ArrowRight,
  BarChart3, CreditCard, Repeat, ChevronRight,
  Star, CheckCircle, Zap, Globe
} from 'lucide-react';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [counted, setCounted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setCounted(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        .lp-root {
          min-height: 100vh;
          background: #030712;
          color: #f0f0ff;
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
        }

        /* ── Nav ── */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 16px 24px;
          display: flex; align-items: center; justify-content: space-between;
          transition: background 0.3s, border-color 0.3s, backdrop-filter 0.3s;
        }
        .lp-nav.scrolled {
          background: rgba(3,7,18,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(139,92,246,0.15);
        }
        .lp-logo {
          display: flex; align-items: center; gap: 10px;
          font-size: 1.25rem; font-weight: 800; letter-spacing: -0.04em;
          color: #f0f0ff; text-decoration: none;
        }
        .lp-logo-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px rgba(124,58,237,0.5);
        }
        .lp-nav-links { display: flex; align-items: center; gap: 8px; }
        .lp-btn-ghost {
          padding: 9px 20px; border-radius: 10px; border: none;
          background: transparent; color: rgba(240,240,255,0.75);
          font-size: 0.875rem; font-weight: 600; cursor: pointer;
          text-decoration: none; transition: color 0.2s, background 0.2s;
          font-family: inherit;
        }
        .lp-btn-ghost:hover { color: #f0f0ff; background: rgba(255,255,255,0.06); }
        .lp-btn-primary {
          padding: 9px 22px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #fff; font-size: 0.875rem; font-weight: 700;
          cursor: pointer; text-decoration: none;
          box-shadow: 0 4px 20px rgba(124,58,237,0.4);
          transition: transform 0.15s, box-shadow 0.15s;
          font-family: inherit; display: inline-flex; align-items: center; gap: 6px;
        }
        .lp-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(124,58,237,0.55);
        }

        /* ── Hero ── */
        .lp-hero {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
          padding: 120px 24px 80px;
          position: relative; overflow: hidden;
        }
        .lp-hero-glow {
          position: absolute; width: 900px; height: 900px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%);
          top: 50%; left: 50%; transform: translate(-50%, -60%);
          pointer-events: none;
        }
        .lp-hero-glow2 {
          position: absolute; width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
          top: 60%; right: -10%; pointer-events: none;
        }
        .lp-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 16px; border-radius: 100px;
          border: 1px solid rgba(124,58,237,0.4);
          background: rgba(124,58,237,0.1);
          color: #a78bfa; font-size: 0.75rem; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          margin-bottom: 28px;
          animation: lp-fadein 0.6s ease forwards;
        }
        .lp-hero-title {
          font-size: clamp(2.5rem, 7vw, 5rem);
          font-weight: 900; letter-spacing: -0.04em; line-height: 1.07;
          margin-bottom: 24px;
          animation: lp-fadein 0.7s ease 0.1s both;
        }
        .lp-gradient-text {
          background: linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #34d399 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-hero-sub {
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: rgba(200,200,230,0.7); line-height: 1.7; max-width: 580px;
          margin: 0 auto 48px;
          animation: lp-fadein 0.7s ease 0.2s both;
        }
        .lp-hero-cta {
          display: flex; gap: 14px; flex-wrap: wrap; justify-content: center;
          animation: lp-fadein 0.7s ease 0.3s both;
        }
        .lp-btn-hero {
          padding: 16px 36px; border-radius: 14px; border: none;
          background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
          color: #fff; font-size: 1rem; font-weight: 700;
          cursor: pointer; text-decoration: none;
          box-shadow: 0 8px 32px rgba(124,58,237,0.45);
          transition: transform 0.15s, box-shadow 0.15s;
          font-family: inherit; display: inline-flex; align-items: center; gap: 8px;
        }
        .lp-btn-hero:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(124,58,237,0.6);
        }
        .lp-btn-outline {
          padding: 16px 36px; border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.04);
          color: rgba(240,240,255,0.85); font-size: 1rem; font-weight: 600;
          cursor: pointer; text-decoration: none;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
          font-family: inherit; display: inline-flex; align-items: center; gap: 8px;
        }
        .lp-btn-outline:hover {
          border-color: rgba(124,58,237,0.5);
          background: rgba(124,58,237,0.08);
          transform: translateY(-2px);
        }

        /* ── Dashboard preview ── */
        .lp-preview-wrap {
          margin-top: 80px; position: relative;
          animation: lp-fadein 0.8s ease 0.5s both;
          width: min(900px, 96vw); margin-left: auto; margin-right: auto;
        }
        .lp-preview-frame {
          border-radius: 20px; overflow: hidden;
          border: 1px solid rgba(124,58,237,0.25);
          box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
          background: #0f0d1a;
          padding: 24px;
        }
        .lp-preview-topbar {
          display: flex; gap: 6px; margin-bottom: 20px;
        }
        .lp-dot { width: 10px; height: 10px; border-radius: 50%; }
        .lp-preview-cards {
          display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 16px;
        }
        @media(max-width:640px){ .lp-preview-cards { grid-template-columns: repeat(2,1fr); } }
        .lp-preview-card {
          background: rgba(255,255,255,0.04); border-radius: 12px; padding: 14px;
          border: 1px solid rgba(255,255,255,0.07);
        }
        .lp-preview-label { font-size: 9px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
        .lp-preview-val { font-size: 1rem; font-weight: 800; color: #f0f0ff; }
        .lp-preview-sub { font-size: 8px; color: rgba(160,255,180,0.8); margin-top: 4px; }
        .lp-preview-bottom {
          display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px;
        }
        @media(max-width:560px){ .lp-preview-bottom { grid-template-columns: 1fr; } }
        .lp-preview-chart-placeholder {
          background: rgba(255,255,255,0.03); border-radius: 12px; padding: 14px;
          border: 1px solid rgba(255,255,255,0.06); height: 100px;
          display:flex; align-items:flex-end; gap: 6px; overflow: hidden;
        }
        .lp-bar {
          flex: 1; border-radius: 4px 4px 0 0;
          background: linear-gradient(180deg, #7c3aed, #4f46e5);
          opacity: 0.7; transition: height 0.8s cubic-bezier(0.34,1.56,0.64,1);
        }
        .lp-preview-list {
          background: rgba(255,255,255,0.03); border-radius: 12px; padding: 14px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .lp-preview-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.045);
          font-size: 10px;
        }
        .lp-preview-row:last-child { border-bottom: none; }
        .lp-preview-row-name { color: rgba(255,255,255,0.6); }
        .lp-preview-row-amt { font-weight: 700; }

        /* ── Stats ── */
        .lp-stats {
          display: flex; justify-content: center; gap: 60px; flex-wrap: wrap;
          padding: 60px 24px; border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .lp-stat { text-align: center; }
        .lp-stat-num {
          font-size: 2.5rem; font-weight: 900; letter-spacing: -0.04em;
          background: linear-gradient(135deg, #a78bfa, #60a5fa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .lp-stat-label { font-size: 0.8125rem; color: rgba(200,200,230,0.5); margin-top: 4px; font-weight: 500; }

        /* ── Features ── */
        .lp-section { padding: 100px 24px; max-width: 1100px; margin: 0 auto; }
        .lp-section-label {
          display: inline-block; font-size: 0.75rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #a78bfa; margin-bottom: 14px;
        }
        .lp-section-title {
          font-size: clamp(1.875rem, 4vw, 3rem);
          font-weight: 900; letter-spacing: -0.04em; line-height: 1.1;
          margin-bottom: 16px;
        }
        .lp-section-sub {
          font-size: 1.0625rem; color: rgba(200,200,230,0.6);
          max-width: 520px; line-height: 1.7; margin-bottom: 60px;
        }
        .lp-features-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
        }
        @media(max-width:768px){ .lp-features-grid { grid-template-columns: 1fr; } }
        @media(min-width:640px) and (max-width:768px){ .lp-features-grid { grid-template-columns: repeat(2,1fr); } }
        .lp-feature-card {
          background: rgba(255,255,255,0.03); border-radius: 20px; padding: 28px;
          border: 1px solid rgba(255,255,255,0.07);
          transition: transform 0.2s, border-color 0.2s, background 0.2s;
        }
        .lp-feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(124,58,237,0.35);
          background: rgba(124,58,237,0.06);
        }
        .lp-feature-icon {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }
        .lp-feature-title { font-size: 1rem; font-weight: 700; margin-bottom: 10px; color: #f0f0ff; }
        .lp-feature-desc { font-size: 0.875rem; color: rgba(200,200,230,0.55); line-height: 1.65; }

        /* ── How it works ── */
        .lp-steps { display: flex; flex-direction: column; gap: 0; }
        .lp-step {
          display: grid; grid-template-columns: 56px 1fr; gap: 24px;
          padding: 32px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
          align-items: start;
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
        .lp-step:last-child { border-bottom: none; }
        .lp-step-num {
          width: 48px; height: 48px; border-radius: 14px;
          background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.2));
          border: 1px solid rgba(124,58,237,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.875rem; font-weight: 800; color: #a78bfa; flex-shrink: 0;
        }
        .lp-step-title { font-size: 1.0625rem; font-weight: 700; margin-bottom: 8px; }
        .lp-step-desc { font-size: 0.875rem; color: rgba(200,200,230,0.55); line-height: 1.65; }

        /* ── Testimonials ── */
        .lp-testimonials-grid {
          display: grid; grid-template-columns: repeat(3,1fr); gap: 20px;
        }
        @media(max-width:768px){ .lp-testimonials-grid { grid-template-columns: 1fr; } }
        .lp-testimonial {
          background: rgba(255,255,255,0.03); border-radius: 20px; padding: 28px;
          border: 1px solid rgba(255,255,255,0.07);
        }
        .lp-stars { display:flex; gap:3px; margin-bottom: 16px; color: #f59e0b; }
        .lp-testimonial-text { font-size: 0.9375rem; color: rgba(200,200,230,0.7); line-height: 1.7; margin-bottom: 20px; font-style: italic; }
        .lp-testimonial-author { display:flex; align-items:center; gap: 12px; }
        .lp-author-avatar {
          width: 38px; height: 38px; border-radius: 12px;
          display:flex; align-items:center; justify-content:center;
          font-size: 0.875rem; font-weight: 800; color: #fff;
        }
        .lp-author-name { font-size: 0.875rem; font-weight: 700; color: #f0f0ff; }
        .lp-author-role { font-size: 0.75rem; color: rgba(200,200,230,0.45); }

        /* ── CTA ── */
        .lp-cta-section {
          margin: 0 24px 100px; padding: 80px 40px;
          border-radius: 28px; text-align: center;
          background: linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(59,130,246,0.15) 100%);
          border: 1px solid rgba(124,58,237,0.3);
          position: relative; overflow: hidden;
        }
        .lp-cta-glow {
          position: absolute; width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%);
          top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none;
        }
        .lp-cta-title { font-size: clamp(1.75rem,4vw,2.75rem); font-weight: 900; letter-spacing: -0.04em; margin-bottom: 16px; }
        .lp-cta-sub { font-size: 1.0625rem; color: rgba(200,200,230,0.65); margin-bottom: 40px; }
        .lp-cta-buttons { display:flex; gap: 14px; justify-content: center; flex-wrap: wrap; position: relative; }

        /* ── Footer ── */
        .lp-footer {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 40px 24px; text-align: center;
          color: rgba(200,200,230,0.35); font-size: 0.8125rem;
          display: flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;
          max-width: 1100px; margin: 0 auto;
        }
        .lp-footer-links { display: flex; gap: 20px; }
        .lp-footer-link { color: rgba(200,200,230,0.35); text-decoration: none; transition: color 0.2s; }
        .lp-footer-link:hover { color: #a78bfa; }

        /* ── Animations ── */
        @keyframes lp-fadein {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lp-check { color: #34d399; flex-shrink: 0; margin-top: 2px; }
      `}</style>

      <div className="lp-root">
        {/* ── Navbar ── */}
        <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
          <Link href="/" className="auth-logo">XPENSE</Link>

          <div className="lp-nav-links">
            <Link href="/login" className="lp-btn-ghost">Sign In</Link>
            <Link href="/login" className="lp-btn-primary">
              Get Started <ChevronRight size={14} />
            </Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="lp-hero">
          <div className="lp-hero-glow" />
          <div className="lp-hero-glow2" />

          <div className="lp-badge">
            <Zap size={11} /> Smart Finance Tracking
          </div>

          <h1 className="lp-hero-title">
            Take control of<br />
            <span className="lp-gradient-text">your finances</span>
          </h1>

          <p className="lp-hero-sub">
            Track expenses, manage loans, and monitor all your bank accounts in one
            beautiful dashboard. Know exactly where your money goes.
          </p>

          <div className="lp-hero-cta">
            <Link href="/login" className="lp-btn-hero">
              Start for Free <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="lp-btn-outline">
              Sign In
            </Link>
          </div>

          {/* Dashboard Preview */}
          <div className="lp-preview-wrap">
            <div className="lp-preview-frame">
              <div className="lp-preview-topbar">
                <div className="lp-dot" style={{ background: '#ff5f57' }} />
                <div className="lp-dot" style={{ background: '#febc2e' }} />
                <div className="lp-dot" style={{ background: '#28c840' }} />
              </div>
              <div className="lp-preview-cards">
                {[
                  { label: 'Total Balance', val: 'Rs. 284,500', sub: '+12.4% this month', color: '#a78bfa' },
                  { label: 'Money Lent', val: 'Rs. 45,000', sub: 'To be received', color: '#34d399' },
                  { label: 'Loans Taken', val: 'Rs. 20,000', sub: 'To be repaid', color: '#f87171' },
                  { label: 'Net Cash Flow', val: 'Rs. 38,200', sub: 'Last 30 days', color: '#60a5fa' },
                ].map((c) => (
                  <div key={c.label} className="lp-preview-card">
                    <div className="lp-preview-label">{c.label}</div>
                    <div className="lp-preview-val" style={{ color: c.color }}>{c.val}</div>
                    <div className="lp-preview-sub">{c.sub}</div>
                  </div>
                ))}
              </div>
              <div className="lp-preview-bottom">
                <div className="lp-preview-chart-placeholder">
                  {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <div key={i} className="lp-bar" style={{ height: counted ? `${h}%` : '4px' }} />
                  ))}
                </div>
                <div className="lp-preview-list">
                  {[
                    { name: 'Groceries', amt: '-Rs. 3,200', color: '#f87171' },
                    { name: 'Salary', amt: '+Rs. 85,000', color: '#34d399' },
                    { name: 'Electricity', amt: '-Rs. 4,500', color: '#f87171' },
                    { name: 'Freelance', amt: '+Rs. 25,000', color: '#34d399' },
                  ].map((r) => (
                    <div key={r.name} className="lp-preview-row">
                      <span className="lp-preview-row-name">{r.name}</span>
                      <span className="lp-preview-row-amt" style={{ color: r.color }}>{r.amt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <div ref={statsRef} className="lp-stats">
          {[
            { num: '50K+', label: 'Transactions Tracked' },
            { num: '10K+', label: 'Active Users' },
            { num: '99.9%', label: 'Uptime Guarantee' },
            { num: '4.9★', label: 'Average Rating' },
          ].map((s) => (
            <div key={s.label} className="lp-stat">
              <div className="lp-stat-num">{s.num}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Features ── */}
        <section className="lp-section">
          <span className="lp-section-label">Everything You Need</span>
          <h2 className="lp-section-title">Powerful features,<br />simple interface</h2>
          <p className="lp-section-sub">
            Every tool you need to understand and control your personal finances — all in one place.
          </p>
          <div className="lp-features-grid">
            {[
              {
                icon: <BarChart3 size={22} color="#a78bfa" />,
                bg: 'rgba(124,58,237,0.15)',
                title: 'Smart Dashboard',
                desc: 'Visual charts and real-time stats give you an instant snapshot of your financial health — income, expenses, and trends at a glance.',
              },
              {
                icon: <CreditCard size={22} color="#60a5fa" />,
                bg: 'rgba(59,130,246,0.15)',
                title: 'Multi-Account Management',
                desc: 'Connect all your bank accounts and wallets. Track balances across HBL, UBL, MCB, and more — even your cash wallet.',
              },
              {
                icon: <Users size={22} color="#34d399" />,
                bg: 'rgba(52,211,153,0.15)',
                title: 'Contact & Loan Tracking',
                desc: 'Keep track of money you\'ve lent or borrowed. Automatically manage loan balances and get notified when they\'re settled.',
              },
              {
                icon: <Repeat size={22} color="#f59e0b" />,
                bg: 'rgba(245,158,11,0.15)',
                title: 'Internal Transfers',
                desc: 'Move money between your own accounts instantly. Balances update automatically so you\'re always in sync.',
              },
              {
                icon: <TrendingUp size={22} color="#f87171" />,
                bg: 'rgba(248,113,113,0.15)',
                title: 'Income & Expense Categories',
                desc: 'Customize income sources and expense categories. See exactly where your money comes from and where it goes.',
              },
              {
                icon: <Shield size={22} color="#c084fc" />,
                bg: 'rgba(192,132,252,0.15)',
                title: 'Secure & Private',
                desc: 'JWT authentication and encrypted data ensure your financial information stays private and secure at all times.',
              },
            ].map((f) => (
              <div key={f.title} className="lp-feature-card">
                <div className="lp-feature-icon" style={{ background: f.bg }}>{f.icon}</div>
                <div className="lp-feature-title">{f.title}</div>
                <div className="lp-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '100px 24px' }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <span className="lp-section-label">How It Works</span>
            <h2 className="lp-section-title" style={{ marginBottom: 48 }}>Up and running<br />in 3 steps</h2>
            <div className="lp-steps">
              {[
                { n: '01', title: 'Create your account', desc: 'Sign up in seconds with just your name, email, and password. No credit card required — completely free to start.' },
                { n: '02', title: 'Add your accounts & contacts', desc: 'Add your bank accounts and cash wallet. Then add contacts for people you lend to or borrow from.' },
                { n: '03', title: 'Track every transaction', desc: 'Record income, expenses, transfers, and loans. Watch your dashboard come alive with charts and insights.' },
              ].map((s) => (
                <div key={s.n} className="lp-step">
                  <div className="lp-step-num">{s.n}</div>
                  <div>
                    <div className="lp-step-title">{s.title}</div>
                    <div className="lp-step-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="lp-section">
          <span className="lp-section-label">Loved by Users</span>
          <h2 className="lp-section-title" style={{ marginBottom: 48 }}>People trust XPENSE</h2>
          <div className="lp-testimonials-grid">
            {[
              { text: '"XPENSE completely changed how I manage money. The loan tracking feature alone saved me from losing track of thousands of rupees."', name: 'Ahmed Raza', role: 'Freelancer, Lahore', initial: 'A', color: '#7c3aed' },
              { text: '"I manage 4 bank accounts and XPENSE keeps them all in sync. The dashboard charts make it so easy to see my financial health."', name: 'Sara Malik', role: 'Business Owner, Karachi', initial: 'S', color: '#3b82f6' },
              { text: '"Finally an expense tracker that tracks loans too! I was using spreadsheets before — XPENSE is 10x better."', name: 'Usman Khan', role: 'Software Engineer, Islamabad', initial: 'U', color: '#10b981' },
            ].map((t) => (
              <div key={t.name} className="lp-testimonial">
                <div className="lp-stars">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#f59e0b" />)}</div>
                <p className="lp-testimonial-text">{t.text}</p>
                <div className="lp-testimonial-author">
                  <div className="lp-author-avatar" style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}99)` }}>{t.initial}</div>
                  <div>
                    <div className="lp-author-name">{t.name}</div>
                    <div className="lp-author-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="lp-cta-section">
          <div className="lp-cta-glow" />
          <h2 className="lp-cta-title">Ready to take control?</h2>
          <p className="lp-cta-sub">Join thousands of users who trust XPENSE to manage their finances.</p>
          <div className="lp-cta-buttons">
            <Link href="/login" className="lp-btn-hero">
              Create Free Account <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="lp-btn-outline">
              I already have an account
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 28, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}>
            {['No credit card required', 'Free forever', 'Secure & private'].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'rgba(200,200,230,0.5)' }}>
                <CheckCircle size={14} className="lp-check" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px', maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Link href="/" className="lp-logo" style={{ fontSize: '1rem' }}>
            <div className="lp-logo-icon" style={{ width: 28, height: 28, borderRadius: 8 }}><Wallet size={15} color="#fff" /></div>
            XPENSE
          </Link>
          <div style={{ fontSize: '0.8125rem', color: 'rgba(200,200,230,0.3)' }}>© 2026 XPENSE. Built for financial clarity.</div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['Sign In', '/login'], ['Register', '/login']].map(([label, href]) => (
              <Link key={label} href={href} className="lp-footer-link">{label}</Link>
            ))}
          </div>
        </footer>
      </div>
    </>
  );
}

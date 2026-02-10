'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('token/', { username, password });
            login(response.data.access, response.data.refresh);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
            <div className="card glass-morphism w-full max-w-md animate-fade-in" style={{ padding: '2.5rem' }}>
                <h1 className="text-3xl font-bold mb-2 text-center" style={{ color: 'white' }}>Welcome Back</h1>
                <p className="text-center mb-8" style={{ color: 'rgba(255,255,255,0.8)' }}>Log in to manage your finances</p>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-white text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>Username</label>
                        <input
                            type="text"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-full mt-6" style={{ background: '#f43f5e' }}>
                        Sign In
                    </button>
                </form>

                <p className="mt-8 text-center text-sm" style={{ color: 'white' }}>
                    Don't have an account? {' '}
                    <Link href="/register" className="font-bold underline">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
}

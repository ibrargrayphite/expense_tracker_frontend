'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/error-handler';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('users/', { username, email, password });
            router.push('/login');
        } catch (err: any) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #2dd4bf 100%)' }}>
            <div className="card glass-morphism w-full max-w-md animate-fade-in" style={{ padding: '2.5rem' }}>
                <h1 className="text-3xl font-bold mb-2 text-center" style={{ color: 'white' }}>Create Account</h1>
                <p className="text-center mb-8" style={{ color: 'rgba(255,255,255,0.8)' }}>Start tracking your expenses today</p>

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
                        <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>Email</label>
                        <input
                            type="email"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                    <button type="submit" className="btn btn-primary w-full mt-6" style={{ background: '#6366f1' }}>
                        Register
                    </button>
                </form>

                <p className="mt-8 text-center text-sm" style={{ color: 'white' }}>
                    Already have an account? {' '}
                    <Link href="/login" className="font-bold underline">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
}

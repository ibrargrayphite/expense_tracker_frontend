'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Plus, Trash2, Edit3, X, Phone, User as UserIcon, CreditCard } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';

interface ContactAccount {
    id: number;
    account_name: string;
    account_number: string;
}

interface Contact {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    accounts: ContactAccount[];
}

export default function ContactsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' });
    const [editingAccount, setEditingAccount] = useState<ContactAccount | null>(null);
    const [accountForm, setAccountForm] = useState({ account_name: '', account_number: '' });
    const [confirmDeleteContact, setConfirmDeleteContact] = useState<number | null>(null);
    const [confirmDeleteAccount, setConfirmDeleteAccount] = useState<number | null>(null);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (user) fetchContacts();
    }, [user, loading]);

    const fetchContacts = async () => {
        try {
            const res = await api.get('contacts/');
            setContacts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenModal = (contact: Contact | null = null) => {
        if (contact) {
            setEditingContact(contact);
            setForm({ first_name: contact.first_name, last_name: contact.last_name, phone: contact.phone });
        } else {
            setEditingContact(null);
            setForm({ first_name: '', last_name: '', phone: '' });
        }
        setIsModalOpen(true);
    };

    const handleOpenAccountModal = (contact: Contact, account: ContactAccount | null = null) => {
        setSelectedContact(contact);
        if (account) {
            setEditingAccount(account);
            setAccountForm({ account_name: account.account_name, account_number: account.account_number });
        } else {
            setEditingAccount(null);
            setAccountForm({ account_name: '', account_number: '' });
        }
        setIsAccountModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingContact) {
                await api.put(`contacts/${editingContact.id}/`, form);
                showToast('Contact updated!', 'success');
            } else {
                await api.post('contacts/', form);
                showToast('Contact added!', 'success');
            }
            setIsModalOpen(false);
            setEditingContact(null);
            setForm({ first_name: '', last_name: '', phone: '' });
            fetchContacts();
        } catch (err) {
            showToast('Something went wrong. Please try again.', 'error');
            console.error(err);
        }
    };

    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContact) return;
        try {
            if (editingAccount) {
                await api.put(`contact-accounts/${editingAccount.id}/`, {
                    ...accountForm,
                    contact: selectedContact.id
                });
            } else {
                await api.post('contact-accounts/', {
                    ...accountForm,
                    contact: selectedContact.id
                });
            }
            setIsAccountModalOpen(false);
            setEditingAccount(null);
            setAccountForm({ account_name: '', account_number: '' });
            fetchContacts();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteContact = async (id: number) => {
        try {
            await api.delete(`contacts/${id}/`);
            showToast('Contact deleted.', 'info');
            fetchContacts();
        } catch (err) {
            showToast('Failed to delete contact.', 'error');
            console.error(err);
        } finally {
            setConfirmDeleteContact(null);
        }
    };

    const deleteAccount = async (id: number) => {
        try {
            await api.delete(`contact-accounts/${id}/`);
            showToast('Account removed from contact.', 'info');
            fetchContacts();
        } catch (err) {
            showToast('Failed to delete account.', 'error');
            console.error(err);
        } finally {
            setConfirmDeleteAccount(null);
        }
    };

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8 animate-fade-in">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Contacts</h1>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        <Plus size={20} /> Add Contact
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {contacts.map((contact: Contact) => (
                        <div key={contact.id} className="card p-6 flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                                        {contact.first_name[0]}{contact.last_name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{contact.first_name} {contact.last_name}</h3>
                                        <p className="text-secondary flex items-center gap-2 mt-1">
                                            <Phone size={14} /> {contact.phone}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleOpenModal(contact)} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors">
                                        <Edit3 size={20} />
                                    </button>
                                    <button onClick={() => setConfirmDeleteContact(contact.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider text-secondary">
                                        <CreditCard size={16} /> Accounts
                                    </h4>
                                    <button
                                        onClick={() => handleOpenAccountModal(contact)}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Add Account
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {contact.accounts.map((acc) => (
                                        <div key={acc.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl flex items-center justify-between group">
                                            <div>
                                                <p className="font-bold text-sm">{acc.account_name}</p>
                                                <p className="text-xs text-secondary">{acc.account_number}</p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenAccountModal(contact, acc)} className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                                                    <Edit3 size={14} />
                                                </button>
                                                <button onClick={() => setConfirmDeleteAccount(acc.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {contact.accounts.length === 0 && (
                                        <p className="text-xs text-secondary italic">No accounts linked.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {contacts.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl text-secondary">
                            No contacts added yet.
                        </div>
                    )}
                </div>
            </main>

            {/* Contact Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="card w-full max-w-md animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">{editingContact ? 'Edit Contact' : 'New Contact'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">First Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={form.first_name}
                                        onChange={e => setForm({ ...form, first_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={form.last_name}
                                        onChange={e => setForm({ ...form, last_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="+92..."
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-full mt-4">
                                {editingContact ? 'Update Contact' : 'Save Contact'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Account Modal */}
            {isAccountModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="card w-full max-w-md animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">
                                {editingAccount ? `Edit Account for ${selectedContact?.first_name} ${selectedContact?.last_name}` : `Add Account for ${selectedContact?.first_name} ${selectedContact?.last_name}`}
                            </h2>
                            <button onClick={() => setIsAccountModalOpen(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddAccount} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Bank / Platform Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. JazzCash, Meezan Bank"
                                    value={accountForm.account_name}
                                    onChange={e => setAccountForm({ ...accountForm, account_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Account Number / IBAN</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="0300..."
                                    value={accountForm.account_number}
                                    onChange={e => setAccountForm({ ...accountForm, account_number: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-full mt-4">
                                {editingAccount ? 'Update Account' : 'Add Account'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmModal
                isOpen={confirmDeleteContact !== null}
                title="Delete Contact"
                message="Are you sure? This will permanently delete this contact and all their associated accounts."
                confirmText="Yes, Delete"
                onConfirm={() => confirmDeleteContact !== null && deleteContact(confirmDeleteContact)}
                onCancel={() => setConfirmDeleteContact(null)}
            />
            <ConfirmModal
                isOpen={confirmDeleteAccount !== null}
                title="Remove Account"
                message="Are you sure you want to remove this account from the contact?"
                confirmText="Yes, Remove"
                onConfirm={() => confirmDeleteAccount !== null && deleteAccount(confirmDeleteAccount)}
                onCancel={() => setConfirmDeleteAccount(null)}
            />
        </div>
    );
}

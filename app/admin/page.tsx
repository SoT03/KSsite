// app/admin/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/Navigation';
import AmbientBackground from '@/components/AmbientBackground';
import LoadingScreen from '@/components/LoadingScreen';

interface Message {
  id: string;
  dayNumber: number;
  content: string;
  year: number;
}

interface Account {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminPage() {
  const [tab, setTab] = useState<'messages' | 'accounts'>('messages');

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ dayNumber: 1, content: '' });
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountFormData, setAccountFormData] = useState({ name: '', email: '', password: '', role: 'user' });

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages?year=' + new Date().getFullYear());
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setStatusMessage('Nie udało się wczytać wiadomości');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setAccounts(data.users || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setStatusMessage('Nie udało się wczytać kont');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');

    if (!token || role !== 'admin') {
      router.push('/login');
      return;
    }

    // Syncing React state from localStorage (an external store), guarded to client-only via this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAuthenticated(true);
    fetchMessages();
    fetchAccounts();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');
    setIsSubmitting(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `/api/messages/${editingId}`
        : '/api/messages';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          year: new Date().getFullYear(),
        }),
      });

      if (response.ok) {
        const saved = await response.json();
        // Update the local list from the response directly instead of
        // re-fetching the whole table — saves a round trip and avoids the
        // add/edit feeling slow.
        setMessages((prev) =>
          editingId
            ? prev.map((m) => (m.id === saved.id ? saved : m))
            : [...prev, saved]
        );
        setStatusMessage(editingId ? 'Wiadomość zaktualizowana!' : 'Wiadomość dodana!');
        setShowModal(false);
        setEditingId(null);
        setFormData({ dayNumber: 1, content: '' });

        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        const error = await response.json();
        setStatusMessage(error.error || 'Coś poszło nie tak');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatusMessage('Błąd zapisu wiadomości');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMessage = () => {
    const nextDay = messages.length
      ? Math.max(...messages.map((m) => m.dayNumber)) + 1
      : 1;
    setFormData({ dayNumber: nextDay, content: '' });
    setShowModal(true);
  };

  const handleEdit = (message: Message) => {
    setEditingId(message.id);
    setFormData({
      dayNumber: message.dayNumber,
      content: message.content,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę wiadomość?')) return;

    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setStatusMessage('Wiadomość usunięta!');
        fetchMessages();
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      setStatusMessage('Błąd usuwania wiadomości');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ dayNumber: 1, content: '' });
  };

  const handleAddAccount = () => {
    setEditingAccountId(null);
    setAccountFormData({ name: '', email: '', password: '', role: 'user' });
    setShowAccountModal(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccountId(account.id);
    setAccountFormData({ name: account.name, email: account.email, password: '', role: account.role });
    setShowAccountModal(true);
  };

  const handleCloseAccountModal = () => {
    setShowAccountModal(false);
    setEditingAccountId(null);
    setAccountFormData({ name: '', email: '', password: '', role: 'user' });
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');

    try {
      const url = editingAccountId ? `/api/users/${editingAccountId}` : '/api/users';
      const method = editingAccountId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: accountFormData.name,
          email: accountFormData.email,
          role: accountFormData.role,
          ...(accountFormData.password && { password: accountFormData.password }),
        }),
      });

      if (response.ok) {
        setStatusMessage(editingAccountId ? 'Konto zaktualizowane!' : 'Konto utworzone!');
        handleCloseAccountModal();
        fetchAccounts();
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        const error = await response.json();
        setStatusMessage(error.error || 'Coś poszło nie tak');
      }
    } catch (error) {
      console.error('Error saving account:', error);
      setStatusMessage('Błąd zapisu konta');
    }
  };

  if (!isAuthenticated || isLoading) {
    return <LoadingScreen icon="⚙️" />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-pink-50">
      <AmbientBackground />
      <Navigation />

      <div className="relative max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-6"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Panel administratora
            </h1>
            <p className="text-gray-600">
              Zarządzaj wiadomościami i kontami
            </p>
          </div>
          {tab === 'messages' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddMessage}
              className="mt-4 md:mt-0 px-6 py-3 bg-linear-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition"
            >
              + Dodaj wiadomość
            </motion.button>
          )}
          {tab === 'accounts' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddAccount}
              className="mt-4 md:mt-0 px-6 py-3 bg-linear-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition"
            >
              + Dodaj konto
            </motion.button>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 bg-white/30 border border-white/40 rounded-full p-1 w-fit">
          {(['messages', 'accounts'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`
                px-5 py-2 rounded-full text-sm font-medium transition-colors capitalize
                ${tab === t ? 'bg-linear-to-r from-rose-500 to-pink-500 text-white shadow-md' : 'text-gray-700 hover:text-rose-600'}
              `}
            >
              {t === 'messages' ? '💌 Wiadomości' : '👤 Konta'}
            </button>
          ))}
        </div>

        {/* Status Message */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg"
            >
              {statusMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {tab === 'messages' ? (
          /* Messages Table */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl overflow-hidden shadow-xl"
          >
            {messages.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <p className="text-lg mb-4">Brak wiadomości</p>
                <p className="text-sm">Kliknij &quot;Dodaj wiadomość&quot;, aby zacząć</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/40 bg-white/20">
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">
                        Dzień
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">
                        Wiadomość
                      </th>
                      <th className="px-6 py-4 text-right font-semibold text-gray-700">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages
                      .sort((a, b) => a.dayNumber - b.dayNumber)
                      .map((message, index) => (
                        <motion.tr
                          key={message.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-white/20 hover:bg-white/20 transition"
                        >
                          <td className="px-6 py-4">
                            <span className="inline-block px-3 py-1 bg-rose-200/50 text-rose-700 rounded-full font-semibold">
                              Dzień {message.dayNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {message.content}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEdit(message)}
                              className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                            >
                              Edytuj
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDelete(message.id)}
                              className="inline-block px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                            >
                              Usuń
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ) : (
          /* Accounts Table */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl overflow-hidden shadow-xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/40 bg-white/20">
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Imię</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Nazwa użytkownika / e-mail</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Rola</th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account, index) => (
                    <motion.tr
                      key={account.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-white/20 hover:bg-white/20 transition"
                    >
                      <td className="px-6 py-4 text-gray-700">{account.name}</td>
                      <td className="px-6 py-4 text-gray-700">{account.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-rose-200/50 text-rose-700 rounded-full font-semibold capitalize">
                          {account.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEditAccount(account)}
                          className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                        >
                          Edytuj
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Message Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-xl bg-white/95 border border-white/40 rounded-2xl p-8 shadow-2xl max-w-md w-full"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingId ? 'Edytuj wiadomość' : 'Dodaj wiadomość'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numer dnia (1-365)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.dayNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dayNumber: parseInt(e.target.value),
                      })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wiadomość (np. &quot;twój piękny uśmiech&quot;)
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        content: e.target.value,
                      })
                    }
                    required
                    placeholder="Wpisz powód, dla którego ją kochasz..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                    rows={3}
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-linear-to-r from-rose-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Zapisywanie...' : editingId ? 'Zaktualizuj' : 'Dodaj'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
                  >
                    Anuluj
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Modal */}
      <AnimatePresence>
        {showAccountModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseAccountModal}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-xl bg-white/95 border border-white/40 rounded-2xl p-8 shadow-2xl max-w-md w-full"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingAccountId ? 'Edytuj konto' : 'Dodaj konto'}
              </h2>

              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wyświetlana nazwa
                  </label>
                  <input
                    type="text"
                    value={accountFormData.name}
                    onChange={(e) => setAccountFormData({ ...accountFormData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nazwa użytkownika / e-mail
                  </label>
                  <input
                    type="text"
                    value={accountFormData.email}
                    onChange={(e) => setAccountFormData({ ...accountFormData, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rola
                  </label>
                  <select
                    value={accountFormData.role}
                    onChange={(e) => setAccountFormData({ ...accountFormData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="user">Użytkownik</option>
                    <option value="admin">Administrator</option>
                    <option value="marvel">Tylko Marvel</option>
                  </select>
                  {accountFormData.role === 'marvel' && (
                    <p className="mt-1 text-xs text-gray-500">
                      To konto będzie mogło zobaczyć tylko stronę z listą Marvela.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingAccountId ? 'Nowe hasło' : 'Hasło'}
                  </label>
                  <input
                    type="password"
                    value={accountFormData.password}
                    onChange={(e) => setAccountFormData({ ...accountFormData, password: e.target.value })}
                    placeholder={editingAccountId ? 'Zostaw puste, aby zachować obecne hasło' : ''}
                    required={!editingAccountId}
                    minLength={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="flex-1 px-4 py-2 bg-linear-to-r from-rose-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition"
                  >
                    {editingAccountId ? 'Zapisz' : 'Utwórz'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleCloseAccountModal}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
                  >
                    Anuluj
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Ghina2026') {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-stone-200"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-900 text-white rounded-2xl mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-serif italic text-stone-900">FiloSofia Viaggi</h1>
          <p className="text-stone-500 mt-2">Area Riservata - Giada Moramarco</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-stone-400 mb-2 ml-1">
              Inserisci Password
            </label>
            <div className="relative">
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-6 py-4 bg-stone-50 border ${error ? 'border-red-500 animate-shake' : 'border-stone-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all`}
                placeholder="••••••••"
                autoFocus
                suppressHydrationWarning
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-stone-900 text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors group"
          >
            Accedi al Hub
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-center mt-8 text-[10px] font-mono text-stone-400 uppercase tracking-widest">
          Via Massa 3, Chieri (TO)
        </p>
      </motion.div>
    </div>
  );
}

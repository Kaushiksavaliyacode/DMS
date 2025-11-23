import React, { useState } from 'react';
import { Shield, User, Lock, ArrowRight, Box, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

export const LoginView: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const email = `${username.toLowerCase().trim()}@rdms.app`;
      await signInWithEmailAndPassword(auth, email, password);
      onLogin(selectedRole);
    } catch (err: any) {
      setError("Invalid ID or Password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 font-poppins">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-slate-900 p-3 rounded-xl mb-2"><Box className="w-6 h-6 text-white" /></div>
            <h1 className="text-2xl font-bold text-slate-900">RDMS Login</h1>
            <p className="text-xs text-slate-500">Secure Access</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {['admin', 'user'].map(role => (
              <button key={role} onClick={() => { setSelectedRole(role as UserRole); setUsername(role.charAt(0).toUpperCase() + role.slice(1)); setPassword(''); }} className={`py-3 rounded-lg border-2 text-sm font-bold transition-all ${selectedRole === role ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full mt-1 p-3 bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full mt-1 p-3 bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold" />
            </div>
            {error && <div className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-md text-center">{error}</div>}
            <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg shadow-md hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
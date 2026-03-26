'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginForm() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
      } else {
        setSignUpSuccess(true);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      }
    }
    setLoading(false);
  };

  if (signUpSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">{'✉️'}</div>
          <h2 className="text-lg font-bold text-gray-200 mb-2">確認メールを送信しました</h2>
          <p className="text-sm text-gray-400 mb-6">
            メール内のリンクをクリックして、アカウントを有効化してください。
          </p>
          <button
            onClick={() => { setIsSignUp(false); setSignUpSuccess(false); }}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all"
          >
            ログイン画面へ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <span className="text-4xl">{'🌙'}</span>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mt-2">
            スリープマネージャー
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isSignUp ? 'アカウント作成' : 'ログイン'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="email@example.com"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="6文字以上"
              className="w-full"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50"
          >
            {loading ? '処理中...' : isSignUp ? 'アカウント作成' : 'ログイン'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            {isSignUp ? 'すでにアカウントをお持ちの方' : 'アカウントを作成する'}
          </button>
        </div>
      </div>
    </div>
  );
}

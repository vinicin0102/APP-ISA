import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CalendarDays, Mail, Lock, LogIn, UserPlus, ArrowRight } from 'lucide-react';
import './Auth.css';

function Auth({ onAuth, showToast, toasts }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onAuth(data.user);
                showToast('Login realizado com sucesso!', 'success');
            } else {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                if (data.user && !data.user.confirmed_at) {
                    showToast('Verifique seu e-mail para confirmar o cadastro!', 'info');
                } else {
                    onAuth(data.user);
                    showToast('Conta criada com sucesso!', 'success');
                }
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Toast container */}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        {toast.message}
                    </div>
                ))}
            </div>

            <div className="auth-visual">
                <div className="auth-orb auth-orb-1" />
                <div className="auth-orb auth-orb-2" />
                <div className="auth-orb auth-orb-3" />
            </div>

            <div className="auth-card glass-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <CalendarDays size={36} />
                    </div>
                    <h1>Minha Agenda</h1>
                    <p>Organize sua vida, nunca perca um compromisso</p>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(true)}
                    >
                        <LogIn size={16} />
                        Entrar
                    </button>
                    <button
                        className={`auth-tab ${!isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(false)}
                    >
                        <UserPlus size={16} />
                        Criar Conta
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="auth-email">
                            <Mail size={16} />
                            E-mail
                        </label>
                        <input
                            id="auth-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="auth-password">
                            <Lock size={16} />
                            Senha
                        </label>
                        <input
                            id="auth-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary auth-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                        ) : (
                            <>
                                {isLogin ? 'Entrar' : 'Criar Conta'}
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
                        <button
                            className="auth-link"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? 'Crie agora' : 'Entre aqui'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Auth;

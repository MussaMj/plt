import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { Lock, Mail, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [forgotMode, setForgotMode] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setInfo(null);

        if (forgotMode) {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            });
            setLoading(false);
            if (error) {
                setError(error.message);
            } else {
                setInfo('Se o e-mail existir, enviámos um link para definir uma nova palavra-passe.');
            }
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    const toggleForgot = () => {
        setForgotMode(!forgotMode);
        setError(null);
        setInfo(null);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo-icon">OP</div>
                    <h2>Portal de Operações</h2>
                    <p>
                        {forgotMode
                            ? 'Indique o e-mail da sua conta para recuperar o acesso'
                            : 'Acesso restrito a gestores e técnicos municipais'}
                    </p>
                </div>

                {info && (
                    <div className="login-success">
                        <CheckCircle2 size={18} />
                        <span>{info}</span>
                    </div>
                )}

                {error && (
                    <div className="login-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={20} />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nome@conselhomunicipal.gov.mz"
                                required
                            />
                        </div>
                    </div>

                    {!forgotMode && (
                        <div className="input-group">
                            <label htmlFor="password">Senha</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={20} />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? <Loader2 className="spinner" size={20} /> : forgotMode ? 'Enviar link' : 'Entrar'}
                    </button>

                    <div className="login-toggle">
                        <button
                            type="button"
                            className="toggle-mode-btn"
                            onClick={toggleForgot}
                            disabled={loading}
                        >
                            {forgotMode ? 'Voltar ao login' : 'Esqueci a palavra-passe'}
                        </button>
                    </div>

                    {!forgotMode && (
                        <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>
                            Não tem conta? Peça ao gestor do seu conselho municipal para o convidar.
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Login;

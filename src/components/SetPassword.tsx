import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import './Login.css';

interface SetPasswordProps {
    /** 'invite' = first access of an invited account; 'recovery' = forgot-password link. */
    mode: 'invite' | 'recovery';
    onDone: () => void;
}

export const MIN_PASSWORD_LENGTH = 8;

const SetPassword: React.FC<SetPasswordProps> = ({ mode, onDone }) => {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`A palavra-passe deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
            return;
        }
        if (password !== confirm) {
            setError('As palavras-passe não coincidem.');
            return;
        }

        setLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (updateError) {
            setError(updateError.message);
            return;
        }
        onDone();
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo-icon">OP</div>
                    <h2>{mode === 'invite' ? 'Bem-vindo ao Portal' : 'Nova palavra-passe'}</h2>
                    <p>
                        {mode === 'invite'
                            ? 'Defina a palavra-passe com que vai entrar daqui em diante.'
                            : 'Escolha uma nova palavra-passe para a sua conta.'}
                    </p>
                </div>

                {error && (
                    <div className="login-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="new-password">Palavra-passe</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                id="new-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                minLength={MIN_PASSWORD_LENGTH}
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

                    <div className="input-group">
                        <label htmlFor="confirm-password">Confirmar palavra-passe</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                id="confirm-password"
                                type={showPassword ? 'text' : 'password'}
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? <Loader2 className="spinner" size={20} /> : 'Guardar e continuar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetPassword;

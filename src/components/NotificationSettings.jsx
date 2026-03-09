import { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, Smartphone, AlertTriangle } from 'lucide-react';
import {
    isPushSupported,
    isIOS,
    isStandalone,
    getCurrentSubscription,
    subscribeToPush,
    unsubscribeFromPush,
    getNotificationPreferences,
    saveNotificationPreferences,
    testLocalNotification
} from '../lib/notifications';
import './NotificationSettings.css';

function NotificationSettings({ userId, showToast }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pushSupported, setPushSupported] = useState(true);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [showIOSWarning, setShowIOSWarning] = useState(false);

    const [preferences, setPreferences] = useState({
        preferred_time: '08:00',
        incentive_type: 'both' // 'both', 'daily', 'specific'
    });

    useEffect(() => {
        checkSupportAndStatus();
        loadPreferences();
    }, [userId]);

    const checkSupportAndStatus = async () => {
        const supported = isPushSupported();
        setPushSupported(supported);

        if (supported) {
            if (isIOS() && !isStandalone()) {
                setShowIOSWarning(true);
            } else {
                const sub = await getCurrentSubscription();
                setIsSubscribed(!!sub);
            }
        }
    };

    const loadPreferences = async () => {
        try {
            const data = await getNotificationPreferences(userId);
            if (data) {
                setPreferences({
                    preferred_time: data.preferred_time || '08:00',
                    incentive_type: data.incentive_type || 'both'
                });
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePush = async (e) => {
        const wantToSubscribe = e.target.checked;
        setSaving(true);

        try {
            if (wantToSubscribe) {
                await subscribeToPush(userId);
                setIsSubscribed(true);
                showToast('Notificações ativadas com sucesso!', 'success');
            } else {
                await unsubscribeFromPush(userId);
                setIsSubscribed(false);
                showToast('Notificações desativadas.', 'info');
            }
        } catch (error) {
            console.error('Push error:', error);
            showToast(error.message || 'Erro ao configurar notificações', 'error');
            // Revert toggle state visually since it failed
            e.target.checked = !wantToSubscribe;
        } finally {
            setSaving(false);
        }
    };

    const handleSavePreferences = async () => {
        setSaving(true);
        try {
            await saveNotificationPreferences(userId, preferences);
            showToast('Preferências salvas!', 'success');
        } catch (error) {
            showToast('Erro ao salvar preferências', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="notifications-layout glass-card">
                <div className="loading-overlay">
                    <div className="spinner" />
                </div>
            </div>
        );
    }

    return (
        <div className="notifications-layout">
            <div className="notifications-header">
                <h2>Configurações de Notificação</h2>
                <p>Controle como e quando o aplicativo deve lembrá-lo dos seus compromissos.</p>
            </div>

            {!pushSupported && (
                <div className="alert-box alert-error">
                    <AlertTriangle size={24} />
                    <div>
                        <h4>Navegador não suportado</h4>
                        <p>Seu navegador ou dispositivo atual não suporta notificações Push da Web.</p>
                    </div>
                </div>
            )}

            {showIOSWarning && (
                <div className="alert-box alert-warning">
                    <Smartphone size={24} />
                    <div>
                        <h4>Ação Necessária (iOS)</h4>
                        <p>
                            Para receber notificações no iPhone/iPad, você precisa <strong>Adicionar à Tela de Início</strong>.
                            <br />Toque no ícone Compartilhar do Safari e selecione "Adicionar à Tela de Início", depois abra o app pelo novo ícone.
                        </p>
                    </div>
                </div>
            )}

            <div className="settings-grid">
                {/* PUSH STATUS CARD */}
                <div className="settings-card glass-card">
                    <div className="card-icon-header">
                        <div className={`icon-wrapper ${isSubscribed ? 'bg-success' : 'bg-secondary'}`}>
                            {isSubscribed ? <Bell size={24} color="white" /> : <BellOff size={24} color="white" />}
                        </div>
                        <h3>Status das Notificações</h3>
                    </div>

                    <div className="settings-content">
                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Notificações no Dispositivo</h4>
                                <p>Receba alertas neste navegador/aparelho</p>
                            </div>
                            <label className="toggle-wrapper">
                                <span className="toggle">
                                    <input
                                        type="checkbox"
                                        checked={isSubscribed}
                                        onChange={handleTogglePush}
                                        disabled={!pushSupported || showIOSWarning || saving}
                                    />
                                    <span className="toggle-slider"></span>
                                </span>
                            </label>
                        </div>

                        {isSubscribed && (
                            <div className="setting-row mt-4" style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="setting-info">
                                    <h4>Testar Alerta</h4>
                                    <p>Verifique se o seu dispositivo vibra ou mostra notificação</p>
                                </div>
                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={async () => {
                                        try {
                                            await testLocalNotification();
                                            showToast('Notificação de teste enviada!', 'success');
                                        } catch (error) {
                                            showToast(error.message, 'error');
                                        }
                                    }}
                                >
                                    Testar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* PREFERENCES CARD */}
                <div className="settings-card glass-card">
                    <div className="card-icon-header">
                        <div className="icon-wrapper bg-primary">
                            <Clock size={24} color="white" />
                        </div>
                        <h3>Preferências Globais</h3>
                    </div>

                    <div className="settings-content">
                        <div className="form-group">
                            <label>Horário Padrão de Lembrete Diário</label>
                            <input
                                type="time"
                                value={preferences.preferred_time}
                                onChange={(e) => setPreferences({ ...preferences, preferred_time: e.target.value })}
                                className="time-input-lg"
                            />
                            <p className="help-text">
                                Este é o horário que usaremos caso você não defina um horário específico na anotação.
                            </p>
                        </div>

                        <div className="form-group mt-4">
                            <label>O que devemos notificar?</label>
                            <select
                                value={preferences.incentive_type}
                                onChange={(e) => setPreferences({ ...preferences, incentive_type: e.target.value })}
                            >
                                <option value="both">Tudo (Lembretes diários + Anotações específicas)</option>
                                <option value="specific">Apenas quando eu marcar um horário específico</option>
                                <option value="daily">Apenas o lembrete diário ("Você tem X tarefas hoje")</option>
                            </select>
                        </div>

                        <button
                            className="btn btn-primary mt-4 w-full"
                            onClick={handleSavePreferences}
                            disabled={saving}
                        >
                            {saving ? <div className="spinner" /> : 'Salvar Preferências'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NotificationSettings;

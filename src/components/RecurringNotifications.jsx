import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, CalendarDays, Power, AlertCircle } from 'lucide-react';
import { getRecurringNotifications, saveRecurringNotification, deleteRecurringNotification, toggleRecurringNotification } from '../lib/notifications';
import './RecurringNotifications.css';

function RecurringNotifications({ userId, showToast }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        notification_time: '09:00',
        days_of_week: [1, 2, 3, 4, 5], // Monday-Friday default
        is_active: true
    });

    const daysOptions = [
        { id: 0, label: 'Dom' },
        { id: 1, label: 'Seg' },
        { id: 2, label: 'Ter' },
        { id: 3, label: 'Qua' },
        { id: 4, label: 'Qui' },
        { id: 5, label: 'Sex' },
        { id: 6, label: 'Sáb' }
    ];

    useEffect(() => {
        loadNotifications();
    }, [userId]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const data = await getRecurringNotifications(userId);
            setNotifications(data);
        } catch (error) {
            showToast('Erro ao carregar notificações recorrentes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleDay = (dayId) => {
        setFormData(prev => {
            const currentDays = [...prev.days_of_week];
            if (currentDays.includes(dayId)) {
                return { ...prev, days_of_week: currentDays.filter(d => d !== dayId) };
            } else {
                return { ...prev, days_of_week: [...currentDays, dayId].sort() };
            }
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            showToast('O título é obrigatório', 'info');
            return;
        }
        if (formData.days_of_week.length === 0) {
            showToast('Selecione pelo menos um dia da semana', 'info');
            return;
        }

        setSaving(true);
        try {
            await saveRecurringNotification(userId, formData);
            showToast('Notificação recorrente salva!', 'success');
            setShowModal(false);
            loadNotifications();
            // Reset form
            setFormData({
                title: '',
                content: '',
                notification_time: '09:00',
                days_of_week: [1, 2, 3, 4, 5],
                is_active: true
            });
        } catch (error) {
            showToast('Erro ao salvar', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Excluir esta notificação recorrente?')) {
            try {
                await deleteRecurringNotification(id);
                showToast('Excluída com sucesso', 'success');
                loadNotifications();
            } catch (error) {
                showToast('Erro ao excluir', 'error');
            }
        }
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            await toggleRecurringNotification(id, !currentStatus);
            const newStatus = !currentStatus;
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, is_active: newStatus } : n
            ));
            showToast(`Notificação ${newStatus ? 'ativada' : 'desativada'}`, 'success');
        } catch (error) {
            showToast('Erro ao alterar status', 'error');
        }
    };

    if (loading) {
        return (
            <div className="recurring-layout glass-card">
                <div className="loading-overlay">
                    <div className="spinner" />
                </div>
            </div>
        );
    }

    return (
        <div className="recurring-layout">
            <div className="recurring-header">
                <div>
                    <h2>Notificações Recorrentes</h2>
                    <p>Lembretes que se repetem toda semana (Ex: Remédios, Academia).</p>
                </div>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowModal(true)}
                >
                    <Plus size={16} />
                    Novo Lembrete
                </button>
            </div>

            <div className="recurring-info alert-box alert-info">
                <AlertCircle size={24} />
                <div>
                    <p>Estes lembretes serão enviados automaticamente nos dias e horários selecionados via sistema Cron.</p>
                </div>
            </div>

            {notifications.length === 0 ? (
                <div className="empty-state glass-card">
                    <RotateCw size={48} />
                    <h3>Nenhum lembrete recorrente</h3>
                    <p>Adicione tarefas e compromissos que se repetem semanalmente.</p>
                    <button
                        className="btn btn-primary mt-4"
                        onClick={() => setShowModal(true)}
                    >
                        <Plus size={16} /> Criar Lembrete
                    </button>
                </div>
            ) : (
                <div className="recurring-list">
                    {notifications.map(notif => (
                        <div key={notif.id} className={`recurring-card glass-card ${!notif.is_active ? 'inactive' : ''}`}>
                            <div className="recurring-card-header">
                                <h3>{notif.title}</h3>
                                <div className="actions">
                                    <button
                                        className={`btn btn-icon btn-ghost ${notif.is_active ? 'text-success' : 'text-muted'}`}
                                        onClick={() => handleToggleActive(notif.id, notif.is_active)}
                                        title={notif.is_active ? "Desativar" : "Ativar"}
                                    >
                                        <Power size={18} />
                                    </button>
                                    <button
                                        className="btn btn-icon btn-ghost text-danger"
                                        onClick={() => handleDelete(notif.id)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {notif.content && <p className="recurring-content">{notif.content}</p>}

                            <div className="recurring-meta">
                                <div className="meta-item text-primary" title="Horário do Lembrete">
                                    <Clock size={16} />
                                    <span>{notif.notification_time.substring(0, 5)}</span>
                                </div>

                                <div className="meta-days">
                                    {daysOptions.map(d => (
                                        <span
                                            key={d.id}
                                            className={`day-badge ${notif.days_of_week.includes(d.id) ? 'active' : ''}`}
                                        >
                                            {d.label[0]}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Novo/Editar */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Novo Lembrete Recorrente</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowModal(false)}
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="form-group mb-4">
                                <label>Título (Ex: Tomar Remédio, Academia)</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    placeholder="Nome do lembrete"
                                />
                            </div>

                            <div className="form-group mb-4">
                                <label>Detalhes Adicionais (Opcional)</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Quantidade, qual exercício..."
                                    rows={2}
                                />
                            </div>

                            <div className="form-group mb-4">
                                <label>Horário</label>
                                <input
                                    type="time"
                                    value={formData.notification_time}
                                    onChange={(e) => setFormData({ ...formData, notification_time: e.target.value })}
                                    required
                                    className="time-input-lg"
                                />
                            </div>

                            <div className="form-group mb-4">
                                <label>Dias da Semana</label>
                                <div className="days-picker">
                                    {daysOptions.map(day => (
                                        <button
                                            type="button"
                                            key={day.id}
                                            className={`btn day-select-btn ${formData.days_of_week.includes(day.id) ? 'active' : ''}`}
                                            onClick={() => handleToggleDay(day.id)}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full mt-4"
                                disabled={saving}
                            >
                                {saving ? "Salvando..." : "Salvar Lembrete"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Icon for empty state missed import
import { RotateCw } from 'lucide-react';

export default RecurringNotifications;

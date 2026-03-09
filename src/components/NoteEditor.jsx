import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Save, Trash2, Clock, CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './NoteEditor.css';

function NoteEditor({ selectedDate, userId, showToast }) {
    const [note, setNote] = useState(null);
    const [content, setContent] = useState('');
    const [notificationTime, setNotificationTime] = useState('');
    const [isCompleted, setIsCompleted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadNote();
    }, [selectedDate, userId]);

    const loadNote = async () => {
        setLoading(true);
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        const { data, error } = await supabase
            .from('agenda_notes')
            .select('*')
            .eq('user_id', userId)
            .eq('date', dateStr)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
            showToast('Erro ao carregar anotação', 'error');
        }

        if (data) {
            setNote(data);
            setContent(data.content || '');
            setNotificationTime(data.notification_time || '');
            setIsCompleted(data.is_completed || false);
        } else {
            setNote(null);
            setContent('');
            setNotificationTime('');
            setIsCompleted(false);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!content.trim()) {
            showToast('A anotação não pode estar vazia', 'info');
            return;
        }

        setSaving(true);
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        const noteData = {
            user_id: userId,
            date: dateStr,
            content: content.trim(),
            notification_time: notificationTime || null,
            is_completed: isCompleted,
            updated_at: new Date().toISOString()
        };

        let error;

        if (note) {
            const { error: updateError } = await supabase
                .from('agenda_notes')
                .update(noteData)
                .eq('id', note.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('agenda_notes')
                .insert([noteData]);
            error = insertError;
        }

        setSaving(false);

        if (error) {
            showToast('Erro ao salvar anotação', 'error');
        } else {
            showToast('Anotação salva com sucesso!', 'success');
            loadNote(); // Reload to get potential new ID
        }
    };

    const handleDelete = async () => {
        if (!note) return;

        if (confirm('Tem certeza que deseja excluir esta anotação?')) {
            setSaving(true);
            const { error } = await supabase
                .from('agenda_notes')
                .delete()
                .eq('id', note.id);

            setSaving(false);

            if (error) {
                showToast('Erro ao excluir anotação', 'error');
            } else {
                showToast('Anotação excluída!', 'success');
                setNote(null);
                setContent('');
                setNotificationTime('');
                setIsCompleted(false);
            }
        }
    };

    const toggleComplete = () => {
        setIsCompleted(!isCompleted);
        // Auto-save logic could go here if desired
    };

    if (loading) {
        return (
            <div className="note-editor glass-card">
                <div className="loading-overlay">
                    <div className="spinner" />
                    <p>Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="note-editor glass-card">
            <div className="editor-header">
                <div className="editor-date">
                    <h3>{format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR })}</h3>
                    <span className="badge badge-active">{format(selectedDate, 'EEEE', { locale: ptBR })}</span>
                </div>

                {note && (
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={toggleComplete}
                        title={isCompleted ? "Marcar como pendente" : "Marcar como concluído"}
                    >
                        {isCompleted ? (
                            <CheckCircle2 className="text-success" size={24} color="var(--accent-green)" />
                        ) : (
                            <Circle size={24} color="var(--text-tertiary)" />
                        )}
                    </button>
                )}
            </div>

            <div className="editor-body">
                <div className="form-group">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="O que você precisa lembrar neste dia?"
                        className={isCompleted ? 'completed-text' : ''}
                        rows={6}
                    />
                </div>

                <div className="editor-options glass-card">
                    <div className="form-group notification-time-group">
                        <label htmlFor="time-input">
                            <Clock size={16} />
                            Horário da Notificação
                        </label>
                        <input
                            id="time-input"
                            type="time"
                            value={notificationTime}
                            onChange={(e) => setNotificationTime(e.target.value)}
                        />
                        <p className="help-text">
                            Deixe em branco para não receber notificação específica neste dia.
                        </p>
                    </div>
                </div>
            </div>

            <div className="editor-footer">
                {note && (
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={handleDelete}
                        disabled={saving}
                    >
                        <Trash2 size={16} />
                        Excluir
                    </button>
                )}

                <div className="flex-spacer" />

                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving || !content.trim()}
                >
                    {saving ? (
                        <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    ) : (
                        <Save size={16} />
                    )}
                    Salvar Anotação
                </button>
            </div>
        </div>
    );
}

export default NoteEditor;

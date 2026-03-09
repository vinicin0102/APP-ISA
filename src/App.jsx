import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth.jsx';
import Calendar from './components/Calendar.jsx';
import NoteEditor from './components/NoteEditor.jsx';
import NotificationSettings from './components/NotificationSettings.jsx';
import RecurringNotifications from './components/RecurringNotifications.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';
import { Bell, CalendarDays, RotateCw, LogOut, Menu, X } from 'lucide-react';
import './App.css';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeView, setActiveView] = useState('calendar'); // 'calendar', 'notifications', 'recurring'
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        showToast('Desconectado com sucesso', 'info');
    };

    if (loading) {
        return (
            <div className="app-loading">
                <div className="spinner" />
                <p>Carregando...</p>
            </div>
        );
    }

    if (!user) {
        return <Auth onAuth={setUser} showToast={showToast} toasts={toasts} />;
    }

    return (
        <div className="app">
            {/* Toast container */}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* Header */}
            <header className="app-header">
                <div className="header-left">
                    <CalendarDays size={24} className="header-icon" />
                    <h1>Minha Agenda</h1>
                </div>

                <nav className="header-nav desktop-nav">
                    <button
                        className={`nav-btn ${activeView === 'calendar' ? 'active' : ''}`}
                        onClick={() => setActiveView('calendar')}
                    >
                        <CalendarDays size={18} />
                        <span>Calendário</span>
                    </button>
                    <button
                        className={`nav-btn ${activeView === 'notifications' ? 'active' : ''}`}
                        onClick={() => setActiveView('notifications')}
                    >
                        <Bell size={18} />
                        <span>Notificações</span>
                    </button>
                    <button
                        className={`nav-btn ${activeView === 'recurring' ? 'active' : ''}`}
                        onClick={() => setActiveView('recurring')}
                    >
                        <RotateCw size={18} />
                        <span>Recorrentes</span>
                    </button>
                </nav>

                <div className="header-right">
                    <span className="user-email">{user.email}</span>
                    <button className="btn btn-ghost btn-icon" onClick={handleSignOut} title="Sair">
                        <LogOut size={18} />
                    </button>
                    <button
                        className="btn btn-ghost btn-icon mobile-menu-btn"
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                    >
                        {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu */}
            {showMobileMenu && (
                <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
                    <nav className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                        <button
                            className={`mobile-nav-btn ${activeView === 'calendar' ? 'active' : ''}`}
                            onClick={() => { setActiveView('calendar'); setShowMobileMenu(false); }}
                        >
                            <CalendarDays size={20} />
                            <span>Calendário</span>
                        </button>
                        <button
                            className={`mobile-nav-btn ${activeView === 'notifications' ? 'active' : ''}`}
                            onClick={() => { setActiveView('notifications'); setShowMobileMenu(false); }}
                        >
                            <Bell size={20} />
                            <span>Notificações</span>
                        </button>
                        <button
                            className={`mobile-nav-btn ${activeView === 'recurring' ? 'active' : ''}`}
                            onClick={() => { setActiveView('recurring'); setShowMobileMenu(false); }}
                        >
                            <RotateCw size={20} />
                            <span>Recorrentes</span>
                        </button>
                    </nav>
                </div>
            )}

            {/* Main Content */}
            <main className="app-main">
                {activeView === 'calendar' && (
                    <div className="calendar-layout">
                        <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} userId={user.id} />
                        <NoteEditor
                            selectedDate={selectedDate}
                            userId={user.id}
                            showToast={showToast}
                        />
                    </div>
                )}

                {activeView === 'notifications' && (
                    <NotificationSettings userId={user.id} showToast={showToast} />
                )}

                {activeView === 'recurring' && (
                    <RecurringNotifications userId={user.id} showToast={showToast} />
                )}
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="mobile-bottom-nav">
                <button
                    className={`bottom-nav-btn ${activeView === 'calendar' ? 'active' : ''}`}
                    onClick={() => setActiveView('calendar')}
                >
                    <CalendarDays size={20} />
                    <span>Agenda</span>
                </button>
                <button
                    className={`bottom-nav-btn ${activeView === 'notifications' ? 'active' : ''}`}
                    onClick={() => setActiveView('notifications')}
                >
                    <Bell size={20} />
                    <span>Alertas</span>
                </button>
                <button
                    className={`bottom-nav-btn ${activeView === 'recurring' ? 'active' : ''}`}
                    onClick={() => setActiveView('recurring')}
                >
                    <RotateCw size={20} />
                    <span>Repetir</span>
                </button>
            </nav>

            {/* PWA Install Prompt */}
            <InstallPrompt />
        </div>
    );
}

export default App;

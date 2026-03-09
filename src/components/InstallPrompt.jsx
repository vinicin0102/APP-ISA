import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { isIOS, isStandalone } from '../lib/notifications';
import './InstallPrompt.css';

function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIosDevice, setIsIosDevice] = useState(false);

    useEffect(() => {
        // Determine iOS and if it's not already installed
        if (isIOS() && !isStandalone()) {
            setIsIosDevice(true);
            setShowPrompt(true);
        }

        // Determine Android/Desktop using the native event
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            if (!isStandalone()) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowPrompt(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleClose = () => {
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="install-prompt-overlay">
            <div className="install-prompt-card glass-card">
                <button className="install-close-btn" onClick={handleClose}>
                    <X size={18} />
                </button>

                <div className="install-header">
                    <div className="app-icon-preview">
                        <img src="/icons/icon-192x192.png" alt="Agenda App Icon" />
                    </div>
                    <div>
                        <h3>Instale o Aplicativo</h3>
                        <p>Acesse mais rápido e receba notificações.</p>
                    </div>
                </div>

                <div className="install-body">
                    {isIosDevice ? (
                        <div className="ios-instructions">
                            <p>Para instalar no seu iPhone ou iPad:</p>
                            <ol>
                                <li>Toque no ícone de Compartilhar <Share size={16} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 4px' }} /> abaixo</li>
                                <li>Role a lista e toque em <strong>"Adicionar à Tela de Início"</strong></li>
                            </ol>
                        </div>
                    ) : (
                        <button className="btn btn-primary w-full" onClick={handleInstallClick}>
                            <Download size={18} />
                            Adicionar à Tela Inicial
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default InstallPrompt;

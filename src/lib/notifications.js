import { supabase } from './supabase';

// Your VAPID public key - generate at https://vapidkeys.com/
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BJcjkuCT1nKByiQ6azDPpQBCFl1c_-b9W_wu85UnBRdeY3Wo-UM_oegajLtsXFjh7S0bEdUY9MgxpkaJSPB7q08';

/**
 * Convert a base64 string to Uint8Array for applicationServerKey
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Check if the browser supports push notifications
 */
export function isPushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Check if the app is running as a standalone PWA (important for iOS)
 */
export function isStandalone() {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
    );
}

/**
 * Check if device is iOS
 */
export function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

/**
 * Get current push subscription
 */
export async function getCurrentSubscription() {
    if (!isPushSupported()) return null;
    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(userId) {
    // iOS standalone check
    if (isIOS() && !isStandalone()) {
        throw new Error(
            'No iOS, você precisa adicionar este app à Tela Inicial primeiro. Toque no ícone de compartilhar e selecione "Adicionar à Tela de Início".'
        );
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error(
            'Permissão de notificação negada. Verifique as configurações do navegador.'
        );
    }

    // Get push subscription
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const subscriptionJSON = subscription.toJSON();

    // Save to Supabase - upsert based on endpoint
    const { error } = await supabase
        .from('notification_subscriptions')
        .upsert(
            {
                user_id: userId,
                subscription: subscriptionJSON,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
        );

    if (error) throw error;

    return subscription;
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(userId) {
    const subscription = await getCurrentSubscription();
    if (subscription) {
        await subscription.unsubscribe();
    }

    // Remove from Supabase
    const { error } = await supabase
        .from('notification_subscriptions')
        .delete()
        .eq('user_id', userId);

    if (error) throw error;
}

/**
 * Save notification preferences
 */
export async function saveNotificationPreferences(userId, preferences) {
    const { error } = await supabase
        .from('user_notification_settings')
        .upsert(
            {
                user_id: userId,
                preferred_time: preferences.preferred_time || '08:00',
                incentive_type: preferences.incentive_type || 'both',
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
        );

    if (error) throw error;
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(userId) {
    const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

/**
 * Save a recurring notification
 */
export async function saveRecurringNotification(userId, notification) {
    const { data, error } = await supabase
        .from('recurring_notifications')
        .upsert(
            {
                ...(notification.id ? { id: notification.id } : {}),
                user_id: userId,
                title: notification.title,
                content: notification.content,
                notification_time: notification.notification_time,
                days_of_week: notification.days_of_week,
                is_active: notification.is_active !== false,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get all recurring notifications for user
 */
export async function getRecurringNotifications(userId) {
    const { data, error } = await supabase
        .from('recurring_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('notification_time', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Delete recurring notification
 */
export async function deleteRecurringNotification(id) {
    const { error } = await supabase
        .from('recurring_notifications')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Toggle recurring notification active state
 */
export async function toggleRecurringNotification(id, isActive) {
    const { error } = await supabase
        .from('recurring_notifications')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
}

/**
 * Test a local generic notification without backend
 */
export async function testLocalNotification() {
    if (!isPushSupported()) return;

    // Check permission first
    if (Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('🎉 Alerta de Teste', {
            body: 'As notificações estão funcionando perfeitamente no seu aparelho!',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            vibrate: [200, 100, 200]
        });
    } else {
        throw new Error('A permissão de notificação não foi concedida.');
    }
}

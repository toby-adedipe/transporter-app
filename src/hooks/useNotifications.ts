import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/services/notifications';

export function useNotifications() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().catch(console.warn);

    notificationListener.current = Notifications.addNotificationReceivedListener((_notification) => {
      // Handle foreground notification if needed
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.screen === 'shipments') {
        router.push('/(tabs)/shipments');
      } else if (data?.screen === 'fleet') {
        router.push('/(tabs)/fleet');
      } else if (data?.screen === 'kpi') {
        router.push('/kpi');
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);
}

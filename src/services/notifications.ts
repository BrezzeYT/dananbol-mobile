import { Platform } from "react-native";
import Constants from "expo-constants";

let Notifications: typeof import("expo-notifications") | null = null;

if (Platform.OS !== "web") {
  try {
    Notifications = require("expo-notifications");
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications?.AndroidNotificationPriority?.MAX,
      }),
    });
  } catch (err) {
    console.debug("Failed to load expo-notifications:", err);
  }
}

export async function initNotifications(): Promise<boolean> {
  if (Platform.OS === "web" || !Notifications) return false;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Заказы и оповещения",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#8ec0ed",
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: "default",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (err) {
    console.debug("Failed to init notifications:", err);
    return false;
  }
}

export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (Platform.OS === "web" || !Notifications) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: "default",
        color: "#8ec0ed",
      },
      trigger: (Platform.OS === 'android' ? { channelId: 'default' } : null) as any,
    });
  } catch (err) {
    console.debug("Failed to schedule local notification:", err);
  }
}

export function subscribeToNotificationClick(
  onOrderClick: (orderId: string) => void,
): () => void {
  if (Platform.OS === "web" || !Notifications) return () => {};

  try {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data && data.orderId) {
          onOrderClick(String(data.orderId));
        }
      },
    );

    return () => sub.remove();
  } catch {
    return () => {};
  }
}

export async function getPushToken(): Promise<string | null> {
  if (Platform.OS === "web" || !Notifications) return null;
  try {
    const granted = await initNotifications();
    if (!granted) return null;
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      "5c081267-7f03-4c8f-a26d-30a5a23e49be";
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (err) {
    console.debug("Could not get Expo Push Token:", err);
    return null;
  }
}

/**
 * Push notification service using Expo Push API.
 * Sends notifications to driver devices via their Expo push tokens.
 */

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  priority?: "default" | "normal" | "high";
  channelId?: string;
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!pushToken || !pushToken.startsWith("ExponentPushToken")) return;

  const message: ExpoPushMessage = {
    to: pushToken,
    title,
    body,
    data,
    sound: "default",
    priority: "high",
    channelId: "ride-requests",
  };

  try {
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error("[Push] Failed to send notification:", error);
  }
}

export async function sendPushToMultiple(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const validTokens = tokens.filter((t) => t && t.startsWith("ExponentPushToken"));
  if (validTokens.length === 0) return;

  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token,
    title,
    body,
    data,
    sound: "default",
    priority: "high",
    channelId: "ride-requests",
  }));

  try {
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    console.error("[Push] Failed to send batch notifications:", error);
  }
}

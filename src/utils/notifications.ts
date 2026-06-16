// notifications.ts — local bill reminders (V2). LOCAL scheduled notifications only (no push, no backend).
// Local notifications work in Expo Go (Android) and fully in the standalone APK.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Recurring } from '../types';
import { fmtINR } from './index';
import { L } from '../i18n';

// Show the reminder even if the app happens to be open when it fires.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Days in a given month (0-based month).
function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

// The next time this day-of-month rolls around, at 10:00 AM. If today's 10 AM has passed, go next month.
function nextDueReminder(day: number, from: Date): Date {
  const thisMonthDay = Math.min(day, daysInMonth(from.getFullYear(), from.getMonth()));
  const target = new Date(from.getFullYear(), from.getMonth(), thisMonthDay, 10, 0, 0);
  if (target.getTime() > from.getTime()) return target;
  const nm = new Date(from.getFullYear(), from.getMonth() + 1, 1);
  const d = Math.min(day, daysInMonth(nm.getFullYear(), nm.getMonth()));
  return new Date(nm.getFullYear(), nm.getMonth(), d, 10, 0, 0);
}

// Ask for notification permission (and set up the Android channel). Returns true if granted.
export async function ensureNotifPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('bills', {
      name: 'Bill reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

// Cancel everything, then schedule one reminder per recurring bill (its next occurrence, 10 AM).
// Called on launch + whenever bills change, so the "next occurrence" stays fresh each month.
export async function scheduleBillReminders(recurring: Recurring[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = new Date();
  for (const bill of recurring) {
    const when = nextDueReminder(bill.day, now);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: L(`${bill.name} due hai aaj 🔔`, `${bill.name} is due today 🔔`),
        body: L(`${fmtINR(bill.amount)} ka bill — bhulna mat babe 💸`, `${fmtINR(bill.amount)} bill — don't forget babe 💸`),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
    });
  }
}

// Cancel every scheduled reminder.
export async function cancelBillReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

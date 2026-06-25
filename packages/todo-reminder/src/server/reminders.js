/**
 * Daily digest reminder trigger management.
 */

import {
  getSettings,
  getPendingTodosForDigest,
  categorizeTodos,
  markDailyDigestSent,
} from './todos.js';
import { sendCombinedReminderEmail } from './gmail.js';

const TRIGGER_HANDLER = 'checkAndSendReminders';
const SETTINGS_KEY = 'trigger_installed';

const setTriggerInstalledFlag = (installed) => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex((row, i) => i > 0 && String(row[0]).trim() === SETTINGS_KEY);
  if (rowIndex >= 0) {
    sheet.getRange(rowIndex + 1, 2).setValue(installed ? 'true' : 'false');
  } else {
    sheet.appendRow([SETTINGS_KEY, installed ? 'true' : 'false']);
  }
};

const todayKey = () =>
  Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

export const checkAndSendReminders = () => {
  const settings = getSettings();
  const recipient = settings.notification_email || Session.getActiveUser().getEmail();
  const today = todayKey();

  if (settings.last_daily_digest_sent === today) {
    return { sentCount: 0, skipped: true, reason: 'Digest already sent today' };
  }

  const todos = getPendingTodosForDigest();
  if (!todos.length) {
    return { sentCount: 0, todoCount: 0 };
  }

  const categorized = categorizeTodos(todos);
  sendCombinedReminderEmail(categorized, recipient, todos.length);
  markDailyDigestSent(today);

  return { sentCount: 1, todoCount: todos.length };
};

export const sendDigestNow = () => {
  const settings = getSettings();
  const recipient = settings.notification_email || Session.getActiveUser().getEmail();
  const todos = getPendingTodosForDigest();

  if (!todos.length) {
    return { success: true, message: 'No pending todos to include in digest.' };
  }

  const categorized = categorizeTodos(todos);
  sendCombinedReminderEmail(categorized, recipient, todos.length);
  markDailyDigestSent(todayKey());

  return {
    success: true,
    message: `Digest sent with ${todos.length} task${todos.length === 1 ? '' : 's'}.`,
  };
};

export const installReminderTrigger = () => {
  removeReminderTrigger();

  const settings = getSettings();
  const hour = Number(settings.daily_reminder_hour);
  const minute = Number(settings.daily_reminder_minute);
  const safeHour = Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : 8;
  const safeMinute = Number.isFinite(minute) ? Math.min(55, Math.max(0, Math.round(minute / 5) * 5)) : 0;

  ScriptApp.newTrigger(TRIGGER_HANDLER)
    .timeBased()
    .everyDays(1)
    .atHour(safeHour)
    .nearMinute(safeMinute)
    .create();

  setTriggerInstalledFlag(true);
  return {
    success: true,
    message: `Daily digest installed at ${String(safeHour).padStart(2, '0')}:${String(safeMinute).padStart(2, '0')}. One combined email per day.`,
  };
};

export const removeReminderTrigger = () => {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach((trigger) => {
    if (trigger.getHandlerFunction() === TRIGGER_HANDLER) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  setTriggerInstalledFlag(false);
  return { success: true, message: 'Daily reminder trigger removed.' };
};

export const getTriggerStatus = () => {
  const settings = getSettings();
  const triggers = ScriptApp.getProjectTriggers();
  const installed = triggers.some((t) => t.getHandlerFunction() === TRIGGER_HANDLER);
  const hour = Number(settings.daily_reminder_hour) || 8;
  const minute = Number(settings.daily_reminder_minute) || 0;

  return {
    installed,
    schedule: installed ? `Daily at ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` : null,
    handler: TRIGGER_HANDLER,
    lastSent: settings.last_daily_digest_sent || null,
  };
};

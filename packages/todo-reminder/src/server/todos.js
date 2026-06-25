/**
 * Todo data layer — Google Sheet as database.
 */

const SHEETS = {
  TODOS: 'Todos',
  SETTINGS: 'Settings',
};

const TODO_HEADERS = [
  'ID',
  'Title',
  'Notes',
  'Due Date',
  'Due Time',
  'Priority',
  'Status',
  'Remind Before (min)',
  'Reminder Sent At',
  'Created At',
  'Recurrence',
  'Last Completed At',
];

const COL = {
  ID: 0,
  TITLE: 1,
  NOTES: 2,
  DUE_DATE: 3,
  DUE_TIME: 4,
  PRIORITY: 5,
  STATUS: 6,
  REMIND_BEFORE: 7,
  REMINDER_SENT: 8,
  CREATED_AT: 9,
  RECURRENCE: 10,
  LAST_COMPLETED: 11,
};

const RECURRENCE = {
  ONCE: 'once',
  DAILY: 'daily',
};

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  const tz = Session.getScriptTimeZone();
  const aStr = Utilities.formatDate(parseDate(a), tz, 'yyyy-MM-dd');
  const bStr = Utilities.formatDate(parseDate(b), tz, 'yyyy-MM-dd');
  return aStr === bStr;
};

const isCompletedToday = (todo) =>
  todo.recurrence === RECURRENCE.DAILY && isSameDay(todo.lastCompletedAt, new Date());

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateOnly = (date) => {
  if (!date) return '';
  const d = parseDate(date);
  if (!d) return '';
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
};

const formatTimeOnly = (time) => {
  if (!time) return '09:00';
  if (time instanceof Date && !isNaN(time.getTime())) {
    return Utilities.formatDate(time, Session.getScriptTimeZone(), 'HH:mm');
  }
  const str = String(time).trim();
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    const [h, m] = str.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }
  return '09:00';
};

const combineDueDateTime = (dueDate, dueTime) => {
  const dateStr = formatDateOnly(dueDate);
  if (!dateStr) return null;
  const timeStr = formatTimeOnly(dueTime);
  const combined = new Date(`${dateStr}T${timeStr}:00`);
  return isNaN(combined.getTime()) ? null : combined;
};

const rowToTodo = (row, rowIndex) => {
  const dueDate = row[COL.DUE_DATE];
  const dueTime = row[COL.DUE_TIME];
  const dueAt = combineDueDateTime(dueDate, dueTime);

  const recurrence = String(row[COL.RECURRENCE] || RECURRENCE.ONCE).toLowerCase();

  return {
    id: String(row[COL.ID] || ''),
    title: String(row[COL.TITLE] || ''),
    notes: String(row[COL.NOTES] || ''),
    dueDate: formatDateOnly(dueDate),
    dueTime: formatTimeOnly(dueTime),
    dueAt: dueAt ? dueAt.toISOString() : null,
    priority: String(row[COL.PRIORITY] || 'normal').toLowerCase(),
    status: String(row[COL.STATUS] || 'pending').toLowerCase(),
    recurrence,
    remindBeforeMinutes: Number(row[COL.REMIND_BEFORE]) || 0,
    reminderSentAt: row[COL.REMINDER_SENT]
      ? parseDate(row[COL.REMINDER_SENT])?.toISOString() || String(row[COL.REMINDER_SENT])
      : null,
    lastCompletedAt: row[COL.LAST_COMPLETED]
      ? parseDate(row[COL.LAST_COMPLETED])?.toISOString() || String(row[COL.LAST_COMPLETED])
      : null,
    createdAt: row[COL.CREATED_AT]
      ? parseDate(row[COL.CREATED_AT])?.toISOString() || String(row[COL.CREATED_AT])
      : null,
    rowIndex: rowIndex + 1,
  };
};

const migrateTodosSheet = (sheet) => {
  const lastCol = Math.max(sheet.getLastColumn(), TODO_HEADERS.length);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map((h) => String(h).trim());
  const rows = sheet.getLastRow();

  if (!headers.includes('Recurrence')) {
    const col = headers.length + 1;
    sheet.getRange(1, col).setValue('Recurrence').setFontWeight('bold');
    if (rows > 1) sheet.getRange(2, col, rows, 1).setValue(RECURRENCE.ONCE);
  }
  if (!headers.includes('Last Completed At')) {
    const col = sheet.getLastColumn() + 1;
    sheet.getRange(1, col).setValue('Last Completed At').setFontWeight('bold');
  }
};

export const initDatabase = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let todosSheet = ss.getSheetByName(SHEETS.TODOS);
  if (!todosSheet) {
    todosSheet = ss.insertSheet(SHEETS.TODOS);
    todosSheet.appendRow(TODO_HEADERS);
    todosSheet.getRange(1, 1, 1, TODO_HEADERS.length).setFontWeight('bold');
    todosSheet.setFrozenRows(1);
  } else {
    migrateTodosSheet(todosSheet);
  }

  let settingsSheet = ss.getSheetByName(SHEETS.SETTINGS);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SHEETS.SETTINGS);
    settingsSheet.appendRow(['Key', 'Value']);
    settingsSheet.getRange(1, 1, 1, 2).setFontWeight('bold');
    settingsSheet.appendRow(['notification_email', Session.getActiveUser().getEmail()]);
    settingsSheet.appendRow(['default_remind_before_minutes', '15']);
    settingsSheet.appendRow(['daily_reminder_hour', '8']);
    settingsSheet.appendRow(['daily_reminder_minute', '0']);
    settingsSheet.appendRow(['last_daily_digest_sent', '']);
    settingsSheet.appendRow(['trigger_installed', 'false']);
  }

  return { success: true, message: 'Database initialized.' };
};

const getSheet = (name) => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName(name);
  }
  return sheet;
};

export const getSettings = () => {
  const sheet = getSheet(SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  const settings = {
    notification_email: Session.getActiveUser().getEmail(),
    default_remind_before_minutes: 15,
    daily_reminder_hour: 8,
    daily_reminder_minute: 0,
    last_daily_digest_sent: '',
    trigger_installed: false,
  };

  data.forEach((row) => {
    if (row[0]) {
      const key = String(row[0]).trim();
      let value = row[1];
      if (key === 'default_remind_before_minutes') value = Number(value) || 15;
      if (key === 'daily_reminder_hour') value = Number(value);
      if (key === 'daily_reminder_minute') value = Number(value);
      if (key === 'trigger_installed') value = String(value).toLowerCase() === 'true';
      settings[key] = value;
    }
  });

  return settings;
};

export const saveSettings = (updates) => {
  const sheet = getSheet(SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  const allowed = [
    'notification_email',
    'default_remind_before_minutes',
    'daily_reminder_hour',
    'daily_reminder_minute',
  ];

  allowed.forEach((key) => {
    if (updates[key] === undefined) return;
    const rowIndex = data.findIndex((row, i) => i > 0 && String(row[0]).trim() === key);
    const value = updates[key];
    if (rowIndex >= 0) {
      sheet.getRange(rowIndex + 1, 2).setValue(value);
    } else {
      sheet.appendRow([key, value]);
    }
  });

  return getSettings();
};

export const getTodos = (includeDone = false) => {
  const sheet = getSheet(SHEETS.TODOS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  return data
    .slice(1)
    .map((row, i) => rowToTodo(row, i + 1))
    .filter((todo) => {
      if (todo.recurrence === RECURRENCE.DAILY) {
        if (todo.status === 'done') return includeDone;
        return includeDone || !isCompletedToday(todo);
      }
      return includeDone || todo.status !== 'done';
    })
    .sort((a, b) => {
      if (a.recurrence === RECURRENCE.DAILY && b.recurrence !== RECURRENCE.DAILY) return -1;
      if (b.recurrence === RECURRENCE.DAILY && a.recurrence !== RECURRENCE.DAILY) return 1;
      if (!a.dueAt && !b.dueAt) return 0;
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return new Date(a.dueAt) - new Date(b.dueAt);
    });
};

export const addTodo = (payload) => {
  const sheet = getSheet(SHEETS.TODOS);
  const settings = getSettings();
  const id = Utilities.getUuid();
  const now = new Date();
  const remindBefore =
    payload.remindBeforeMinutes !== undefined
      ? Number(payload.remindBeforeMinutes)
      : settings.default_remind_before_minutes;

  const recurrence = (payload.recurrence || RECURRENCE.ONCE).toLowerCase();
  const isDaily = recurrence === RECURRENCE.DAILY;

  sheet.appendRow([
    id,
    payload.title || 'Untitled',
    payload.notes || '',
    isDaily ? '' : formatDateOnly(payload.dueDate || now),
    formatTimeOnly(payload.dueTime || '09:00'),
    (payload.priority || 'normal').toLowerCase(),
    'pending',
    remindBefore,
    '',
    now,
    recurrence,
    '',
  ]);

  return { success: true, id };
};

export const updateTodo = (id, updates) => {
  const sheet = getSheet(SHEETS.TODOS);
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex((row, i) => i > 0 && String(row[COL.ID]) === String(id));
  if (rowIndex < 0) throw new Error('Todo not found');

  const row = rowIndex + 1;
  if (updates.title !== undefined) sheet.getRange(row, COL.TITLE + 1).setValue(updates.title);
  if (updates.notes !== undefined) sheet.getRange(row, COL.NOTES + 1).setValue(updates.notes);
  if (updates.dueDate !== undefined) sheet.getRange(row, COL.DUE_DATE + 1).setValue(formatDateOnly(updates.dueDate));
  if (updates.dueTime !== undefined) sheet.getRange(row, COL.DUE_TIME + 1).setValue(formatTimeOnly(updates.dueTime));
  if (updates.priority !== undefined) sheet.getRange(row, COL.PRIORITY + 1).setValue(updates.priority.toLowerCase());
  if (updates.recurrence !== undefined) {
    sheet.getRange(row, COL.RECURRENCE + 1).setValue(updates.recurrence.toLowerCase());
    if (updates.recurrence === RECURRENCE.DAILY) {
      sheet.getRange(row, COL.DUE_DATE + 1).setValue('');
    }
  }
  if (updates.status !== undefined) sheet.getRange(row, COL.STATUS + 1).setValue(updates.status.toLowerCase());
  if (updates.remindBeforeMinutes !== undefined) {
    sheet.getRange(row, COL.REMIND_BEFORE + 1).setValue(Number(updates.remindBeforeMinutes) || 0);
  }
  if (updates.resetReminder) {
    sheet.getRange(row, COL.REMINDER_SENT + 1).setValue('');
  }
  if (updates.lastCompletedAt !== undefined) {
    sheet.getRange(row, COL.LAST_COMPLETED + 1).setValue(updates.lastCompletedAt || '');
  }

  return { success: true };
};

export const markTodoDone = (id) => {
  const sheet = getSheet(SHEETS.TODOS);
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex((row, i) => i > 0 && String(row[COL.ID]) === String(id));
  if (rowIndex < 0) throw new Error('Todo not found');

  const todo = rowToTodo(data[rowIndex], rowIndex);
  if (todo.recurrence === RECURRENCE.DAILY) {
    return updateTodo(id, { lastCompletedAt: new Date() });
  }
  return updateTodo(id, { status: 'done' });
};

export const deleteTodo = (id) => {
  const sheet = getSheet(SHEETS.TODOS);
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex((row, i) => i > 0 && String(row[COL.ID]) === String(id));
  if (rowIndex < 0) throw new Error('Todo not found');
  sheet.deleteRow(rowIndex + 1);
  return { success: true };
};

export const getPendingTodosForDigest = () => getTodos(false);

export const categorizeTodos = (todos) => {
  const tz = Session.getScriptTimeZone();
  const todayStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const todayStart = new Date(`${todayStr}T00:00:00`);

  const dailyHabits = [];
  const overdue = [];
  const dueToday = [];
  const upcoming = [];
  const noDue = [];

  todos.forEach((todo) => {
    if (todo.recurrence === RECURRENCE.DAILY) {
      dailyHabits.push(todo);
      return;
    }
    if (!todo.dueAt) {
      noDue.push(todo);
      return;
    }
    const dueDateStr = formatDateOnly(todo.dueDate);
    const dueAt = new Date(todo.dueAt);
    if (dueAt < todayStart) overdue.push(todo);
    else if (dueDateStr === todayStr) dueToday.push(todo);
    else upcoming.push(todo);
  });

  const byDue = (a, b) => new Date(a.dueAt) - new Date(b.dueAt);
  const byTime = (a, b) => formatTimeOnly(a.dueTime).localeCompare(formatTimeOnly(b.dueTime));
  overdue.sort(byDue);
  dueToday.sort(byDue);
  upcoming.sort(byDue);
  dailyHabits.sort(byTime);

  return { dailyHabits, overdue, dueToday, upcoming, noDue };
};

export const markDailyDigestSent = (dateStr) => {
  const sheet = getSheet(SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  const key = 'last_daily_digest_sent';
  const rowIndex = data.findIndex((row, i) => i > 0 && String(row[0]).trim() === key);
  if (rowIndex >= 0) {
    sheet.getRange(rowIndex + 1, 2).setValue(dateStr);
  } else {
    sheet.appendRow([key, dateStr]);
  }
};

export const getDueTodosForReminder = () => {
  const now = new Date();
  const todos = getTodos(true);

  return todos.filter((todo) => {
    if (todo.status !== 'pending') return false;
    if (todo.reminderSentAt) return false;
    if (!todo.dueAt) return false;

    const dueAt = new Date(todo.dueAt);
    const remindAt = new Date(dueAt.getTime() - todo.remindBeforeMinutes * 60 * 1000);
    return remindAt <= now;
  });
};

export const markReminderSent = (id) => {
  const sheet = getSheet(SHEETS.TODOS);
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex((row, i) => i > 0 && String(row[COL.ID]) === String(id));
  if (rowIndex < 0) return;
  sheet.getRange(rowIndex + 1, COL.REMINDER_SENT + 1).setValue(new Date());
};

export { combineDueDateTime, formatDateOnly, formatTimeOnly, SHEETS, RECURRENCE };

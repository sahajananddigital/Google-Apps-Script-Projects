import { initDatabase } from './todos.js';
import { installReminderTrigger, removeReminderTrigger, sendDigestNow } from './reminders.js';
import { sendTestEmail } from './gmail.js';
import { showTodoDialog } from './webapp.js';

export const onOpen = () => {
  SpreadsheetApp.getUi()
    .createMenu('Todo Reminder')
    .addItem('Add / Manage Reminders', 'showTodoDialog')
    .addSeparator()
    .addItem('Initialize Database', 'initDatabase')
    .addItem('Install Daily Reminders', 'installReminderTrigger')
    .addItem('Send Digest Now', 'sendDigestNow')
    .addItem('Remove Daily Reminders', 'removeReminderTrigger')
    .addItem('Send Test Email', 'sendTestEmail')
    .addToUi();
};

export { showTodoDialog, initDatabase, installReminderTrigger, removeReminderTrigger, sendDigestNow, sendTestEmail };

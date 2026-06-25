import { doGet, showTodoDialog } from './server/webapp.js';
import { onOpen } from './server/menu.js';
import {
  initDatabase,
  getTodos,
  addTodo,
  updateTodo,
  markTodoDone,
  deleteTodo,
  getSettings,
  saveSettings,
} from './server/todos.js';
import {
  checkAndSendReminders,
  installReminderTrigger,
  removeReminderTrigger,
  getTriggerStatus,
  sendDigestNow,
} from './server/reminders.js';
import { sendTestEmail } from './server/gmail.js';

export {
  doGet,
  onOpen,
  showTodoDialog,
  initDatabase,
  getTodos,
  addTodo,
  updateTodo,
  markTodoDone,
  deleteTodo,
  getSettings,
  saveSettings,
  checkAndSendReminders,
  installReminderTrigger,
  removeReminderTrigger,
  getTriggerStatus,
  sendDigestNow,
  sendTestEmail,
};

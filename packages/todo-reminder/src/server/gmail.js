/**
 * Combined daily digest email for all pending todos.
 */

const formatDue = (todo) => {
  if (todo.recurrence === 'daily') {
    const time = todo.dueTime || '09:00';
    return `Every day at ${time}`;
  }
  if (!todo.dueAt) return 'No due date';
  return Utilities.formatDate(
    new Date(todo.dueAt),
    Session.getScriptTimeZone(),
    "EEE, MMM d 'at' h:mm a"
  );
};

const priorityBadge = (priority) => {
  const colors = { high: '#dc2626', normal: '#475569', low: '#059669' };
  const color = colors[priority] || colors.normal;
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);
  return `<span style="color:${color}; font-size:11px; font-weight:bold;">${label}</span>`;
};

const renderTodoRow = (todo) => `
  <tr>
    <td style="padding:10px 8px; border-bottom:1px solid #e2e8f0;">
      <strong>${escapeHtml(todo.title)}</strong>
      ${todo.notes ? `<br><span style="color:#64748b; font-size:12px;">${escapeHtml(todo.notes)}</span>` : ''}
    </td>
    <td style="padding:10px 8px; border-bottom:1px solid #e2e8f0; font-size:12px; white-space:nowrap;">${formatDue(todo)}</td>
    <td style="padding:10px 8px; border-bottom:1px solid #e2e8f0;">${priorityBadge(todo.priority)}</td>
  </tr>
`;

const renderSection = (title, todos, accentColor) => {
  if (!todos.length) return '';
  return `
    <h3 style="color:${accentColor}; font-size:14px; margin:20px 0 8px;">${title} (${todos.length})</h3>
    <table style="width:100%; border-collapse:collapse; font-family:Arial,sans-serif; font-size:13px;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="text-align:left; padding:8px; font-size:11px; color:#64748b;">Task</th>
          <th style="text-align:left; padding:8px; font-size:11px; color:#64748b;">Due</th>
          <th style="text-align:left; padding:8px; font-size:11px; color:#64748b;">Priority</th>
        </tr>
      </thead>
      <tbody>${todos.map(renderTodoRow).join('')}</tbody>
    </table>
  `;
};

export const sendCombinedReminderEmail = (categorized, recipientEmail, totalCount) => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetUrl = ss.getUrl();
  const todayFormatted = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'EEEE, MMM d yyyy');

  const { dailyHabits, overdue, dueToday, upcoming, noDue } = categorized;

  const subject =
    overdue.length > 0
      ? `[Todo Reminder] Daily digest — ${overdue.length} overdue, ${totalCount} pending`
      : `[Todo Reminder] Daily digest — ${totalCount} pending task${totalCount === 1 ? '' : 's'}`;

  const htmlBody = `
    <div style="font-family:Arial,sans-serif; max-width:640px; margin:0 auto; color:#1e293b;">
      <h2 style="color:#4f46e5; margin-bottom:4px;">Daily Todo Reminder</h2>
      <p style="color:#64748b; margin-top:0; font-size:14px;">${todayFormatted} — here are all your pending tasks in one email.</p>
      ${renderSection('Daily Reminders', dailyHabits, '#7c3aed')}
      ${renderSection('Overdue', overdue, '#dc2626')}
      ${renderSection('Due Today', dueToday, '#d97706')}
      ${renderSection('Upcoming', upcoming, '#4f46e5')}
      ${renderSection('No Due Date', noDue, '#64748b')}
      <p style="font-size:13px; color:#64748b; margin-top:24px;">
        <a href="${sheetUrl}" style="color:#4f46e5;">Open your todo spreadsheet</a>
      </p>
    </div>
  `;

  const plainSections = [
    ['DAILY REMINDERS', dailyHabits],
    ['OVERDUE', overdue],
    ['DUE TODAY', dueToday],
    ['UPCOMING', upcoming],
    ['NO DUE DATE', noDue],
  ]
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => {
      const lines = items.map((t) => `  - ${t.title} (${formatDue(t)}, ${t.priority})`);
      return `${label}:\n${lines.join('\n')}`;
    });

  const plainBody = [
    `Daily Todo Reminder — ${todayFormatted}`,
    '',
    ...plainSections,
    '',
    `Spreadsheet: ${sheetUrl}`,
  ].join('\n');

  MailApp.sendEmail({
    to: recipientEmail,
    subject,
    body: plainBody,
    htmlBody,
    name: 'Todo Reminder',
  });

  return { success: true };
};

export const sendTestEmail = () => {
  const recipient = Session.getActiveUser().getEmail();
  const sample = {
    dailyHabits: [
      {
        title: 'Daily hour logging',
        notes: 'Log your work hours before end of day',
        recurrence: 'daily',
        dueTime: '18:00',
        priority: 'normal',
      },
    ],
    overdue: [
      {
        title: 'Sample overdue task',
        notes: 'This is how overdue items appear',
        dueAt: new Date(Date.now() - 86400000).toISOString(),
        dueDate: '',
        priority: 'high',
      },
    ],
    dueToday: [
      {
        title: 'Sample task due today',
        notes: '',
        dueAt: new Date().toISOString(),
        dueDate: '',
        priority: 'normal',
      },
    ],
    upcoming: [],
    noDue: [],
  };

  sendCombinedReminderEmail(sample, recipient, 3);
  return { success: true, message: `Sample digest email sent to ${recipient}` };
};

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

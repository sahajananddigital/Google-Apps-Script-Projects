import React, { useState } from 'react';

const padTime = (n) => String(n).padStart(2, '0');

export const SettingsPanel = ({
  settings,
  triggerStatus,
  onSave,
  onInstallTrigger,
  onRemoveTrigger,
  onSendDigestNow,
  onTestEmail,
  saving,
}) => {
  const [email, setEmail] = useState(settings.notification_email || '');
  const [defaultRemind, setDefaultRemind] = useState(settings.default_remind_before_minutes || 15);
  const [reminderTime, setReminderTime] = useState(() => {
    const h = padTime(settings.daily_reminder_hour ?? 8);
    const m = padTime(settings.daily_reminder_minute ?? 0);
    return `${h}:${m}`;
  });

  const handleSave = (e) => {
    e.preventDefault();
    const [hourStr, minuteStr] = reminderTime.split(':');
    onSave({
      notification_email: email,
      default_remind_before_minutes: Number(defaultRemind) || 15,
      daily_reminder_hour: Number(hourStr) || 8,
      daily_reminder_minute: Number(minuteStr) || 0,
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSave} className="card space-y-3">
        <h3 className="font-semibold text-slate-800">Email settings</h3>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Send reminders to</label>
          <input
            type="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Daily digest time</label>
          <input
            type="time"
            className="input-field"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            required
          />
          <p className="text-[11px] text-slate-400 mt-1">
            One combined email each day at this time with all pending todos.
          </p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Default remind-before (minutes)</label>
          <input
            type="number"
            min="0"
            step="5"
            className="input-field"
            value={defaultRemind}
            onChange={(e) => setDefaultRemind(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      <div className="card space-y-3">
        <h3 className="font-semibold text-slate-800">Daily digest</h3>
        <p className="text-xs text-slate-500">
          Sends one email per day listing all pending todos — overdue, due today, and upcoming — grouped together.
        </p>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${triggerStatus?.installed ? 'bg-emerald-500' : 'bg-slate-300'}`}
          />
          <span className="text-xs font-medium text-slate-600">
            {triggerStatus?.installed
              ? `Active — ${triggerStatus.schedule}`
              : 'Not installed'}
          </span>
        </div>
        {triggerStatus?.lastSent && (
          <p className="text-[11px] text-slate-400">Last digest sent: {triggerStatus.lastSent}</p>
        )}
        <div className="flex flex-col gap-2">
          {!triggerStatus?.installed ? (
            <button type="button" className="btn-primary w-full" onClick={onInstallTrigger}>
              Install Daily Reminders
            </button>
          ) : (
            <button type="button" className="btn-secondary w-full" onClick={onRemoveTrigger}>
              Remove Daily Reminders
            </button>
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-secondary flex-1" onClick={onSendDigestNow}>
              Send Digest Now
            </button>
            <button type="button" className="btn-secondary flex-1" onClick={onTestEmail}>
              Test Email
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-400">
          After changing digest time, save settings and reinstall reminders.
        </p>
      </div>
    </div>
  );
};

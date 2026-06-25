import React, { useState, useEffect, useCallback } from 'react';
import { TodoForm, emptyForm } from './components/TodoForm';
import { TodoList } from './components/TodoList';
import { SettingsPanel } from './components/SettingsPanel';
import './styles/app.css';

const runGas = (fn, ...args) =>
  new Promise((resolve, reject) => {
    if (typeof google === 'undefined') {
      reject(new Error('Not running inside Google Apps Script'));
      return;
    }
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      [fn](...args);
  });

const App = () => {
  const [activeTab, setActiveTab] = useState('todos');
  const [todos, setTodos] = useState([]);
  const [settings, setSettings] = useState({});
  const [triggerStatus, setTriggerStatus] = useState({ installed: false });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [message, setMessage] = useState('');
  const [showDone, setShowDone] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (typeof google !== 'undefined') {
        const [todoData, settingsData, triggerData] = await Promise.all([
          runGas('getTodos', showDone),
          runGas('getSettings'),
          runGas('getTriggerStatus'),
        ]);
        setTodos(todoData || []);
        setSettings(settingsData || {});
        setTriggerStatus(triggerData || { installed: false });
        if (!editingId) {
          setFormData(emptyForm(settingsData?.default_remind_before_minutes || 15));
        }
      } else {
        setTodos([
          {
            id: 'demo-1',
            title: 'Review quarterly report',
            notes: 'Check numbers before standup',
            dueDate: new Date().toISOString().slice(0, 10),
            dueTime: '10:00',
            dueAt: new Date().toISOString(),
            priority: 'high',
            status: 'pending',
            remindBeforeMinutes: 15,
            reminderSentAt: null,
          },
        ]);
        setSettings({ notification_email: 'you@example.com', default_remind_before_minutes: 15 });
      }
    } catch (err) {
      alert('Failed to load: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [showDone, editingId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const wasEditing = !!editingId;
    try {
      if (typeof google !== 'undefined') {
        if (editingId) {
          await runGas('updateTodo', editingId, {
            ...formData,
            remindBeforeMinutes: Number(formData.remindBeforeMinutes),
            resetReminder: true,
          });
          setEditingId(null);
        } else {
          await runGas('addTodo', {
            ...formData,
            remindBeforeMinutes: Number(formData.remindBeforeMinutes),
          });
        }
      }
      setFormData(emptyForm(settings.default_remind_before_minutes || 15));
      setMessage(
        wasEditing
          ? 'Reminder updated.'
          : formData.recurrence === 'daily'
            ? 'Daily reminder added! It will appear in every morning digest.'
            : 'Reminder added! Included in your next daily digest email.'
      );
      setTimeout(() => setMessage(''), 4000);
      await loadData();
    } catch (err) {
      alert('Error saving todo: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      if (typeof google !== 'undefined') await runGas('markTodoDone', id);
      await loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEdit = (todo) => {
    setEditingId(todo.id);
    setFormData({
      title: todo.title,
      notes: todo.notes,
      recurrence: todo.recurrence || 'once',
      dueDate: todo.dueDate || new Date().toISOString().slice(0, 10),
      dueTime: todo.dueTime,
      priority: todo.priority,
      remindBeforeMinutes: todo.remindBeforeMinutes,
    });
    setActiveTab('todos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this todo?')) return;
    try {
      if (typeof google !== 'undefined') await runGas('deleteTodo', id);
      if (editingId === id) {
        setEditingId(null);
        setFormData(emptyForm(settings.default_remind_before_minutes || 15));
      }
      await loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleSaveSettings = async (updates) => {
    setSavingSettings(true);
    try {
      if (typeof google !== 'undefined') {
        const saved = await runGas('saveSettings', updates);
        setSettings(saved);
      }
      alert('Settings saved.');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleInstallTrigger = async () => {
    try {
      if (typeof google !== 'undefined') {
        const result = await runGas('installReminderTrigger');
        alert(result.message);
        const status = await runGas('getTriggerStatus');
        setTriggerStatus(status);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleRemoveTrigger = async () => {
    if (!confirm('Stop automatic email reminders?')) return;
    try {
      if (typeof google !== 'undefined') {
        const result = await runGas('removeReminderTrigger');
        alert(result.message);
        setTriggerStatus({ installed: false });
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleTestEmail = async () => {
    try {
      if (typeof google !== 'undefined') {
        const result = await runGas('sendTestEmail');
        alert(result.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleSendDigestNow = async () => {
    try {
      if (typeof google !== 'undefined') {
        const result = await runGas('sendDigestNow');
        alert(result.message);
        const status = await runGas('getTriggerStatus');
        setTriggerStatus(status);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <header className="mb-3">
        <h1 className="text-lg font-bold text-slate-900">Todo Reminder</h1>
        <p className="text-xs text-slate-500 mt-0.5">Add todos — one combined email digest sent daily</p>
      </header>

      {message && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
          {message}
        </div>
      )}

      <nav className="flex bg-slate-100 p-1 rounded-lg mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('todos')}
          className={`flex-1 py-2 rounded-md font-semibold text-xs transition-all ${activeTab === 'todos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 rounded-md font-semibold text-xs transition-all ${activeTab === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          Settings
        </button>
      </nav>

      {activeTab === 'todos' ? (
        <div className="space-y-4">
          <section className="card">
            <h2 className="font-semibold text-slate-800 mb-3">
              {editingId ? 'Edit Reminder' : 'Add Reminder'}
            </h2>
            <TodoForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              submitting={submitting}
              editing={!!editingId}
              onCancel={() => {
                setEditingId(null);
                setFormData(emptyForm(settings.default_remind_before_minutes || 15));
              }}
            />
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-slate-800">Your Todos</h2>
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDone}
                  onChange={(e) => setShowDone(e.target.checked)}
                  className="rounded"
                />
                Show done
              </label>
            </div>
            <TodoList
              todos={todos}
              loading={loading}
              onComplete={handleComplete}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </section>
        </div>
      ) : (
        <SettingsPanel
          settings={settings}
          triggerStatus={triggerStatus}
          onSave={handleSaveSettings}
          onInstallTrigger={handleInstallTrigger}
          onRemoveTrigger={handleRemoveTrigger}
          onSendDigestNow={handleSendDigestNow}
          onTestEmail={handleTestEmail}
          saving={savingSettings}
        />
      )}
    </div>
  );
};

export default App;

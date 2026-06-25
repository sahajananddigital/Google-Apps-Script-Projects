import React from 'react';

const PRIORITIES = ['low', 'normal', 'high'];
const RECURRENCE_OPTIONS = [
  { value: 'once', label: 'One-time' },
  { value: 'daily', label: 'Every day' },
];

const emptyForm = (defaultRemind = 15) => ({
  title: '',
  notes: '',
  recurrence: 'once',
  dueDate: new Date().toISOString().slice(0, 10),
  dueTime: '09:00',
  priority: 'normal',
  remindBeforeMinutes: defaultRemind,
});

export const TodoForm = ({ formData, setFormData, onSubmit, submitting, editing, onCancel }) => {
  const isDaily = formData.recurrence === 'daily';

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    if (field === 'recurrence' && value === 'daily') {
      setFormData({ ...formData, recurrence: value, dueDate: '' });
      return;
    }
    if (field === 'recurrence' && value === 'once' && !formData.dueDate) {
      setFormData({
        ...formData,
        recurrence: value,
        dueDate: new Date().toISOString().slice(0, 10),
      });
      return;
    }
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Title</label>
        <input
          className="input-field"
          value={formData.title}
          onChange={handleChange('title')}
          placeholder={isDaily ? 'e.g. Daily hour logging' : 'What needs to be done?'}
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
        <textarea
          className="input-field min-h-[72px] resize-y"
          value={formData.notes}
          onChange={handleChange('notes')}
          placeholder="Optional details..."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Repeat</label>
        <select className="input-field" value={formData.recurrence} onChange={handleChange('recurrence')}>
          {RECURRENCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {isDaily && (
          <p className="text-[11px] text-violet-600 mt-1">
            Appears in every daily digest until you mark it done for today.
          </p>
        )}
      </div>

      <div className={`grid gap-3 ${isDaily ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {!isDaily && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Due date</label>
            <input
              type="date"
              className="input-field"
              value={formData.dueDate}
              onChange={handleChange('dueDate')}
              required
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            {isDaily ? 'Preferred time' : 'Due time'}
          </label>
          <input
            type="time"
            className="input-field"
            value={formData.dueTime}
            onChange={handleChange('dueTime')}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Priority</label>
          <select className="input-field" value={formData.priority} onChange={handleChange('priority')}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
        {!isDaily && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Remind before (min)</label>
            <input
              type="number"
              min="0"
              step="5"
              className="input-field"
              value={formData.remindBeforeMinutes}
              onChange={handleChange('remindBeforeMinutes')}
            />
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary flex-1" disabled={submitting}>
          {submitting ? 'Saving...' : editing ? 'Update Reminder' : 'Add Reminder'}
        </button>
        {editing && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export { emptyForm, PRIORITIES, RECURRENCE_OPTIONS };

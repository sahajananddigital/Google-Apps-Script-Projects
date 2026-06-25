import React from 'react';

const priorityColors = {
  high: 'bg-red-100 text-red-700',
  normal: 'bg-slate-100 text-slate-700',
  low: 'bg-emerald-100 text-emerald-700',
};

const formatDue = (todo) => {
  if (todo.recurrence === 'daily') {
    return `Every day at ${todo.dueTime || '09:00'}`;
  }
  if (!todo.dueDate) return 'No due date';
  const time = todo.dueTime || '';
  return `${todo.dueDate}${time ? ` at ${time}` : ''}`;
};

const isOverdue = (todo) => {
  if (todo.recurrence === 'daily' || !todo.dueAt || todo.status === 'done') return false;
  return new Date(todo.dueAt) < new Date();
};

export const TodoList = ({ todos, loading, onComplete, onEdit, onDelete }) => {
  if (loading) {
    return <p className="text-slate-500 text-center py-8">Loading todos...</p>;
  }

  if (!todos.length) {
    return (
      <div className="text-center py-10 text-slate-400">
        <p className="font-medium">No todos yet</p>
        <p className="text-xs mt-1">Add a one-time task or a daily reminder like hour logging.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {todos.map((todo) => (
        <li
          key={todo.id}
          className={`card p-3 ${isOverdue(todo) ? 'border-red-200 bg-red-50/40' : ''} ${todo.recurrence === 'daily' ? 'border-violet-200 bg-violet-50/30' : ''}`}
        >
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => onComplete(todo.id)}
              className="mt-0.5 w-5 h-5 rounded-full border-2 border-indigo-400 hover:bg-indigo-50 shrink-0"
              title={todo.recurrence === 'daily' ? 'Done for today' : 'Mark done'}
              aria-label={todo.recurrence === 'daily' ? 'Done for today' : 'Mark done'}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-slate-800 truncate">{todo.title}</h3>
                {todo.recurrence === 'daily' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-violet-100 text-violet-700">
                    Daily
                  </span>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${priorityColors[todo.priority] || priorityColors.normal}`}>
                  {todo.priority}
                </span>
              </div>
              {todo.notes && <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{todo.notes}</p>}
              <p className={`text-xs mt-1 ${isOverdue(todo) ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                {isOverdue(todo) ? 'Overdue · ' : ''}
                {formatDue(todo)}
                {!todo.recurrence || todo.recurrence !== 'daily'
                  ? todo.remindBeforeMinutes > 0 && ` · remind ${todo.remindBeforeMinutes}m early`
                  : ''}
              </p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button type="button" className="btn-secondary text-xs px-2 py-1" onClick={() => onEdit(todo)}>
                Edit
              </button>
              <button type="button" className="btn-danger text-xs" onClick={() => onDelete(todo.id)}>
                Delete
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

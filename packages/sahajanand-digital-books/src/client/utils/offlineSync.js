import { execGAS } from '../GAS';

const OFFLINE_QUEUE_KEY = 'sd_books_offline_queue';
const SYNC_LOCK_KEY = 'sd_books_sync_in_progress';

export const getOfflineQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch (e) {
    return [];
  }
};

const saveQueue = (queue) => {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

export const queueOfflineRequest = (functionName, args) => {
  const queue = getOfflineQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    functionName,
    args,
    timestamp: new Date().toISOString(),
    status: 'pending',
  });
  saveQueue(queue);
};

export const removeFromQueue = (id) => {
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  saveQueue(queue);
};

export const syncOfflineData = async () => {
  const lock = localStorage.getItem(SYNC_LOCK_KEY);
  if (lock && Date.now() - parseInt(lock, 10) < 30000) {
    return;
  }

  const queue = getOfflineQueue();
  const pendingItems = queue.filter((item) => item.status === 'pending');

  if (pendingItems.length === 0) return;

  localStorage.setItem(SYNC_LOCK_KEY, Date.now().toString());

  try {
    for (const item of pendingItems) {
      if (!navigator.onLine) break;

      const currentQueue = getOfflineQueue();
      const itemIdx = currentQueue.findIndex((q) => q.id === item.id);
      if (itemIdx === -1 || currentQueue[itemIdx].status === 'sending') continue;

      currentQueue[itemIdx].status = 'sending';
      saveQueue(currentQueue);

      try {
        await execGAS(item.functionName, ...item.args);
        removeFromQueue(item.id);
      } catch (err) {
        console.error(`Failed to process item ${item.id}:`, err);
        const retryQueue = getOfflineQueue();
        const retryIdx = retryQueue.findIndex((q) => q.id === item.id);
        if (retryIdx !== -1) {
          retryQueue[retryIdx].status = 'pending';
          saveQueue(retryQueue);
        }
      }
    }
  } finally {
    localStorage.removeItem(SYNC_LOCK_KEY);
  }
};

/**
 * Safely normalizes any input to a guaranteed JavaScript Array.
 * Handles strings (JSON parsed), objects, undefined, and null.
 */
export const toSafeArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return [];
    }
  }
  return [];
};

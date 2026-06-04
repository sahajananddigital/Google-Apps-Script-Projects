import { callGAS } from '../GAS';

export const getCachedDonors = () => {
  try {
    const cached = localStorage.getItem('gurukul_donors_cache');
    return cached ? JSON.parse(cached) : {};
  } catch (e) {
    console.error('Error parsing cached donors:', e);
    return {};
  }
};

export const setCachedDonors = (donorsList) => {
  try {
    const cacheObj = {};
    donorsList.forEach(donor => {
      if (donor.phone) {
        cacheObj[donor.phone] = donor;
      }
    });
    localStorage.setItem('gurukul_donors_cache', JSON.stringify(cacheObj));
  } catch (e) {
    console.error('Error saving donors to cache:', e);
  }
};

export const syncDonorsCache = async () => {
  try {
    const donors = await callGAS('getAllDonors');
    if (donors && Array.isArray(donors)) {
      setCachedDonors(donors);
    }
  } catch (e) {
    console.error('Failed to sync donors cache:', e);
  }
};

export const getDonorFromCache = (phone) => {
  const cache = getCachedDonors();
  return cache[phone] || null;
};

export const addDonorToCache = (donor) => {
  if (!donor || !donor.phone) return;
  const cache = getCachedDonors();
  cache[donor.phone] = donor;
  localStorage.setItem('gurukul_donors_cache', JSON.stringify(cache));
};

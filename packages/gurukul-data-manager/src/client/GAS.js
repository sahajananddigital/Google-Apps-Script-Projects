import { queueOfflineRequest } from './utils/offlineSync';

const mutatingFunctions = ['upsertUserProfile', 'logShiramani'];

/**
 * Raw execution of GAS function without queuing
 * @param {string} functionName 
 * @param  {...any} args 
 * @returns {Promise<any>}
 */
export const execGAS = (functionName, ...args) => {
  return new Promise((resolve, reject) => {
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler((error) => {
          console.error(`GAS Execution Error in ${functionName}:`, error);
          reject(error);
        })[functionName](...args);
    } else {
      console.warn(`google.script.run is not available. Mocking ${functionName}`);
      
      setTimeout(() => {
        if (functionName === 'getUserByContact') {
          const contact = args[0];
          if (contact === '9999999999' || contact === 'test@test.com') {
            resolve({
              userId: 'GDM-10001',
              createdDate: '2026-07-01T12:00:00Z',
              lastUpdated: '2026-07-04T12:00:00Z',
              surname: 'Patel',
              firstName: 'Ghanshyam',
              fatherName: 'Ramesh',
              fullName: 'Patel Ghanshyam Ramesh',
              phone: '9999999999',
              email: 'test@test.com',
              gender: 'Male',
              dateOfBirth: '1995-06-01',
              address: 'Ahmedabad, Gujarat',
              userType: 'Volunteer',
              department: 'Web Team',
              emergencyContactName: 'Ramesh Patel',
              emergencyContactPhone: '8888888888',
              notes: 'Mock user for local dev testing'
            });
          } else {
            resolve(null);
          }
        } else if (functionName === 'getAllUsers') {
          resolve([
            {
              userId: 'GDM-10001',
              createdDate: '2026-07-01T12:00:00Z',
              lastUpdated: '2026-07-04T12:00:00Z',
              surname: 'Patel',
              firstName: 'Ghanshyam',
              fatherName: 'Ramesh',
              fullName: 'Patel Ghanshyam Ramesh',
              phone: '9999999999',
              email: 'test@test.com',
              gender: 'Male',
              dateOfBirth: '1995-06-01',
              address: 'Ahmedabad, Gujarat',
              userType: 'Volunteer',
              department: 'Web Team',
              emergencyContactName: 'Ramesh Patel',
              emergencyContactPhone: '8888888888',
              notes: 'Mock user for local dev testing'
            },
            {
              userId: 'GDM-10002',
              createdDate: '2026-07-02T10:00:00Z',
              lastUpdated: '2026-07-02T10:00:00Z',
              surname: 'Patel',
              firstName: 'Hari',
              fatherName: 'Prem',
              fullName: 'Patel Hari Prem',
              phone: '7777777777',
              email: 'hari@test.com',
              gender: 'Male',
              dateOfBirth: '1998-09-15',
              address: 'Nikol, Ahmedabad',
              userType: 'Student',
              department: 'Sanskrit School',
              emergencyContactName: 'Prem Patel',
              emergencyContactPhone: '6666666666',
              notes: 'Another mock user'
            }
          ]);
        } else if (functionName === 'getRecentShiramaniLogs') {
          resolve([
            {
              date: '04/07/2026',
              userId: 'GDM-10001',
              surname: 'Patel',
              firstName: 'Ghanshyam',
              fatherName: 'Ramesh',
              fullName: 'Patel Ghanshyam',
              phone: '9999999999',
              email: 'test@test.com',
              serialNo: '101',
              thalNimitt: 'જન્મદિવસ',
              occupation: 'બિઝનેસ',
              devotees: [
                { surname: 'Patel', name: 'Kanti', dob: '1970-05-12', phone: '9898989898' }
              ],
              quantity: '4',
              items: 'મિષ્ટાન, ફરસાણ, શાક',
              notes: 'Morning Seva'
            }
          ]);
        } else {
          resolve({ success: true, message: 'Mocked response', mocked: true });
        }
      }, 500);
    }
  });
};

/**
 * A helper to call Google Apps Script functions
 * Mutations (add* or upsert*) are ALWAYS queued first and processed in background.
 * @param {string} functionName
 * @param {...any} args
 * @returns {Promise<any>}
 */
export const callGAS = (functionName, ...args) => {
  if (mutatingFunctions.includes(functionName)) {
    console.log(`Queuing transaction: ${functionName}`);
    queueOfflineRequest(functionName, args);
    return Promise.resolve({ success: true, offline: true, message: 'Transaction queued' });
  }
  return execGAS(functionName, ...args);
};

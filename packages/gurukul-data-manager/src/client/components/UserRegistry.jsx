import { useState, useEffect } from 'react';
import { callGAS } from '../GAS';

const UserRegistry = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, success, error
  const [editForm, setEditForm] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await callGAS('getAllUsers');
      setUsers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user) => {
    setEditForm({ ...user });
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      const updatedUser = await callGAS('upsertUserProfile', editForm);
      if (updatedUser) {
        setSaveStatus('success');
        await fetchUsers();
        setSelectedUser(updatedUser);
        setTimeout(() => {
          setIsEditing(false);
          setSaveStatus('idle');
        }, 1500);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const getCombinedName = (u) => {
    return `${u.surname || ''} ${u.firstName || ''} ${u.fatherName || ''}`.trim() || 'No Name';
  };

  const filteredUsers = users.filter(user => {
    const searchLower = search.toLowerCase();
    const combinedName = getCombinedName(user).toLowerCase();
    return (
      combinedName.includes(searchLower) ||
      (user.phone || '').toLowerCase().includes(searchLower) ||
      (user.email || '').toLowerCase().includes(searchLower) ||
      (user.userType || '').toLowerCase().includes(searchLower) ||
      (user.department || '').toLowerCase().includes(searchLower) ||
      (user.userId || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6 bg-slate-50 space-y-6">
      
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            placeholder="Search by name, ID, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button 
          onClick={fetchUsers} 
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
        >
          Reload Registry
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span className="text-sm text-slate-500 font-semibold">Loading registry...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Users List Pane */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-700">User Records ({filteredUsers.length})</h3>
              <span className="text-[10px] text-slate-400 font-medium">Click a user to view full profile</span>
            </div>
            
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-12">No matching users found.</p>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.userId}
                    onClick={() => { setSelectedUser(user); setIsEditing(false); }}
                    className={`p-4 hover:bg-orange-50/20 transition-all cursor-pointer flex justify-between items-center border-l-4 ${
                      selectedUser?.userId === user.userId ? 'border-orange-500 bg-orange-50/30' : 'border-transparent'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">{getCombinedName(user)}</h4>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-655 rounded text-[9px] font-mono font-bold">
                          {user.userId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-4">
                        <span className="flex items-center gap-1">📞 {user.phone}</span>
                        {user.email && <span className="flex items-center gap-1">✉️ {user.email}</span>}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-bold border border-orange-100 whitespace-nowrap">
                        {user.userType}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User Details / Editor Pane */}
          <div className="lg:col-span-1">
            {selectedUser ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{getCombinedName(selectedUser)}</h3>
                    <code className="text-xs text-orange-500 font-mono font-bold">{selectedUser.userId}</code>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => handleEditClick(selectedUser)}
                      className="px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                {!isEditing ? (
                  // Detail View
                  <div className="space-y-4 text-xs text-slate-600">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Surname (અટક)</span>
                        <p className="font-semibold text-slate-700 mt-0.5">{selectedUser.surname || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">First Name (નામ)</span>
                        <p className="font-semibold text-slate-700 mt-0.5">{selectedUser.firstName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Father's Name (પિતા)</span>
                        <p className="font-semibold text-slate-700 mt-0.5">{selectedUser.fatherName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Phone</span>
                        <p className="font-semibold text-slate-700 mt-0.5">{selectedUser.phone}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Role / Type</span>
                        <p className="font-semibold text-slate-700 mt-0.5">{selectedUser.userType}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Department</span>
                        <p className="font-semibold text-slate-700 mt-0.5">{selectedUser.department || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Gender</span>
                        <p className="font-semibold text-slate-700 mt-0.5">{selectedUser.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth</span>
                        <p className="font-semibold text-slate-700 mt-0.5">{selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString('en-IN') : 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-100 pt-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Residential Address</span>
                      <p className="font-semibold text-slate-700 mt-0.5 whitespace-pre-wrap">{selectedUser.address || 'No address configured'}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Emergency Name</span>
                        <p className="font-semibold text-slate-700 mt-0.5">{selectedUser.emergencyContactName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Emergency Phone</span>
                        <p className="font-semibold text-slate-700 mt-0.5">{selectedUser.emergencyContactPhone || 'N/A'}</p>
                      </div>
                    </div>

                    {selectedUser.notes && (
                      <div className="border-t border-slate-100 pt-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Remarks / Notes</span>
                        <p className="font-semibold text-slate-600 mt-0.5 italic">{selectedUser.notes}</p>
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-4 text-[10px] text-slate-400 space-y-0.5 font-medium">
                      <p>Created: {new Date(selectedUser.createdDate).toLocaleString()}</p>
                      <p>Last Sync: {new Date(selectedUser.lastUpdated).toLocaleString()}</p>
                    </div>

                  </div>
                ) : (
                  // Editor Form
                  <form onSubmit={handleSave} className="space-y-4 text-xs">
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Surname (અટક)</label>
                      <input
                        type="text"
                        name="surname"
                        value={editForm.surname || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">First Name (નામ)</label>
                      <input
                        type="text"
                        name="firstName"
                        value={editForm.firstName || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Father's Name (પિતા)</label>
                      <input
                        type="text"
                        name="fatherName"
                        value={editForm.fatherName || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Phone</label>
                        <input
                          type="text"
                          name="phone"
                          value={editForm.phone || ''}
                          onChange={handleInputChange}
                          required
                          className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={editForm.email || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Role Type</label>
                        <select
                          name="userType"
                          value={editForm.userType || 'Volunteer'}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500 bg-white"
                        >
                          <option value="Student">Student</option>
                          <option value="Teacher">Teacher</option>
                          <option value="Volunteer">Volunteer</option>
                          <option value="Staff">Staff</option>
                          <option value="Guest">Guest</option>
                          <option value="Donor">Donor</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Department</label>
                        <select
                          name="department"
                          value={editForm.department || 'Web Team'}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500 bg-white"
                        >
                          <option value="Administration">Administration</option>
                          <option value="Kitchen">Kitchen</option>
                          <option value="Sanskrit School">Sanskrit School</option>
                          <option value="Primary School">Primary School</option>
                          <option value="Hostel">Hostel</option>
                          <option value="Accounts">Accounts</option>
                          <option value="Pujari">Pujari</option>
                          <option value="Web Team">Web Team</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Gender</label>
                        <select
                          name="gender"
                          value={editForm.gender || 'Male'}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500 bg-white"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={editForm.dateOfBirth || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Address</label>
                      <textarea
                        name="address"
                        value={editForm.address || ''}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Emergency Name</label>
                        <input
                          type="text"
                          name="emergencyContactName"
                          value={editForm.emergencyContactName || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Emergency Phone</label>
                        <input
                          type="text"
                          name="emergencyContactPhone"
                          value={editForm.emergencyContactPhone || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Remarks/Notes</label>
                      <textarea
                        name="notes"
                        value={editForm.notes || ''}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={saveStatus === 'saving'}
                        className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold shadow-md shadow-orange-100 transition-colors disabled:opacity-55 cursor-pointer"
                      >
                        {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    {saveStatus === 'success' && (
                      <p className="text-[10px] text-green-600 text-center font-bold">✓ Profile updated successfully!</p>
                    )}
                    {saveStatus === 'error' && (
                      <p className="text-[10px] text-rose-600 text-center font-bold">✗ Failed to update profile. Try again.</p>
                    )}
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-400 font-medium text-xs">
                Select a user record from the list to view or edit their profile details.
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default UserRegistry;

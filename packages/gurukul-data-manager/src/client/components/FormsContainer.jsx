import { useState, useEffect } from 'react';
import { callGAS } from '../GAS';

// Reusable Sub-Form for Profile Registration Fields
const ProfileFields = ({ data, onChange }) => {
  return (
    <div className="space-y-4 border-t border-slate-100 pt-4 animate-fadeIn">
      <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-lg text-xs text-orange-700 font-semibold mb-2">
        ℹ️ પ્રોફાઇલ વિગતો ફક્ત એક જ વાર ભરવાની રહેશે. બીજી વખત ફક્ત તમારો મોબાઈલ અથવા ઇમેઇલ દાખલ કરવાનો રહેશે.
      </div>
      
      {/* Split name inputs (responsive grid: stacks on mobile, 3 columns on tablet/desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">અટક (Surname)</label>
          <input
            type="text"
            name="surname"
            value={data.surname || ''}
            onChange={onChange}
            required
            placeholder="અટક લખો"
            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">નામ (First Name)</label>
          <input
            type="text"
            name="firstName"
            value={data.firstName || ''}
            onChange={onChange}
            required
            placeholder="નામ લખો"
            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">પિતાનું નામ (Father's Name)</label>
          <input
            type="text"
            name="fatherName"
            value={data.fatherName || ''}
            onChange={onChange}
            required
            placeholder="પિતાનું નામ લખો"
            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">રોલ પ્રકાર (Role Type)</label>
          <select
            name="userType"
            value={data.userType || 'Volunteer'}
            onChange={onChange}
            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500 bg-white"
          >
            <option value="Student">વિદ્યાર્થી (Student)</option>
            <option value="Teacher">શિક્ષક (Teacher)</option>
            <option value="Volunteer">સ્વયંસેવક (Volunteer)</option>
            <option value="Staff">સ્ટાફ (Staff)</option>
            <option value="Guest">મહેમાન (Guest)</option>
            <option value="Donor">દાતા (Donor)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">વિભાગ (Department)</label>
          <select
            name="department"
            value={data.department || 'Web Team'}
            onChange={onChange}
            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500 bg-white"
          >
            <option value="Administration">વહીવટ (Administration)</option>
            <option value="Kitchen">રસોડું (Kitchen)</option>
            <option value="Sanskrit School">સંસ્કૃત પાઠશાળા (Sanskrit School)</option>
            <option value="Primary School">પ્રાથમિક શાળા (Primary School)</option>
            <option value="Hostel">છાત્રાલય (Hostel)</option>
            <option value="Accounts">હિસાબ વિભાગ (Accounts)</option>
            <option value="Pujari">પૂજારી સેવા (Pujari)</option>
            <option value="Web Team">વેબ આઈટી ટીમ (Web Team)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">લિંગ (Gender)</label>
          <select
            name="gender"
            value={data.gender || 'Male'}
            onChange={onChange}
            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500 bg-white"
          >
            <option value="Male">પુરુષ (Male)</option>
            <option value="Female">સ્ત્રી (Female)</option>
            <option value="Other">અન્ય (Other)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">જન્મ તારીખ (DOB)</label>
          <input
            type="date"
            name="dateOfBirth"
            value={data.dateOfBirth || ''}
            onChange={onChange}
            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase">સરનામું (Address)</label>
        <textarea
          name="address"
          value={data.address || ''}
          onChange={onChange}
          rows="2"
          placeholder="ગામ, તાલુકો, જીલ્લો અને પિનકોડ સાથે સરનામું"
          className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase font-semibold text-rose-500">ઇમરજન્સી સંપર્ક નામ</label>
          <input
            type="text"
            name="emergencyContactName"
            value={data.emergencyContactName || ''}
            onChange={onChange}
            placeholder="વાલી અથવા સગા સંબંધીનું નામ"
            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase font-semibold text-rose-500">ઇમરજન્સી સંપર્ક ફોન</label>
          <input
            type="text"
            name="emergencyContactPhone"
            value={data.emergencyContactPhone || ''}
            onChange={onChange}
            placeholder="સંપર્ક કરવા માટેનો નંબર"
            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase">અન્ય નોંધ (Notes)</label>
        <textarea
          name="notes"
          value={data.notes || ''}
          onChange={onChange}
          rows="1"
          placeholder="વધારાની કોઈપણ માહિતી..."
          className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
        />
      </div>
    </div>
  );
};

const FormsContainer = () => {
  const [activeTab, setActiveTab] = useState('shiramani');
  const [lookupContact, setLookupContact] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupAttempted, setLookupAttempted] = useState(false);
  
  // Forms States
  const [profileData, setProfileData] = useState({
    surname: '', firstName: '', fatherName: '', phone: '', email: '', gender: 'Male', dateOfBirth: '',
    address: '', userType: 'Volunteer', department: 'Web Team',
    emergencyContactName: '', emergencyContactPhone: '', notes: ''
  });
  
  const [attendanceData, setAttendanceData] = useState({ purpose: 'Daily Seva', notes: '' });
  const [serviceData, setServiceData] = useState({ date: new Date().toISOString().split('T')[0], activity: '', hours: '', supervisor: '', notes: '' });
  const [feedbackData, setFeedbackData] = useState({ category: 'General', description: '', priority: 'Medium' });
  
  // Pratah Shiramani State
  const [shiramaniData, setShiramaniData] = useState({
    date: new Date().toISOString().split('T')[0],
    serialNo: '',
    thalNimitt: 'પ્રસન્નાર્થે',
    occupation: 'બિઝનેસ',
    devotees: [], // dynamic list
    quantity: '',
    items: [],
    notes: ''
  });

  const [formStatus, setFormStatus] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Handle auto lookup when typing contact details
  useEffect(() => {
    const term = lookupContact.trim();
    const isPhone = /^\d{10}$/.test(term);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(term);
    
    if (isPhone || isEmail) {
      triggerLookup(term);
    } else {
      setFoundUser(null);
      setLookupAttempted(false);
    }
  }, [lookupContact]);

  const triggerLookup = async (contactVal) => {
    const query = contactVal || lookupContact.trim();
    if (!query) return;

    setLookupLoading(true);
    setLookupAttempted(true);
    try {
      const user = await callGAS('getUserByContact', query);
      setFoundUser(user);
      if (user) {
        setProfileData({ ...user });
      } else {
        const isEmail = query.includes('@');
        setProfileData({
          surname: '',
          firstName: '',
          fatherName: '',
          phone: isEmail ? '' : query,
          email: isEmail ? query : '',
          gender: 'Male',
          dateOfBirth: '',
          address: '',
          userType: 'Volunteer',
          department: 'Web Team',
          emergencyContactName: '',
          emergencyContactPhone: '',
          notes: ''
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const resetAllForms = () => {
    setLookupContact('');
    setFoundUser(null);
    setLookupAttempted(false);
    setAttendanceData({ purpose: 'Daily Seva', notes: '' });
    setServiceData({ date: new Date().toISOString().split('T')[0], activity: '', hours: '', supervisor: '', notes: '' });
    setFeedbackData({ category: 'General', description: '', priority: 'Medium' });
    setShiramaniData({
      date: new Date().toISOString().split('T')[0],
      serialNo: '',
      thalNimitt: 'પ્રસન્નાર્થે',
      occupation: 'બિઝનેસ',
      devotees: [],
      quantity: '',
      items: [],
      notes: ''
    });
    setProfileData({
      surname: '', firstName: '', fatherName: '', phone: '', email: '', gender: 'Male', dateOfBirth: '',
      address: '', userType: 'Volunteer', department: 'Web Team',
      emergencyContactName: '', emergencyContactPhone: '', notes: ''
    });
    setFormStatus('idle');
  };

  const handleDevoteeChange = (index, field, value) => {
    const updatedDevotees = [...shiramaniData.devotees];
    updatedDevotees[index] = {
      ...updatedDevotees[index],
      [field]: value
    };
    setShiramaniData(prev => ({ ...prev, devotees: updatedDevotees }));
  };

  const addDevotee = () => {
    if (shiramaniData.devotees.length < 5) {
      setShiramaniData(prev => ({
        ...prev,
        devotees: [...prev.devotees, { surname: '', name: '', dob: '', phone: '' }]
      }));
    }
  };

  const removeDevotee = (index) => {
    const updatedDevotees = shiramaniData.devotees.filter((_, i) => i !== index);
    setShiramaniData(prev => ({ ...prev, devotees: updatedDevotees }));
  };

  const handleCheckboxChange = (item) => {
    const currentItems = [...shiramaniData.items];
    if (currentItems.includes(item)) {
      setShiramaniData(prev => ({
        ...prev,
        items: currentItems.filter(i => i !== item)
      }));
    } else {
      setShiramaniData(prev => ({
        ...prev,
        items: [...currentItems, item]
      }));
    }
  };

  const getCombinedName = (u) => {
    return `${u.surname || ''} ${u.firstName || ''} ${u.fatherName || ''}`.trim() || 'No Name';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('submitting');

    try {
      let finalUser = foundUser;
      
      // Inline Profile Registry
      if (!finalUser) {
        const contactVal = lookupContact.trim();
        const isEmail = contactVal.includes('@');
        const submitProfile = {
          ...profileData,
          phone: profileData.phone || (isEmail ? '' : contactVal),
          email: profileData.email || (isEmail ? contactVal : '')
        };

        if (!submitProfile.surname || !submitProfile.firstName || !submitProfile.fatherName || (!submitProfile.phone && !submitProfile.email)) {
          throw new Error("નવું રજીસ્ટ્રેશન કરવા માટે અટક, નામ, પિતા અને ફોન/ઇમેઇલ આપવો ફરજીયાત છે.");
        }

        const registered = await callGAS('upsertUserProfile', submitProfile);
        if (!registered) throw new Error("પ્રોફાઇલ રજીસ્ટર કરવામાં મુશ્કેલી આવી છે.");
        finalUser = registered;
        setFoundUser(registered);
      }

      // Submit Breakfast Form Data
      const contactPayload = {
        phone: finalUser.phone,
        email: finalUser.email,
        surname: finalUser.surname,
        firstName: finalUser.firstName,
        fatherName: finalUser.fatherName,
        fullName: getCombinedName(finalUser)
      };

      if (activeTab === 'attendance') {
        const payload = { ...contactPayload, ...attendanceData };
        await callGAS('logAttendance', payload);
        setStatusMessage(`હાઝરી નોંધવામાં આવી છે: ${contactPayload.fullName}`);
      } else if (activeTab === 'service') {
        const payload = { ...contactPayload, ...serviceData };
        await callGAS('logServiceHours', payload);
        setStatusMessage(`સેવા કલાકો સફળતાપૂર્વક સાચવેલ છે: ${contactPayload.fullName}`);
      } else if (activeTab === 'feedback') {
        const payload = { ...contactPayload, ...feedbackData };
        await callGAS('submitFeedback', payload);
        setStatusMessage(`પ્રતિભાવ સફળતાપૂર્વક મોકલવામાં આવ્યો છે: ${contactPayload.fullName}`);
      } else if (activeTab === 'shiramani') {
        const payload = { ...contactPayload, ...shiramaniData };
        await callGAS('logShiramani', payload);
        setStatusMessage(`પ્રાતઃ શિરામણી થાળની વિગત સાચવી લીધેલ છે: ${contactPayload.fullName}`);
      } else if (activeTab === 'profile') {
        setStatusMessage(`પ્રોફાઇલ વિગત સફળતાપૂર્વક અપડેટ કરેલ છે: ${contactPayload.fullName}`);
      }

      setFormStatus('success');
      setTimeout(() => {
        resetAllForms();
      }, 3500);

    } catch (err) {
      console.error(err);
      setFormStatus('error');
      setStatusMessage(err.message || "વિગત સાચવવામાં કોઈ સમસ્યા આવી છે. કૃપા કરીને ફરી પ્રયાસ કરો.");
      setTimeout(() => setFormStatus('idle'), 5000);
    }
  };

  return (
    <div className="p-6 bg-slate-50 max-w-2xl mx-auto space-y-6">
      
      {/* Selector Tabs (responsive) */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-200/60 rounded-xl">
        {[
          { id: 'shiramani', label: 'પ્રાતઃ શિરામણી' },
          { id: 'profile', label: 'Profile' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setLookupAttempted(false); setFoundUser(null); setLookupContact(''); }}
            className={`flex-1 min-w-[85px] py-2 px-1 text-center font-bold text-xs rounded-lg transition-all cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-orange-500 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide">
            {{
              shiramani: 'શ્રી સ્વામિનારાયણ ગુરુકુલ રાજકોટ સંસ્થાન - શાખા અમદાવાદ નિકોલ - પ્રાતઃ શિરામણી',
              profile: 'Master Profile Registration'
            }[activeTab]}
          </h3>
          <p className="text-xs text-slate-450">
            {{
              shiramani: 'શિરામણી થાળ તથા ભક્તોની વિગત નોંધવા માટેનું ફોર્મ.',
              profile: 'Create or update your central participant profile details.'
            }[activeTab]}
          </p>
        </div>

        {formStatus === 'success' ? (
          <div className="py-12 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-800">સફળતાપૂર્વક સબમિટ કરેલ છે!</h4>
              <p className="text-xs text-slate-500 font-medium">{statusMessage}</p>
            </div>
            <p className="text-[10px] text-slate-400 animate-pulse">નવું ફોર્મ લોડ થઈ રહ્યું છે...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* STEP 1: Central Identity Lookup */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100 relative">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  {activeTab === 'profile' ? 'પ્રોફાઇલ શોધો અથવા નવી બનાવો' : 'પગલું ૧: પ્રોફાઇલ ચકાસણી (Verify Profile)'}
                </label>
                {lookupLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
                )}
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    placeholder="મોબાઈલ નંબર અથવા ઇમેઇલ દાખલ કરો"
                    value={lookupContact}
                    onChange={(e) => setLookupContact(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                  />
                  <span className="absolute left-3 top-3.5 text-slate-400 text-xs">📞</span>
                </div>
                <button
                  type="button"
                  onClick={() => triggerLookup()}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  ચકાસો
                </button>
              </div>

              {/* Lookup Response Banner */}
              {lookupAttempted && !lookupLoading && (
                foundUser ? (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-lg flex items-center justify-between text-xs animate-scaleUp">
                    <div>
                      <span className="font-bold">✓ પ્રોફાઇલ મળી ગઈ: {getCombinedName(foundUser)}</span>
                      <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">{foundUser.userType} • {foundUser.department || 'No Dept'}</p>
                    </div>
                    <code className="text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-700">
                      {foundUser.userId}
                    </code>
                  </div>
                ) : (
                  <div className="bg-amber-50 text-amber-800 border border-amber-100 p-3 rounded-lg text-xs animate-scaleUp">
                    <span className="font-bold">⚠️ આ નંબર પર પ્રોફાઇલ રજીસ્ટર નથી.</span>
                    <p className="text-[10px] text-amber-600 mt-0.5 font-medium">કૃપા કરીને નીચે તમારી પ્રોફાઇલ વિગતો એકવાર ભરો, તે ભવિષ્ય માટે સેવ થઇ જશે.</p>
                  </div>
                )
              )}
            </div>

            {/* STEP 2: Main Module Fields */}
            {(!lookupAttempted && activeTab !== 'profile') ? (
              <div className="p-8 text-center bg-slate-50/20 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-semibold">
                ચકાસણી કરવા માટે કૃપા કરીને ઉપર મોબાઈલ નંબર અથવા ઇમેઇલ લખો.
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* 1. PRATAH SHIRAMANI MODULE */}
                {activeTab === 'shiramani' && (
                  <div className="space-y-6 border-t border-slate-100 pt-4 animate-fadeIn">
                    
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">પગલું ૨: શિરામણી થાળ વિગત (Breakfast Form)</h4>
                    </div>

                    {/* Stacks on mobile, 2 columns on desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">તારીખ (Date)</label>
                        <input
                          type="date"
                          required
                          value={shiramaniData.date}
                          onChange={(e) => setShiramaniData(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">ક્રમ. નં (Serial No.)</label>
                        <input
                          type="text"
                          placeholder="દાખલ કરો ક્રમ નંબર"
                          value={shiramaniData.serialNo}
                          onChange={(e) => setShiramaniData(prev => ({ ...prev, serialNo: e.target.value }))}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">થાળ નિમિત્ત</label>
                        <select
                          value={shiramaniData.thalNimitt}
                          onChange={(e) => setShiramaniData(prev => ({ ...prev, thalNimitt: e.target.value }))}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500"
                        >
                          <option value="પ્રસન્નાર્થે">પ્રસન્નાર્થે</option>
                          <option value="જન્મદિવસ">જન્મદિવસ</option>
                          <option value="એનિવર્સરી">એનિવર્સરી</option>
                          <option value="શ્રદ્ધાંજલિ">શ્રદ્ધાંજલિ</option>
                          <option value="અન્ય">અન્ય</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">વ્યવસાય (Occupation)</label>
                        <select
                          value={shiramaniData.occupation}
                          onChange={(e) => setShiramaniData(prev => ({ ...prev, occupation: e.target.value }))}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500"
                        >
                          <option value="બિઝનેસ">બિઝનેસ (Business)</option>
                          <option value="જોબ">જોબ (Job)</option>
                        </select>
                      </div>
                    </div>

                    {/* DEVOTEES SUB SECTION */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-3.5 bg-orange-400 rounded-full"></span>
                          <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">પૂજા માં બેસનાર ભક્તો (મહત્તમ ૫)</h5>
                        </div>
                        {shiramaniData.devotees.length < 5 && (
                          <button
                            type="button"
                            onClick={addDevotee}
                            className="px-2.5 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer"
                          >
                            + ઉમેરો ભક્ત
                          </button>
                        )}
                      </div>

                      {shiramaniData.devotees.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic text-center py-2">પૂજા માં બેસનાર ભક્તોની યાદી ખાલી છે. ઉમેરવા માટે ઉપર ક્લિક કરો.</p>
                      ) : (
                        <div className="space-y-4">
                          {shiramaniData.devotees.map((devotee, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg border border-slate-150 relative space-y-3 animate-fadeIn">
                              <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                                <span className="text-[10px] font-bold text-slate-500">ભક્ત {index + 1} ની વિગત</span>
                                <button
                                  type="button"
                                  onClick={() => removeDevotee(index)}
                                  className="text-rose-500 hover:text-rose-700 text-[10px] font-bold cursor-pointer"
                                >
                                  ✖ રદ કરો
                                </button>
                              </div>

                              {/* Devotee split names Surname + First Name */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase">અટક (Surname)</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="અટક"
                                    value={devotee.surname || ''}
                                    onChange={(e) => handleDevoteeChange(index, 'surname', e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-orange-500"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase">નામ (First Name)</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="નામ"
                                    value={devotee.name || ''}
                                    onChange={(e) => handleDevoteeChange(index, 'name', e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-orange-500"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase">જન્મ તારીખ (DOB)</label>
                                  <input
                                    type="date"
                                    value={devotee.dob}
                                    onChange={(e) => handleDevoteeChange(index, 'dob', e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-orange-500"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase">મોબાઈલ નં.</label>
                                  <input
                                    type="text"
                                    placeholder="મોબાઈલ નંબર"
                                    value={devotee.phone}
                                    onChange={(e) => handleDevoteeChange(index, 'phone', e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-orange-500"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* QUANTITY AND ITEMS */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">સંખ્યા (Quantity)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="જમણવાર / પ્રસાદ લેનારની કુલ સંખ્યા (e.g. 50)"
                          value={shiramaniData.quantity}
                          onChange={(e) => setShiramaniData(prev => ({ ...prev, quantity: e.target.value }))}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">આઇટમ્સની વિગત (Items Detail)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {["મિષ્ટાન", "ફરસાણ", "શાક", "ફળ", "જ્યુશ / શરબત", "મુખવાસ", "અન્ય"].map(item => (
                            <label key={item} className="flex items-center gap-2 text-xs font-bold text-slate-650 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={shiramaniData.items.includes(item)}
                                onChange={() => handleCheckboxChange(item)}
                                className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500 cursor-pointer"
                              />
                              {item}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">વધારાની વિગત / નોંધ (Notes)</label>
                      <textarea
                        rows="2"
                        placeholder="કોઈ खास સૂચના અથવા આઇટમનું લિસ્ટ..."
                        value={shiramaniData.notes}
                        onChange={(e) => setShiramaniData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>

                  </div>
                )}

                {/* STEP 3: Inline Profile Registration Form (if not found in database) */}
                {!foundUser && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-semibold text-rose-500">
                        {activeTab === 'profile' ? 'Master Profile Registration' : 'પગલું ૩: નવી પ્રોફાઇલ રજીસ્ટ્રેશન વિગત'}
                      </h4>
                    </div>
                    <ProfileFields data={profileData} onChange={handleProfileChange} />
                  </div>
                )}

                {/* Form Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="submit"
                    disabled={formStatus === 'submitting'}
                    className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-100 transition-all disabled:opacity-55 cursor-pointer"
                  >
                    {formStatus === 'submitting' ? 'પ્રોસેસિંગ...' : (
                      !foundUser ? 'પ્રોફાઇલ સેવ કરો અને સબમિટ કરો' : 'સબમિટ કરો (Submit)'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetAllForms}
                    className="px-6 py-3 border border-slate-200 text-slate-500 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    સાફ કરો
                  </button>
                </div>

                {formStatus === 'error' && (
                  <div className="bg-rose-50 text-rose-700 border border-rose-100 p-3 rounded-lg text-xs font-semibold text-center animate-shake">
                    ✗ {statusMessage}
                  </div>
                )}

              </div>
            )}
            
          </form>
        )}

      </div>
    </div>
  );
};

export default FormsContainer;

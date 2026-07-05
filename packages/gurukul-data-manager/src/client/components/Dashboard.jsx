import { useState, useEffect } from 'react';
import { callGAS } from '../GAS';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [shiramaniLogs, setShiramaniLogs] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEntries: 0,
    totalShiramaniQty: 0
  });

  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, allShiramani] = await Promise.all([
        callGAS('getAllUsers'),
        callGAS('getRecentShiramaniLogs')
      ]);

      const loadedUsers = allUsers || [];
      const loadedShiramani = allShiramani || [];

      setUsers(loadedUsers);
      setShiramaniLogs(loadedShiramani);

      // Calculate Stats
      const totalShiramaniQty = loadedShiramani.reduce((sum, log) => sum + (Number(log.quantity) || 0), 0);

      setStats({
        totalUsers: loadedUsers.length,
        totalEntries: loadedShiramani.length,
        totalShiramaniQty
      });
    } catch (e) {
      console.error("Error loading dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold">Loading Live Dashboard...</p>
        </div>
      </div>
    );
  }

  const typeCounts = users.reduce((acc, u) => {
    acc[u.userType] = (acc[u.userType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-8 bg-slate-50">
      
      {/* Action Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800">પ્રાતઃ શિરામણી ડેશબોર્ડ (Breakfast Dashboard)</h2>
          <p className="text-xs text-slate-450">શિરામણી થાળ નોંધણી અને દાતા પ્રોફાઇલનું જીવંત વિશ્લેષણ.</p>
        </div>
        <button 
          onClick={loadData}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md shadow-orange-100 transition-all cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
          </svg>
          રીફ્રેશ કરો
        </button>
      </div>

      {/* Stats Cards Grid (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">કુલ નોંધાયેલ સભ્યો</span>
            <h3 className="text-3xl font-extrabold text-slate-800 group-hover:text-orange-500 transition-colors">{stats.totalUsers}</h3>
            <p className="text-xs text-slate-500 font-medium">Verified User Profiles</p>
          </div>
          <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl group-hover:scale-105 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">કુલ નોંધાયેલ થાળીઓ</span>
            <h3 className="text-3xl font-extrabold text-slate-800 group-hover:text-amber-500 transition-colors">{stats.totalEntries}</h3>
            <p className="text-xs text-slate-500 font-medium">Total Breakfast Bookings</p>
          </div>
          <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl group-hover:scale-105 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">કુલ જમણવાર સંખ્યા (Quantity)</span>
            <h3 className="text-3xl font-extrabold text-slate-800 group-hover:text-emerald-500 transition-colors">{stats.totalShiramaniQty}</h3>
            <p className="text-xs text-slate-500 font-medium">Sum of All Servings</p>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl group-hover:scale-105 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side - User Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 lg:col-span-1">
          <div>
            <h3 className="text-base font-bold text-slate-800">સભ્યોનું વર્ગીકરણ (User Distribution)</h3>
            <p className="text-xs text-slate-450">નોંધાયેલા દાતાઓનું રોલ મુજબ લિસ્ટ</p>
          </div>
          
          <div className="space-y-4">
            {Object.keys(typeCounts).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">હજુ સુધી કોઈ પ્રોફાઇલ રજીસ્ટર નથી</p>
            ) : (
              Object.entries(typeCounts).map(([type, count]) => {
                const percentage = Math.round((count / users.length) * 100);
                const colorMap = {
                  Volunteer: 'bg-blue-500 text-blue-500',
                  Student: 'bg-emerald-500 text-emerald-500',
                  Teacher: 'bg-indigo-500 text-indigo-500',
                  Staff: 'bg-amber-500 text-amber-500',
                  Guest: 'bg-slate-500 text-slate-500',
                  Donor: 'bg-rose-500 text-rose-500'
                };
                const color = colorMap[type] || 'bg-slate-400 text-slate-400';
                const colorBg = color.split(' ')[0];

                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-650">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${colorBg}`}></span>
                        {type === 'Volunteer' ? 'સ્વયંસેવક' : type === 'Student' ? 'વિદ્યાર્થી' : type === 'Teacher' ? 'શિક્ષક' : type === 'Donor' ? 'દાતા' : type}
                      </span>
                      <span>{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${colorBg}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side - Activity Logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Breakfast Logs */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800">તાજેતરમાં નોંધાયેલ શિરામણી થાળ</h3>
                <p className="text-xs text-slate-400">નવી નોંધાયેલ શિરામણી સેવા વિગતો</p>
              </div>
              <span className="px-2.5 py-1 bg-slate-50 text-[10px] text-slate-555 font-bold border border-slate-100 rounded-lg">
                નવીનતમ ૫ થાળ વિગત
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-650">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <th className="p-3">તારીખ</th>
                    <th className="p-3">ક્રમ નં.</th>
                    <th className="p-3">નામ</th>
                    <th className="p-3">નિમિત્ત</th>
                    <th className="p-3">સંખ્યા</th>
                    <th className="p-3">આઇટમ્સ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shiramaniLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-slate-400 font-medium">હજુ સુધી કોઈ શિરામણી થાળ નોંધાયો નથી.</td>
                    </tr>
                  ) : (
                    shiramaniLogs.slice(0, 5).map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-500">{log.date}</td>
                        <td className="p-3 font-bold text-slate-700">{log.serialNo || '-'}</td>
                        <td className="p-3 font-bold text-slate-800">{log.fullName}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[10px] font-bold border border-orange-100">
                            {log.thalNimitt}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-750">{log.quantity}</td>
                        <td className="p-3 text-slate-550 truncate max-w-[120px]" title={log.items}>{log.items}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Share Links Panel - Full Width */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-800">સંપર્ક લિંક શેર કરો</h3>
          <p className="text-xs text-slate-455">દેવસ્થાનના હરિભક્તો સાથે આ શિરામણી પૃષ્ઠ લિંક સીધી શેર કરો.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-5 bg-orange-50/40 rounded-2xl border border-orange-100">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">લિંક શેર કરો (Share Web Form Link)</h4>
            <p className="text-xs text-slate-500 max-w-xl font-medium">
              આ લિંક કોપી કરીને હરિભક્તોને મોકલો જેથી તેઓ પોતાના ફોનથી જ થાળની વિગતો અને પૂજામાં બેસનાર સભ્યોના નામ સેવ કરી શકે.
            </p>
          </div>
          <button 
            type="button"
            onClick={handleCopyLink}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-md shadow-orange-150 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-5 10h6m-6 4h6m-6-8h8" />
            </svg>
            {copied ? 'લિંક કોપી થઈ ગઈ!' : 'કોપી કરો લિંક (Copy Link)'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;

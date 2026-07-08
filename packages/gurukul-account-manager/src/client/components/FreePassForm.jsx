import { useState, useEffect } from 'react';
import { callGAS } from '../GAS';

const FreePassForm = () => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [passTypes, setPassTypes] = useState(['Hostel', 'Student', 'Teacher', 'Staff']);
  const [selectedPassType, setSelectedPassType] = useState('Hostel');
  const [customPassType, setCustomPassType] = useState('Hostel');

  useEffect(() => {
    callGAS('getFreePassTypes')
      .then((types) => {
        if (Array.isArray(types) && types.length > 0) {
          const formatted = types.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
          setPassTypes(formatted);
          setSelectedPassType(formatted[0]);
          setCustomPassType(formatted[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch free pass types:', err);
      });
  }, []);

  const displayQuantity = quantity === "" ? "" : parseInt(quantity) || 0;

  const handleIncrement = () => setQuantity(prev => (parseInt(prev) || 0) + 1);
  const handleDecrement = () => setQuantity(prev => Math.max(1, (parseInt(prev) || 1) - 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalQty = Math.max(1, parseInt(quantity) || 1);
    
    const today = new Date().toLocaleDateString('en-GB');
    const todayTime = new Date().toLocaleTimeString('en-GB');
    const freePassTime = todayTime < '17:00:00' ? 'Lunch' : 'Dinner';
    const tempId = Math.floor(Date.now() / 1000).toString().slice(-6);
    const passTypeToSend = customPassType.trim() || 'Free Pass';

    const freePassData = {
      quantity: finalQty,
      date: today,
      time: todayTime,
      freePassTime: freePassTime,
      passType: passTypeToSend,
      tempId
    };

    // 1. Open Print Window Instantly
    const htmlContent = `
<div style="display: flex; justify-content: center; width: 100%;">
<pre style="font-family: monospace; font-size: 14px; font-weight: bold; white-space: pre-wrap; word-wrap: break-word; text-align: left; max-width: 300px;">
Shree Swaminarayan Gurukul
-------------------------
    🎫 FREE PASS 🎫        
-------------------------

Ref ID     : ${tempId}
Date       : ${today} 
Time       : ${todayTime} (${freePassTime})
Quantity   : ${finalQty}
----------------------------
Pass Type  : Free Pass (${passTypeToSend})

🙏 Jay Swaminarayan 🙏
</pre>
</div>`;

    const win = window.open('', '', 'width=1200,height=800');
    win.document.write(`
      <html><head><title>Print Free Pass</title></head>
      <body onload="window.onafterprint = () => window.close(); window.print();">
        ${htmlContent}
      </body></html>
    `);
    win.document.close();

    // 2. Send to GAS in the background
    setLoading(true);
    callGAS('addFreePass', freePassData)
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setQuantity(1);
        if (passTypes.length > 0) {
          setSelectedPassType(passTypes[0]);
          setCustomPassType(passTypes[0]);
        } else {
          setSelectedPassType('');
          setCustomPassType('');
        }
      });
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Free Pass</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-grow">
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider block">Quantity</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleDecrement}
              className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all border border-slate-200 text-2xl font-bold active:scale-95"
            >
              −
            </button>
            <div className="flex-grow">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onBlur={() => !quantity && setQuantity(1)}
                required
                min="1"
                placeholder="0"
                className="w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border transition-all text-center text-xl font-bold"
              />
            </div>
            <button
              type="button"
              onClick={handleIncrement}
              className="w-12 h-12 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all border border-blue-100 text-2xl font-bold active:scale-95"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider block">Pass Type</label>
          <div className="grid grid-cols-2 gap-3">
            {passTypes.map((type) => {
              const isSelected = selectedPassType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedPassType(type);
                    setCustomPassType(type);
                  }}
                  className={`py-3 px-4 rounded-xl font-bold transition-all text-center text-sm border active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
          <div className="mt-2">
            <input
              type="text"
              value={customPassType}
              onChange={(e) => {
                const val = e.target.value;
                setCustomPassType(val);
                const match = passTypes.find(t => t.toLowerCase() === val.toLowerCase().trim());
                if (match) {
                  setSelectedPassType(match);
                } else {
                  setSelectedPassType('');
                }
              }}
              placeholder="Or type custom pass type..."
              className="w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border transition-all text-slate-800 font-semibold text-sm bg-white"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Total Amount</label>
          <div className="w-full rounded-xl border-slate-100 bg-slate-50 p-4 border font-mono font-bold text-2xl text-indigo-700 flex justify-between items-center">
            <span className="text-slate-400 text-sm font-normal">Amount to Pay:</span>
            <span className="uppercase text-indigo-600 text-lg tracking-wider font-bold">Free</span>
          </div>
        </div>

        <div className="pt-4 mt-auto">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 disabled:bg-indigo-300 transition-all flex items-center justify-center gap-2 text-lg cursor-pointer"
          >
            {loading ? 'Saving...' : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Free Pass
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FreePassForm;

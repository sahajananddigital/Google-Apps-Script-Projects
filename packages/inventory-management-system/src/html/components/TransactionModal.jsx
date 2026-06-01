import React, { useState } from 'react';

export const TransactionModal = ({ item, isOpen, onClose, onSave }) => {
  const [type, setType] = useState('IN');
  const [quantity, setQuantity] = useState(1);
  const [receiver, setReceiver] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const transaction = {
      itemId: item.id,
      type: type,
      quantity: Number(quantity),
      receiver: receiver,
      remarks: remarks
    };

    if (typeof google !== 'undefined') {
      google.script.run
        .withSuccessHandler(() => {
          setSubmitting(false);
          setReceiver('');
          setRemarks('');
          onSave();
          onClose();
        })
        .withFailureHandler((err) => {
          alert('Error: ' + err);
          setSubmitting(false);
        })
        .recordTransaction(transaction);
    } else {
      setTimeout(() => {
        setSubmitting(false);
        onSave();
        onClose();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">Record Transaction (લેવડ-દેવડ)</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center pb-2 border-b border-slate-100">
            <p className="text-sm text-slate-500 uppercase font-bold tracking-wider">વસ્તુનું નામ</p>
            <p className="text-xl font-bold text-slate-800">{item.name}</p>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setType('IN')}
              className={`flex-1 py-2 rounded-md font-bold transition-all ${type === 'IN' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              STOCK IN (+)
            </button>
            <button
              type="button"
              onClick={() => setType('OUT')}
              className={`flex-1 py-2 rounded-md font-bold transition-all ${type === 'OUT' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              STOCK OUT (-)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">જથ્થો (Quantity)</label>
              <input
                type="number"
                min="1"
                required
                className="input-field"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            {type === 'OUT' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">લેનાર વ્યક્તિ</label>
                <input
                  type="text"
                  placeholder="નામ"
                  className="input-field"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">રીમાર્કસ (Remarks)</label>
            <textarea
              className="input-field min-h-[80px]"
              placeholder="વિગત લખો..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-md font-bold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting} 
              className={`flex-1 btn-primary ${type === 'OUT' ? 'bg-red-600 hover:bg-red-700' : ''}`}
            >
              {submitting ? 'Recording...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

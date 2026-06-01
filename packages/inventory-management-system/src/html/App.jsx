import React, { useState, useEffect } from 'react';
import { InventoryForm } from './components/InventoryForm';
import { InventoryTable } from './components/InventoryTable';
import { TransactionModal } from './components/TransactionModal';
import { EditModal } from './components/EditModal';
import { ReportPage } from './components/ReportPage';
import './styles/app.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [settings, setSettings] = useState({
    title: 'શ્રી સ્વામિનારાયણ ગુરુકુલ નિકોલ',
    subtitle: 'Sahitya Store Inventory Management System',
    categoryList: ['Books', 'Clothes', 'Food', 'General']
  });
  const [formData, setFormData] = useState({
    name: '',
    category: 'Books',
    gurukul_stock: 0,
    store_stock: 0,
    buy_price: 0,
    sell_price: 0,
    unit: 'pcs'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAppSettings();
    loadInventory();
  }, []);

  const loadAppSettings = () => {
    if (typeof google !== 'undefined') {
      google.script.run
        .withSuccessHandler((data) => {
          if (data) {
            setSettings(data);
            setFormData(prev => ({ ...prev, category: data.categoryList[0] }));
          }
        })
        .getAppSettings();
    }
  };

  const loadInventory = () => {
    setLoading(true);
    if (typeof google !== 'undefined') {
      google.script.run
        .withSuccessHandler((data) => {
          console.log('Inventory data received:', data);
          setInventory(data);
          setLoading(false);
        })
        .withFailureHandler((err) => {
          alert('Failed to load inventory: ' + err);
          setLoading(false);
        })
        .getInventory();
    } else {
      setTimeout(() => {
        setInventory([
          { id: '1', name: 'Gita Press Bhagavad Gita', category: 'Books', gurukul_stock: 10, store_stock: 2, buy_price: 120, sell_price: 150, unit: 'pcs' },
          { id: '2', name: 'Cotton Dhoti', category: 'Clothes', gurukul_stock: 5, store_stock: 0, buy_price: 400, sell_price: 450, unit: 'pcs' }
        ]);
        setLoading(false);
      }, 1000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (typeof google !== 'undefined') {
      google.script.run
        .withSuccessHandler(() => {
          setSubmitting(false);
          setFormData({ 
            name: '', 
            category: settings.categoryList[0], 
            gurukul_stock: 0, 
            store_stock: 0, 
            buy_price: 0, 
            sell_price: 0, 
            unit: 'pcs' 
          });
          loadInventory();
        })
        .withFailureHandler((err) => {
          alert('Error adding item: ' + err);
          setSubmitting(false);
        })
        .addItem(formData);
    } else {
      setTimeout(() => {
        setInventory([...inventory, { ...formData, id: Date.now().toString() }]);
        setSubmitting(false);
        setFormData({ 
          name: '', 
          category: settings.categoryList[0], 
          gurukul_stock: 0, 
          store_stock: 0, 
          buy_price: 0, 
          sell_price: 0, 
          unit: 'pcs' 
        });
      }, 500);
    }
  };

  const handleOpenTransaction = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 bg-white p-6 rounded-xl shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {settings.title}
            </h1>
            <p className="mt-1 text-lg text-slate-500">
              {settings.subtitle}
            </p>
          </div>
          <nav className="flex bg-slate-100 p-1 rounded-lg h-fit">
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${activeTab === 'inventory' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Inventory
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${activeTab === 'reports' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Today's Report
            </button>
          </nav>
        </header>

        <main className="grid grid-cols-1 gap-8 animate-in fade-in duration-500">
          {activeTab === 'inventory' ? (
            <>
              <section className="card">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Stock Item (નવી વસ્તુ ઉમેરો)
                </h2>
                <InventoryForm 
                  formData={formData} 
                  setFormData={setFormData} 
                  onSubmit={handleSubmit} 
                  submitting={submitting} 
                  categories={settings.categoryList}
                />
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Current Inventory Levels
                  </h2>
                  <button 
                    onClick={loadInventory}
                    className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-1">
                  <InventoryTable 
                    inventory={inventory} 
                    loading={loading} 
                    onRecord={handleOpenTransaction}
                    onEdit={handleOpenEdit}
                  />
                </div>
              </section>
            </>
          ) : (
            <ReportPage />
          )}
        </main>

        <footer className="text-center pt-8 border-t border-slate-200 text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} Shri Swaminarayan Gurukul Nikol. Managed via Google Apps Script.
        </footer>
      </div>

      <TransactionModal 
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={loadInventory}
      />

      <EditModal
        item={selectedItem}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={loadInventory}
        categories={settings.categoryList}
      />
    </div>
  );
};

export default App;

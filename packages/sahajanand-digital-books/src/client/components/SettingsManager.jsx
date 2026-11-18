import { useState } from 'react';
import { callGAS } from '../GAS';

const SettingsManager = ({ settings = {}, onSettingsSaved, onOpenCustomizer }) => {
  const [formData, setFormData] = useState({
    organizationType: settings.organizationType || 'business', // 'business' | 'institute'
    companyName: settings.companyName || '',
    fullname: settings.fullname || '',
    address: settings.address || '',
    phone: settings.phone || '',
    email: settings.email || '',
    website: settings.website || '',
    pan: settings.pan || '',
    udyam: settings.udyam || '',
    gstin: settings.gstin || '',
    gstDeclaration: settings.gstDeclaration || 'We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.',
    brandColor: settings.brandColor || '#112B42',
    logoUrl: settings.logoUrl || '',
    // Primary Bank
    primaryBankName: settings.primaryBankName || '',
    primaryBankBranch: settings.primaryBankBranch || '',
    primaryAccountType: settings.primaryAccountType || 'Current',
    primaryAccountNo: settings.primaryAccountNo || '',
    primaryIfsc: settings.primaryIfsc || '',
    primaryUpiId: settings.primaryUpiId || '',
    // Secondary Bank
    secondaryBankName: settings.secondaryBankName || '',
    secondaryBankBranch: settings.secondaryBankBranch || '',
    secondaryAccountType: settings.secondaryAccountType || 'Savings',
    secondaryAccountNo: settings.secondaryAccountNo || '',
    secondaryIfsc: settings.secondaryIfsc || '',
    secondaryUpiId: settings.secondaryUpiId || '',
    defaultPrintTemplate: settings.defaultPrintTemplate || 'IndianStyleTally',
  });
  const [loading, setLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOrgTypeSwitch = (type) => {
    setFormData((prev) => {
      const isInst = type === 'institute';
      return {
        ...prev,
        organizationType: type,
        gstDeclaration: isInst
          ? 'We acknowledge receipt of fees / donation towards educational and institutional purposes with gratitude.'
          : 'We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.',
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSavedMessage('');
    try {
      const res = await callGAS('saveAppSettings', formData);
      if (res.success) {
        setSavedMessage('✓ Settings successfully saved to Google Sheets');
        if (onSettingsSaved) onSettingsSaved(formData);
      } else {
        alert(res.message || 'Error saving settings');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Business & Bank Settings</h2>
          <p className="text-xs text-slate-500 mt-1">Configure company identity, tax details, organization mode, and banking</p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCustomizer && (
            <button
              type="button"
              onClick={onOpenCustomizer}
              className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 border border-blue-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Customize Invoice Template
            </button>
          )}

          {savedMessage && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              {savedMessage}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* 0. Organization Mode Preset Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Organization Type & Reusability Preset
            </h3>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              {formData.organizationType === 'institute' ? 'Institute / Gurukul Mode' : 'Commercial Business Mode'}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Select your operational model. This automatically adapts labels across the application (e.g. Invoices vs Fee Receipts, Customers vs Students/Donors, Services vs Fee Heads).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => handleOrgTypeSwitch('business')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.organizationType === 'business'
                  ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">💼</span>
                <h4 className="font-bold text-slate-900 text-xs">Commercial Business / Agency</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tailored for IT agencies, consulting firms, service providers, and traders. Terms: Tax Invoices, Customers, Service Catalog, Sales Income.
              </p>
            </div>

            <div
              onClick={() => handleOrgTypeSwitch('institute')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.organizationType === 'institute'
                  ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🏛️</span>
                <h4 className="font-bold text-slate-900 text-xs">Educational Institute / Gurukul / Trust</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tailored for schools, gurukuls, research academies, and non-profits. Terms: Fee Receipts, Students / Donors, Fee Heads, Receipt Vouchers.
              </p>
            </div>
          </div>
        </div>

        {/* 1. Company Profile Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            1. Organization Profile & Identity
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">
                {formData.organizationType === 'institute' ? 'Institute / Trust Name *' : 'Business / Company Name *'}
              </label>
              <input
                type="text"
                name="companyName"
                placeholder={formData.organizationType === 'institute' ? 'e.g. Shree Gurukul Vidhyalaya' : 'e.g. Acme Digital Solutions'}
                value={formData.companyName}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">
                {formData.organizationType === 'institute' ? 'Principal / Trustee / Contact' : 'Owner / Contact Name'}
              </label>
              <input
                type="text"
                name="fullname"
                placeholder="e.g. Authorized Signatory / Administrator"
                value={formData.fullname}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Official Phone</label>
              <input
                type="text"
                name="phone"
                placeholder="+91..."
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Official Email</label>
              <input
                type="email"
                name="email"
                placeholder="contact@yourdomain.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Website URL</label>
              <input
                type="url"
                name="website"
                placeholder="https://..."
                value={formData.website}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Logo Image URL</label>
              <input
                type="url"
                name="logoUrl"
                placeholder="https://example.com/logo.png"
                value={formData.logoUrl}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-600 uppercase">Address / Campus Location</label>
            <textarea
              name="address"
              rows="2"
              placeholder="Suite / Campus, Street, City, State, Pincode"
              value={formData.address}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
            ></textarea>
          </div>
        </div>

        {/* 2. Tax & Legal Information */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            2. Tax Registration & Legal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">GSTIN / Tax ID</label>
              <input
                type="text"
                name="gstin"
                placeholder="e.g. 24AAAAA0000A1Z5 or URP"
                value={formData.gstin}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono uppercase focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Reg / Trust / UDYAM No</label>
              <input
                type="text"
                name="udyam"
                placeholder="e.g. TRUST-REG-XXXX or UDYAM-XX"
                value={formData.udyam}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono uppercase focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">PAN Number</label>
              <input
                type="text"
                name="pan"
                placeholder="e.g. ABCDE1234F"
                value={formData.pan}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono uppercase focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-600 uppercase">Receipt / Invoice Legal Declaration</label>
            <textarea
              name="gstDeclaration"
              rows="2"
              placeholder="Legal declaration printed at bottom of invoices/receipts"
              value={formData.gstDeclaration}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
            ></textarea>
          </div>
        </div>

        {/* 3. Primary Bank Account */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Primary Bank Account (Default for Payments & UPI QR)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
              Primary
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Bank Name</label>
              <input
                type="text"
                name="primaryBankName"
                placeholder="e.g. State Bank of India / HDFC Bank"
                value={formData.primaryBankName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Branch Name</label>
              <input
                type="text"
                name="primaryBankBranch"
                placeholder="e.g. Main Branch"
                value={formData.primaryBankBranch}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Account Type</label>
              <select
                name="primaryAccountType"
                value={formData.primaryAccountType}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-blue-500"
              >
                <option value="Current">Current Account</option>
                <option value="Savings">Savings Account</option>
                <option value="Trust / Institutional">Trust / Institutional Account</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Account Number</label>
              <input
                type="text"
                name="primaryAccountNo"
                placeholder="e.g. 123456789012"
                value={formData.primaryAccountNo}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono font-bold focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">IFSC Code</label>
              <input
                type="text"
                name="primaryIfsc"
                placeholder="e.g. SBIN0001234"
                value={formData.primaryIfsc}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono uppercase font-bold focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">UPI VPA / QR ID</label>
              <input
                type="text"
                name="primaryUpiId"
                placeholder="e.g. institute@sbi or user@upi"
                value={formData.primaryUpiId}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono font-bold text-blue-600 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 4. Secondary Bank Account */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              4. Secondary Bank Account (Optional)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              Secondary
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Secondary Bank Name</label>
              <input
                type="text"
                name="secondaryBankName"
                placeholder="e.g. Federal Bank / Axis Bank"
                value={formData.secondaryBankName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Branch Name</label>
              <input
                type="text"
                name="secondaryBankBranch"
                placeholder="Branch"
                value={formData.secondaryBankBranch}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Account Type</label>
              <select
                name="secondaryAccountType"
                value={formData.secondaryAccountType}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-blue-500"
              >
                <option value="Savings">Savings Account</option>
                <option value="Current">Current Account</option>
                <option value="Trust / Institutional">Trust / Institutional Account</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Account Number</label>
              <input
                type="text"
                name="secondaryAccountNo"
                placeholder="Account number"
                value={formData.secondaryAccountNo}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono font-bold focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">IFSC Code</label>
              <input
                type="text"
                name="secondaryIfsc"
                placeholder="IFSC Code"
                value={formData.secondaryIfsc}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono uppercase font-bold focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">UPI VPA</label>
              <input
                type="text"
                name="secondaryUpiId"
                placeholder="secondary@bank"
                value={formData.secondaryUpiId}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono font-bold text-blue-600 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-100 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving Settings...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsManager;

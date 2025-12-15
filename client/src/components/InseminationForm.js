import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const InseminationForm = ({ cow, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    insemination_date: new Date().toISOString().split('T')[0],
    semen_type: '',
    semen_batch: '',
    technician_name: '',
    cost: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error('सेमेन रिकॉर्ड जोड़ने में त्रुटि:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-secondary-700 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-secondary-700">
          <h3 className="text-white m-0 text-lg font-semibold">
            {cow?.name} को सेमेन दें - {cow?.listing_id}
          </h3>
          <button onClick={onClose} className="bg-secondary-600 hover:bg-secondary-500 text-white text-xl cursor-pointer p-2 w-10 h-10 flex items-center justify-center rounded-lg">×</button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white mb-2">सेमेन देने की तारीख *</label>
              <input
                type="date"
                value={formData.insemination_date}
                onChange={(e) => setFormData({...formData, insemination_date: e.target.value})}
                className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">सेमेन का प्रकार *</label>
              <select
                value={formData.semen_type}
                onChange={(e) => setFormData({...formData, semen_type: e.target.value})}
                className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white"
                required
              >
                <option value="">सेमेन प्रकार चुनें</option>
                <option value="sexed">सेक्स्ड सेमेन</option>
                <option value="conventional">कन्वेंशनल सेमेन</option>
                <option value="imported">इंपोर्टेड सेमेन</option>
                <option value="local">लोकल सेमेन</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white mb-2">सेमेन बैच नंबर</label>
              <input
                type="text"
                value={formData.semen_batch}
                onChange={(e) => setFormData({...formData, semen_batch: e.target.value})}
                placeholder="बैच नंबर दर्ज करें"
                className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-white mb-2">तकनीशियन का नाम</label>
              <input
                type="text"
                value={formData.technician_name}
                onChange={(e) => setFormData({...formData, technician_name: e.target.value})}
                placeholder="तकनीशियन का नाम"
                className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-white mb-2">लागत (₹)</label>
            <input
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({...formData, cost: e.target.value})}
              placeholder="सेमेन की लागत"
              className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-white mb-2">नोट्स</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
              placeholder="कोई अतिरिक्त जानकारी"
              className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-secondary-600 text-white rounded-lg">
              रद्द करें
            </button>
            <button type="submit" className="px-6 py-2 bg-accent-blue text-white rounded-lg">
              सेमेन रिकॉर्ड जोड़ें
            </button>
          </div>
        </form>
       </div>
      </div>
    </div>
  );
};

export default InseminationForm;
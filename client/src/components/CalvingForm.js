import React, { useState } from 'react';

const CalvingForm = ({ cow, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    calving_date: new Date().toISOString().split('T')[0],
    calf_gender: '',
    calf_name: '',
    calf_status: 'alive',
    calf_weight: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error('बच्चा देने का रिकॉर्ड जोड़ने में त्रुटि:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-secondary-700 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-secondary-700">
          <h3 className="text-white m-0 text-lg font-semibold">
            {cow?.name} ने बच्चा दिया - {cow?.listing_id}
          </h3>
          <button onClick={onClose} className="bg-secondary-600 hover:bg-secondary-500 text-white text-xl cursor-pointer p-2 w-10 h-10 flex items-center justify-center rounded-lg">×</button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white mb-2">बच्चा देने की तारीख *</label>
              <input
                type="date"
                value={formData.calving_date}
                onChange={(e) => setFormData({...formData, calving_date: e.target.value})}
                className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">बच्चे का लिंग *</label>
              <select
                value={formData.calf_gender}
                onChange={(e) => setFormData({...formData, calf_gender: e.target.value})}
                className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white"
                required
              >
                <option value="">लिंग चुनें</option>
                <option value="male">नर (Male)</option>
                <option value="female">मादा (Female)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white mb-2">बच्चे का नाम</label>
              <input
                type="text"
                value={formData.calf_name}
                onChange={(e) => setFormData({...formData, calf_name: e.target.value})}
                placeholder="बच्चे का नाम"
                className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-white mb-2">बच्चे की स्थिति</label>
              <select
                value={formData.calf_status}
                onChange={(e) => setFormData({...formData, calf_status: e.target.value})}
                className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white"
              >
                <option value="alive">जीवित (Alive)</option>
                <option value="dead">मृत (Dead)</option>
                <option value="sold">बिक गया (Sold)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-white mb-2">बच्चे का वजन (KG)</label>
            <input
              type="number"
              step="0.1"
              value={formData.calf_weight}
              onChange={(e) => setFormData({...formData, calf_weight: e.target.value})}
              placeholder="वजन किलोग्राम में"
              className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-white mb-2">नोट्स</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
              placeholder="बच्चा देने के बारे में अतिरिक्त जानकारी"
              className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-secondary-600 text-white rounded-lg">
              रद्द करें
            </button>
            <button type="submit" className="px-6 py-2 bg-accent-green text-white rounded-lg">
              बच्चा रिकॉर्ड जोड़ें
            </button>
          </div>
        </form>
       </div>
      </div>
    </div>
  );
};

export default CalvingForm;
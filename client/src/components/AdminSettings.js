import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaUser, FaImage, FaPlus, FaTrash } from 'react-icons/fa';

const AdminSettings = () => {
  const [adminSettings, setAdminSettings] = useState({
    address: '',
    mobile: '',
    email: '',
    whatsapp: ''
  });
  const [farmImages, setFarmImages] = useState([]);
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [imageForm, setImageForm] = useState({
    title: '',
    description: '',
    image: null
  });

  useEffect(() => {
    fetchAdminSettings();
    fetchFarmImages();
  }, []);

  const fetchAdminSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('http://localhost:5000/api/admin/settings', config);
      setAdminSettings(response.data);
    } catch (err) {
      console.log('Failed to fetch admin settings');
    }
  };

  const fetchFarmImages = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/farm-images');
      setFarmImages(response.data);
    } catch (err) {
      console.log('Failed to fetch farm images');
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put('http://localhost:5000/api/admin/settings', adminSettings, config);
      Swal.fire('Success', 'Settings updated successfully!', 'success');
      setShowSettingsForm(false);
      fetchAdminSettings(); // Refresh the displayed settings
    } catch (err) {
      console.error('Settings update error:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update settings';
      Swal.fire('Error', errorMessage, 'error');
    }
  };

  const handleImageSubmit = async (e) => {
    e.preventDefault();
    if (!imageForm.image) {
      Swal.fire('Error', 'Please select an image', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', imageForm.image);
    formData.append('title', imageForm.title);
    formData.append('description', imageForm.description);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      await axios.post('http://localhost:5000/api/admin/farm-images', formData, config);
      Swal.fire('Success', 'Image uploaded successfully!', 'success');
      setImageForm({ title: '', description: '', image: null });
      fetchFarmImages();
    } catch (err) {
      Swal.fire('Error', 'Failed to upload image', 'error');
    }
  };

  const handleImageDelete = async (imageId) => {
    const result = await Swal.fire({
      title: 'Delete Image?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        await axios.delete(`http://localhost:5000/api/admin/farm-images/${imageId}`, config);
        Swal.fire('Success', 'Image deleted successfully!', 'success');
        fetchFarmImages();
      } catch (err) {
        Swal.fire('Error', 'Failed to delete image', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-primary-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-primary-700 rounded-lg p-6 mb-6 border border-secondary-700">
          <h2 className="bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent mb-1 text-3xl">Admin Settings</h2>
          <p className="text-secondary-300 mb-0 text-base">Manage your personal information and farm images</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-primary-700 rounded-lg p-6 border border-secondary-700">
            <div className="flex items-center justify-between mb-5">
              <h3 className="bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent mb-0 flex items-center gap-3">
                <FaUser className="text-accent-blue text-xl" />
                Personal Information
              </h3>
              <button
                onClick={() => setShowSettingsForm(true)}
                className="bg-accent-blue text-white border-none px-4 py-2 rounded cursor-pointer flex items-center gap-2 text-sm hover:bg-accent-blue-dark"
              >
                <FaPlus /> Update Info
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-secondary-300 mb-2 text-sm">Address</label>
                <p className="text-white font-medium">{adminSettings.address || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-secondary-300 mb-2 text-sm">Mobile</label>
                <p className="text-white font-medium">{adminSettings.mobile || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-secondary-300 mb-2 text-sm">WhatsApp</label>
                <p className="text-white font-medium">{adminSettings.whatsapp || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-secondary-300 mb-2 text-sm">Email</label>
                <p className="text-white font-medium">{adminSettings.email || 'Not set'}</p>
              </div>
            </div>
          </div>

          {/* Farm Images */}
          <div className="bg-primary-700 rounded-lg p-6 border border-secondary-700">
            <div className="flex items-center justify-between mb-5">
              <h3 className="bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent mb-0 flex items-center gap-3">
                <FaImage className="text-accent-blue text-xl" />
                Farm Images
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {farmImages.slice(0, 4).map((image, index) => (
                  <div key={image._id} className="relative">
                    <img
                      src={`http://localhost:5000${image.url}`}
                      alt={image.title || `Farm ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-secondary-600"
                    />
                    <button
                      onClick={() => handleImageDelete(image._id)}
                      className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-secondary-400 text-sm">
                {farmImages.length} image{farmImages.length !== 1 ? 's' : ''} uploaded
              </p>
            </div>
          </div>
        </div>

        {/* Upload New Image Section */}
        <div className="bg-primary-700 rounded-lg p-6 mt-6 border border-secondary-700">
          <h3 className="bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent mb-4 flex items-center gap-3">
            <FaPlus className="text-accent-blue text-xl" />
            Upload New Farm Image
          </h3>

          <form onSubmit={handleImageSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2 text-sm font-medium">Image Title *</label>
                <input
                  type="text"
                  value={imageForm.title}
                  onChange={(e) => setImageForm({...imageForm, title: e.target.value})}
                  className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                  placeholder="e.g., Healthy Cows"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2 text-sm font-medium">Description *</label>
                <input
                  type="text"
                  value={imageForm.description}
                  onChange={(e) => setImageForm({...imageForm, description: e.target.value})}
                  className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                  placeholder="e.g., Our prized dairy herd"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white mb-2 text-sm font-medium">Select Image *</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageForm({...imageForm, image: e.target.files[0]})}
                className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                required
              />
              <small className="text-secondary-400 text-xs mt-1 block">Supported formats: JPG, PNG, GIF. Max size: 5MB</small>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-gradient-to-r from-accent-blue to-accent-blue-dark hover:from-accent-blue-dark hover:to-accent-blue text-white font-semibold rounded-xl border border-accent-blue px-6 py-3 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Upload Image
              </button>
            </div>
          </form>
        </div>

        {/* Settings Form Modal */}
        {showSettingsForm && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-primary-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-secondary-700 shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-secondary-700">
                <h3 className="text-white m-0 text-lg font-semibold">Update Personal Information</h3>
                <button
                  onClick={() => setShowSettingsForm(false)}
                  className="bg-secondary-600 hover:bg-secondary-500 text-white text-xl cursor-pointer p-2 w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200"
                >
                  ×
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
                <form onSubmit={handleSettingsSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white mb-2 text-sm font-medium">Address</label>
                      <textarea
                        value={adminSettings.address}
                        onChange={(e) => setAdminSettings({...adminSettings, address: e.target.value})}
                        rows="3"
                        className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200 resize-vertical"
                        placeholder="Enter your address"
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-2 text-sm font-medium">Mobile</label>
                      <input
                        type="tel"
                        value={adminSettings.mobile}
                        onChange={(e) => setAdminSettings({...adminSettings, mobile: e.target.value})}
                        className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-2 text-sm font-medium">WhatsApp</label>
                      <input
                        type="tel"
                        value={adminSettings.whatsapp}
                        onChange={(e) => setAdminSettings({...adminSettings, whatsapp: e.target.value})}
                        className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                        placeholder="Enter WhatsApp number"
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-2 text-sm font-medium">Email</label>
                      <input
                        type="email"
                        value={adminSettings.email}
                        onChange={(e) => setAdminSettings({...adminSettings, email: e.target.value})}
                        className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 sm:justify-end pt-6 border-t border-secondary-700">
                    <button
                      type="button"
                      onClick={() => setShowSettingsForm(false)}
                      className="w-full sm:w-48 h-12 bg-secondary-600 hover:bg-secondary-500 text-white font-semibold rounded-xl border border-secondary-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-48 h-12 bg-gradient-to-r from-accent-blue to-accent-blue-dark hover:from-accent-blue-dark hover:to-accent-blue text-white font-semibold rounded-xl border border-accent-blue transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      Save Settings
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
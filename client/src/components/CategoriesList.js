import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

const CategoriesList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    display_order: 0,
    is_active: true
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories');
      setCategories(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch categories');
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({...formData, image: reader.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, display_order: parseInt(formData.display_order) };

      if (editingCategory) {
        await axios.put(`http://localhost:5000/api/categories/${editingCategory._id}`, data);
      } else {
        await axios.post('http://localhost:5000/api/categories', data);
      }

      fetchCategories();
      resetForm();
    } catch (err) {
      setError(editingCategory ? 'Failed to update category' : 'Failed to create category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      display_order: category.display_order?.toString() || '0',
      is_active: category.is_active
    });
    setImagePreview(category.image || '');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/categories/${id}`);
        fetchCategories();
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Category has been deleted.',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        setError('Failed to delete category');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete category'
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
      display_order: 0,
      is_active: true
    });
    setEditingCategory(null);
    setShowForm(false);
    setSelectedFile(null);
    setImagePreview('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) return <div className="text-center p-10 text-sm sm:text-base md:text-lg text-gray-500">Loading categories...</div>;

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-5">
        <h2 className="m-0 text-gray-800 text-xl sm:text-2xl md:text-3xl">Category Management</h2>
      </div>

      {error && <div className="bg-red-500 text-white p-2.5 rounded mb-5">{error}</div>}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto border border-gray-200">
            <h3 className="mt-0 mb-5 text-gray-800 text-lg sm:text-xl md:text-2xl">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-[15px]">
                <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Name:</label>
                <input
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="mb-[15px]">
                <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Description:</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="mb-[15px]">
                <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Category Image:</label>
                <input
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-200"
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {imagePreview && (
                  <div className="mt-3 text-center">
                    <img className="rounded-lg shadow-md border border-gray-200 max-w-[200px] max-h-[200px] object-cover" src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="mb-[15px]">
                <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Display Order:</label>
                <input
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({...formData, display_order: e.target.value})}
                  min="0"
                />
              </div>

              <div className="mb-[15px] flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Active</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button className="flex-1 h-12 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2" type="submit">
                  <FaCheck className="text-sm" />
                  {editingCategory ? 'Update' : 'Create'}
                </button>
                <button className="flex-1 h-12 px-6 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2" type="button" onClick={resetForm}>
                  <FaTimes className="text-sm" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {categories.map(category => (
          <div key={category._id} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-0.5">
            <div className="h-50 bg-gray-100 flex items-center justify-center overflow-hidden">
              {category.image ? (
                <img className="w-full h-full object-cover" src={category.image} alt={category.name} />
              ) : (
                <div className="text-gray-500 text-base">No Image</div>
              )}
            </div>
            <div className="p-[15px]">
              <h3 className="m-0 mb-2 text-gray-800 text-base sm:text-lg md:text-xl">{category.name}</h3>
              <p className="m-0 mb-2.5 text-gray-500 text-xs sm:text-sm">{category.description}</p>
              <div className="flex justify-between items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs sm:text-sm text-gray-500">Order: {category.display_order}</span>
              </div>
            </div>
            <div className="p-[15px] bg-gray-50 flex gap-2.5">
              <button onClick={() => handleEdit(category)} className="flex-1 p-1.5 px-3 border-none rounded cursor-pointer text-xs transition-colors duration-300 bg-yellow-500 text-white hover:bg-yellow-600 flex items-center justify-center gap-1">
                <FaEdit className="text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm">Edit</span>
              </button>
              <button onClick={() => handleDelete(category._id)} className="flex-1 p-1.5 px-3 border-none rounded cursor-pointer text-xs transition-colors duration-300 bg-red-500 text-white hover:bg-red-600 flex items-center justify-center gap-1">
                <FaTrash className="text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        className="fixed bottom-5 right-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-none p-4 rounded-full cursor-pointer text-lg transition-all duration-300 hover:from-blue-600 hover:to-cyan-600 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl z-50"
        onClick={() => setShowForm(true)}
        disabled={showForm}
        title="Add New Category"
      >
        <FaPlus />
      </button>
    </div>
  );
};

export default CategoriesList;
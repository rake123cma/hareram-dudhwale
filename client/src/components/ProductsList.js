import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'liters',
    default_price: '',
    description: '',
    images: [],
    stock_quantity: '',
    min_stock_level: '',
    is_active: true,
    is_advance_bookable: false,
    is_special_product: false,
    advance_booking_available_from: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      setProducts(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch products');
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('http://localhost:5000/api/categories', config);
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const data = {
        ...formData,
        default_price: parseFloat(formData.default_price),
        // Only include stock data for non-special products
        ...(formData.is_special_product ? {} : {
          stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : 0,
          min_stock_level: formData.min_stock_level ? parseInt(formData.min_stock_level) : 0
        }),
        // Include availability date for advance bookable products
        ...(formData.is_advance_bookable && formData.advance_booking_available_from ? {
          advance_booking_available_from: new Date(formData.advance_booking_available_from)
        } : {})
      };

      if (editingProduct) {
        await axios.put(`http://localhost:5000/api/products/${editingProduct._id}`, data, config);
      } else {
        await axios.post('http://localhost:5000/api/products', data, config);
      }

      fetchProducts();
      resetForm();
    } catch (err) {
      setError(editingProduct ? 'Failed to update product' : 'Failed to create product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      unit: product.unit,
      default_price: product.default_price.toString(),
      description: product.description || '',
      images: product.images || [],
      stock_quantity: (product.is_special_product ? '' : product.stock_quantity?.toString()) || '',
      min_stock_level: (product.is_special_product ? '' : product.min_stock_level?.toString()) || '',
      is_active: product.is_active,
      is_advance_bookable: product.is_advance_bookable || false,
      is_special_product: product.is_special_product || false,
      advance_booking_available_from: product.advance_booking_available_from ? new Date(product.advance_booking_available_from).toISOString().split('T')[0] : ''
    });
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
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(`http://localhost:5000/api/products/${id}`, config);
        fetchProducts();
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Product has been deleted.',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        setError('Failed to delete product');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete product'
        });
      }
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.images.length > 5) {
      Swal.fire({
        icon: 'warning',
        title: 'Too many images',
        text: 'Maximum 5 images allowed. You can upload ' + (5 - formData.images.length) + ' more images.',
        timer: 3000,
        showConfirmButton: false
      });
      return;
    }

    const newImages = [];
    let processedCount = 0;

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages[index] = reader.result;
        processedCount++;

        if (processedCount === files.length) {
          setFormData({...formData, images: [...formData.images, ...newImages]});
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({...formData, images: newImages});
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      unit: 'liters',
      default_price: '',
      description: '',
      images: [],
      stock_quantity: '',
      min_stock_level: '',
      is_active: true,
      is_advance_bookable: false,
      is_special_product: false,
      advance_booking_available_from: ''
    });
    setEditingProduct(null);
    setShowForm(false);
    setError('');
  };

  if (loading) return <div className="text-center p-10 text-sm sm:text-base md:text-lg text-gray-500">Loading products...</div>;

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-5">
        <h2 className="m-0 text-gray-800 text-xl sm:text-2xl md:text-3xl">Products & Inventory Management</h2>
      </div>

      {error && <div className="bg-red-500 text-white p-2.5 rounded mb-5">{error}</div>}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto border border-gray-200">
            <h3 className="mt-0 mb-5 text-gray-800 text-lg sm:text-xl md:text-2xl">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
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
                <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Category:</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category.name.toLowerCase()}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-[15px]">
                <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Unit:</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                >
                  <option value="liters">Liters</option>
                  <option value="kg">Kg</option>
                  <option value="pieces">Pieces</option>
                  <option value="dozen">Dozen</option>
                </select>
              </div>

              <div className="mb-[15px]">
                <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Default Price (₹):</label>
                <input
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  type="number"
                  step="0.01"
                  value={formData.default_price}
                  onChange={(e) => setFormData({...formData, default_price: e.target.value})}
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
                <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Product Images (Max 5):</label>
                <input
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-200"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <small className="block mt-[5px] text-xs text-gray-500">
                  You can upload up to 5 images. {formData.images.length}/5 images selected.
                </small>
                {formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-[10px] mt-[10px]">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img className="w-20 h-20 object-cover rounded border border-gray-300" src={image} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-[5px] -right-[5px] bg-red-500 text-white border-none rounded-full w-5 h-5 cursor-pointer text-sm flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!formData.is_special_product && (
                <>
                  <div className="mb-[15px]">
                    <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Stock Quantity:</label>
                    <input
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                      placeholder="Current stock level"
                    />
                  </div>

                  <div className="mb-[15px]">
                    <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Minimum Stock Level:</label>
                    <input
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      type="number"
                      value={formData.min_stock_level}
                      onChange={(e) => setFormData({...formData, min_stock_level: e.target.value})}
                      placeholder="Alert when stock goes below this level"
                    />
                  </div>
                </>
              )}

              {formData.is_special_product && (
                <div className="mb-[15px] p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-purple-800 text-sm m-0">
                    <strong>Note:</strong> Special products don't require stock management as they are advance bookable services.
                  </p>
                </div>
              )}

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

              <div className="mb-[15px] flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    type="checkbox"
                    checked={formData.is_special_product}
                    onChange={(e) => {
                      const isSpecial = e.target.checked;
                      setFormData({
                        ...formData,
                        is_special_product: isSpecial,
                        // Clear stock fields for special products
                        ...(isSpecial && {
                          stock_quantity: '',
                          min_stock_level: ''
                        })
                      });
                    }}
                  />
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Special Product</span>
                </label>
              </div>

              <div className="mb-[15px] flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    type="checkbox"
                    checked={formData.is_advance_bookable}
                    onChange={(e) => setFormData({...formData, is_advance_bookable: e.target.checked})}
                  />
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Advance Bookable</span>
                </label>
              </div>

              {formData.is_advance_bookable && (
                <div className="mb-[15px]">
                  <label className="block mb-2 font-medium text-gray-700 text-sm sm:text-base">Available for Advance Booking From *</label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    type="date"
                    value={formData.advance_booking_available_from}
                    onChange={(e) => setFormData({...formData, advance_booking_available_from: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required={formData.is_advance_bookable}
                  />
                  <small className="block mt-1 text-xs text-gray-500">
                    Date from which customers can start booking this product in advance
                  </small>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button className="flex-1 h-12 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2" type="submit">
                  <FaCheck className="text-sm" />
                  {editingProduct ? 'Update' : 'Create'}
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

      <div className="bg-white rounded-lg shadow-md overflow-x-auto border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Name</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Category</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Unit</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Price (₹)</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Stock/Status</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Special</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Advance Book</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Status</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={product._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base">{product.name}</td>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base">{product.category}</td>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base">{product.unit}</td>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base">₹{product.default_price}</td>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base">
                  {product.is_special_product ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Advance Bookable
                    </span>
                  ) : (
                    <span>{product.stock_quantity || 0}</span>
                  )}
                </td>
                <td className="p-3 text-left border-b border-gray-200">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.is_special_product ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                    {product.is_special_product ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="p-3 text-left border-b border-gray-200">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.is_advance_bookable ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {product.is_advance_bookable ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="p-3 text-left border-b border-gray-200">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3 text-left border-b border-gray-200">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(product)} className="p-1.5 px-3 border-none rounded cursor-pointer text-xs transition-colors duration-300 bg-yellow-500 text-white hover:bg-yellow-600 flex items-center gap-1">
                      <FaEdit className="text-xs" />
                      <span className="text-xs sm:text-sm">Edit</span>
                    </button>
                    <button onClick={() => handleDelete(product._id)} className="p-1.5 px-3 border-none rounded cursor-pointer text-xs transition-colors duration-300 bg-red-500 text-white hover:bg-red-600 flex items-center gap-1">
                      <FaTrash className="text-xs" />
                      <span className="text-xs sm:text-sm">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        className="fixed bottom-5 right-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-none p-4 rounded-full cursor-pointer text-lg transition-all duration-300 hover:from-blue-600 hover:to-cyan-600 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl z-50"
        onClick={() => setShowForm(true)}
        disabled={showForm}
        title="Add New Product"
      >
        <FaPlus />
      </button>
    </div>
  );
};

export default ProductsList;
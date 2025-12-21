import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GiMilkCarton, GiCow, GiThreeFriends, GiShield, GiClockwork, GiPriceTag, GiStarMedal } from 'react-icons/gi';
import { MdLocalShipping, MdPayment, MdSupport, MdVerified } from 'react-icons/md';
import { FaWhatsapp, FaPhone, FaMapMarkerAlt, FaShoppingCart } from 'react-icons/fa';

const Home = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showProducts, setShowProducts] = useState(false);
  const [isProductsView, setIsProductsView] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'otp'
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [registerData, setRegisterData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    pincode: '',
    billing_type: 'subscription',
    subscription_amount: '',
    price_per_liter: ''
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [farmImages, setFarmImages] = useState([]);
  const [adminSettings, setAdminSettings] = useState({
    address: '',
    mobile: '',
    email: '',
    whatsapp: ''
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (err) {
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      const activeProducts = response.data.filter(product => product.is_active);
      setProducts(activeProducts);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get('/api/reviews/approved');
      setReviews(response.data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setReviews([]);
    }
  };

  const fetchFarmImages = async () => {
    try {
      const response = await axios.get('/api/admin/farm-images');
      setFarmImages(response.data);
    } catch (err) {
      console.error('Failed to fetch farm images:', err);
      setFarmImages([]);
    }
  };

  const fetchAdminSettings = async () => {
    try {
      const response = await axios.get('/api/admin/settings');
      setAdminSettings(response.data);
    } catch (err) {
      console.error('Failed to fetch admin settings:', err);
      // Keep default empty values if fetch fails
    }
  };

  const selectCategory = (category) => {
    setSelectedCategory(category);
    const filtered = products.filter(product =>
      product.category.toLowerCase() === category.name.toLowerCase()
    );
    setFilteredProducts(filtered);
    setShowProducts(true);

    // Smooth scroll to products section
    setTimeout(() => {
      document.getElementById('home-products')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const showAllProducts = () => {
    setSelectedCategory(null);
    setFilteredProducts(products);
    setShowProducts(true);

    setTimeout(() => {
      document.getElementById('home-products')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      // For now, use existing login endpoint with dummy password
      const res = await axios.post('/api/auth/login', {
        username: mobile,
        password: 'customer123' // dummy password for testing
      });
      localStorage.setItem('token', res.data.token);
      setShowAuthModal(false);
      resetAuthForm();
      if (res.data.user.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/customer';
      }
    } catch (err) {
      alert('Login failed. Please check your mobile number or contact admin.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      // For now, skip OTP verification and use existing login
      const res = await axios.post('/api/auth/login', {
        username: mobile,
        password: 'customer123' // dummy password for testing
      });
      localStorage.setItem('token', res.data.token);
      setShowAuthModal(false);
      resetAuthForm();
      window.location.href = '/customer';
    } catch (err) {
      alert('Login failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const data = {
        ...registerData,
        phone: mobile,
        subscription_amount: registerData.subscription_amount ? parseFloat(registerData.subscription_amount) : undefined,
        price_per_liter: registerData.price_per_liter ? parseFloat(registerData.price_per_liter) : undefined
      };
      await axios.post('/api/auth/register', data);
      alert('Registration successful! OTP sent to your mobile number.');
      setAuthMode('otp');
    } catch (err) {
      alert('Registration failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const resetAuthForm = () => {
    setMobile('');
    setOtp('');
    setAuthMode('login');
    setRegisterData({
      name: '',
      phone: '',
      email: '',
      address: '',
      pincode: '',
      billing_type: 'subscription',
      subscription_amount: '',
      price_per_liter: ''
    });
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchReviews();
    fetchFarmImages();
    fetchAdminSettings();

    // Enhanced smooth scrolling for better browser support
    const smoothScroll = (target, duration = 800) => {
      const targetElement = document.querySelector(target);
      if (!targetElement) return;

      const targetPosition = targetElement.offsetTop - 70; // Account for fixed navbar
      const startPosition = window.pageYOffset;
      const distance = targetPosition - startPosition;
      let startTime = null;

      const animation = (currentTime) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
      };

      const ease = (t, b, c, d) => {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
      };

      requestAnimationFrame(animation);
    };

    // Add click handlers for navigation links
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href');
        smoothScroll(target);
      });
    });

    // Ensure smooth scrolling is enabled
    document.documentElement.style.scrollBehavior = 'smooth';
    document.body.style.scrollBehavior = 'smooth';

    // Cleanup
    return () => {
      navLinks.forEach(link => {
        link.removeEventListener('click', smoothScroll);
      });
    };
  }, []);

  return (
    <div className="home">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-gray-800 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h2 className="text-white text-xl font-bold">Hareram DudhWale</h2>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" onClick={(e) => {e.preventDefault(); setIsProductsView(false); window.scrollTo({top: 0, behavior: 'smooth'});}} className="text-gray-300 hover:text-blue-400 transition-colors duration-300 font-medium">Home</a>
              <a href="#categories" onClick={(e) => {e.preventDefault(); setIsProductsView(true); window.scrollTo({top: 0, behavior: 'smooth'});}} className="text-gray-300 hover:text-blue-400 transition-colors duration-300 font-medium">Our Products</a>
              <a href="#about" onClick={(e) => {e.preventDefault(); document.getElementById('about')?.scrollIntoView({behavior: 'smooth'});}} className="text-gray-300 hover:text-blue-400 transition-colors duration-300 font-medium">About</a>
              <a href="#pricing" onClick={(e) => {e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({behavior: 'smooth'});}} className="text-gray-300 hover:text-blue-400 transition-colors duration-300 font-medium">Pricing</a>
              <a href="#contact" onClick={(e) => {e.preventDefault(); document.getElementById('contact')?.scrollIntoView({behavior: 'smooth'});}} className="text-gray-300 hover:text-blue-400 transition-colors duration-300 font-medium">Contact</a>
              <button onClick={() => navigate('/login')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300 font-medium">Login</button>
            </div>
            <div className="md:hidden">
              <button onClick={toggleMobileMenu} className="text-white hover:text-blue-400 transition-colors duration-300">
                <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                  <span className={`block w-5 h-0.5 bg-current transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                  <span className={`block w-5 h-0.5 bg-current transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`block w-5 h-0.5 bg-current transition-transform duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className={`md:hidden bg-black/95 backdrop-blur-xl border-t border-gray-800 transition-all duration-300 ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="px-4 py-6 space-y-4">
            <button className="absolute top-4 right-4 text-white hover:text-blue-400 transition-colors duration-300 text-2xl" onClick={() => setIsMobileMenuOpen(false)}>×</button>
            <a href="#home" onClick={(e) => {e.preventDefault(); setIsProductsView(false); setIsMobileMenuOpen(false); window.scrollTo({top: 0, behavior: 'smooth'});}} className="block text-gray-300 hover:text-blue-400 transition-colors duration-300 font-medium py-2">Home</a>
            <a href="#categories" onClick={(e) => {e.preventDefault(); setIsProductsView(true); setIsMobileMenuOpen(false); window.scrollTo({top: 0, behavior: 'smooth'});}} className="block text-gray-300 hover:text-blue-400 transition-colors duration-300 font-medium py-2">Our Products</a>
            <a href="#about" onClick={(e) => {e.preventDefault(); document.getElementById('about')?.scrollIntoView({behavior: 'smooth'}); setIsMobileMenuOpen(false);}} className="block text-gray-300 hover:text-blue-400 transition-colors duration-300 font-medium py-2">About</a>
            <a href="#pricing" onClick={(e) => {e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({behavior: 'smooth'}); setIsMobileMenuOpen(false);}} className="block text-gray-300 hover:text-blue-400 transition-colors duration-300 font-medium py-2">Pricing</a>
            <a href="#contact" onClick={(e) => {e.preventDefault(); document.getElementById('contact')?.scrollIntoView({behavior: 'smooth'}); setIsMobileMenuOpen(false);}} className="block text-gray-300 hover:text-blue-400 transition-colors duration-300 font-medium py-2">Contact</a>
            <button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300 font-medium">Login</button>
          </div>
        </div>
      </nav>

      {isProductsView ? (
        <>
          {/* Categories Section */}
          <section id="home-categories" className="py-24 bg-gray-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Our Product Categories
              </h2>
              <p className="text-xl text-gray-300 text-center mb-16 max-w-2xl mx-auto">
                Choose a category to explore our fresh dairy products
              </p>

              {categories.length === 0 ? (
                <div className="text-center py-16">
                  <GiMilkCarton className="text-6xl text-gray-600 mx-auto mb-4 animate-pulse" />
                  <p className="text-xl text-gray-400">Loading categories...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {categories.map(category => {
                    const categoryProducts = products.filter(product =>
                      product.category.toLowerCase() === category.name.toLowerCase()
                    );
                    return (
                      <div
                        key={category._id}
                        className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-2xl hover:shadow-green-500/25 hover:border-green-500/50 transition-all duration-500 hover:-translate-y-2 group cursor-pointer"
                        onClick={() => selectCategory(category)}
                      >
                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <GiMilkCarton className="text-3xl text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4 text-center group-hover:text-green-300 transition-colors">{category.name}</h3>
                        <p className="text-gray-300 text-center mb-6 leading-relaxed">{category.description || 'Fresh dairy products'}</p>
                        <div className="text-center">
                          <span className="inline-block bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                            {categoryProducts.length} products
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div
                    className="bg-gradient-to-br from-purple-100 via-pink-50 to-purple-200 p-8 rounded-2xl shadow-2xl border-4 border-purple-400 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-105 transition-all duration-500 cursor-pointer relative overflow-hidden"
                    onClick={showAllProducts}
                  >
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg border-2 border-white">
                      View All
                    </div>
                    <div className="relative z-10 pt-6">
                      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <GiMilkCarton className="text-3xl text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-black mb-4 text-center">All Products</h3>
                      <p className="text-gray-700 text-center mb-6 leading-relaxed">View all our dairy products</p>
                      <div className="text-center">
                        <span className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                          {products.length} products
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Products Display Section */}
          {showProducts && (
            <section id="home-products" className="py-24 bg-gray-900 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {selectedCategory ? `${selectedCategory.name} Products` : 'All Products'}
                </h2>
                <p className="text-xl text-gray-300 text-center mb-16 max-w-2xl mx-auto">
                  {selectedCategory ? `Fresh ${selectedCategory.name.toLowerCase()} from our farm` : 'All our fresh dairy products'}
                </p>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <GiMilkCarton className="text-6xl text-gray-600 mx-auto mb-4" />
                    <p className="text-xl text-gray-400">No products available in this category.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProducts.map(product => (
                      <div key={product._id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-2xl hover:shadow-blue-500/25 hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-2 group overflow-hidden">
                        <div className="aspect-square overflow-hidden relative">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex flex-col items-center justify-center">
                              <GiMilkCarton className="text-4xl text-gray-400 mb-2" />
                              <span className="text-gray-400 text-sm">No Image</span>
                            </div>
                          )}
                          <div className="absolute top-4 right-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              product.stock_quantity > 0
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                            }`}>
                              {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                        </div>

                        <div className="p-6">
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">{product.name}</h3>
                          <p className="text-gray-400 text-sm mb-3">{product.category}</p>
                          <p className="text-gray-300 text-sm mb-4 line-clamp-2">{product.description}</p>

                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <span className="text-2xl font-black text-blue-400">₹{product.default_price}</span>
                              <span className="text-gray-400 text-sm ml-1">per {product.unit.slice(0, -1)}</span>
                            </div>
                            <span className="text-gray-400 text-xs">{product.unit}</span>
                          </div>

                          <div className="flex gap-3">
                            <button className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-4 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105">
                              <FaShoppingCart className="text-sm" />
                              Add to Cart
                            </button>
                            <Link to="/register" className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 text-center group-hover:scale-105">
                              Order Now
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          {/* Hero Section */}
          <section id="home" className="bg-gray-900 pt-32 pb-20 min-h-screen flex items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(120,119,198,0.15),transparent_50%)]"></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,rgba(236,72,153,0.15),transparent_50%)]"></div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="text-center lg:text-left">
                  <h1 className="text-4xl font-bold mb-2.5 bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 bg-clip-text text-transparent">
                    Hareram DudhWale
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-300 mb-8 font-medium leading-relaxed">
                    Gaay aur Bhains ka Taaza & Shuddh Doodh – Ranchi mein Roz Aapke Darwaaze Par
                  </p>

                  <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-10">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg">100% Pure</span>
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg">No Mix</span>
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg">Daily Fresh Milk</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <a href={`https://wa.me/91${adminSettings.whatsapp?.replace(/\D/g, '') || adminSettings.mobile?.replace(/\D/g, '') || 'XXXXXXXXXX'}`} className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-green-500/25 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                      <FaWhatsapp /> WhatsApp Order
                    </a>
                    <Link to="/register" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-emerald-500/25 hover:scale-105 transition-all duration-300 text-center">
                      Free 2-Day Sample
                    </Link>
                    <button onClick={() => navigate('/register')} className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-purple-500/25 hover:scale-105 transition-all duration-300">
                      Order Now
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="relative z-10">
                    <img src="/images/milk-pour.png" alt="Fresh creamy milk pouring with dramatic splash and droplets" className="w-full h-auto rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="absolute -top-4 -left-4 w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl -z-10"></div>
                  <div className="absolute -bottom-4 -right-4 w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl -z-10"></div>
                </div>
              </div>
            </div>
          </section>

      {/* Live Stats */}
      <section className="bg-gray-900 py-24 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.1),transparent_50%)]"></div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Live Statistics
          </h2>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-purple-500/25 hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-20 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <GiMilkCarton className="text-3xl text-white" />
              </div>
              <h3 className="text-5xl font-bold text-blue-400 mb-3 text-center group-hover:text-blue-300 transition-colors">50–55</h3>
              <p className="text-gray-300 text-lg text-center font-medium">Liters Today</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-green-500/25 hover:border-green-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-20 h-16 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <GiCow className="text-3xl text-white" />
              </div>
              <h3 className="text-5xl font-bold text-green-400 mb-3 text-center group-hover:text-green-300 transition-colors">9</h3>
              <p className="text-gray-300 text-lg text-center font-medium">Healthy Cows</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-yellow-500/25 hover:border-yellow-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-20 h-16 mx-auto mb-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <GiThreeFriends className="text-3xl text-white" />
              </div>
              <h3 className="text-5xl font-bold text-yellow-400 mb-3 text-center group-hover:text-yellow-300 transition-colors">60+</h3>
              <p className="text-gray-300 text-lg text-center font-medium">Daily Customers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Why Choose Hareram DudhWale?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-blue-500/25 hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <GiMilkCarton className="text-3xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 text-center group-hover:text-blue-300 transition-colors">100% शुद्ध दूध</h3>
              <p className="text-gray-300 text-center leading-relaxed">हमारे दूध में कोई मिलावट नहीं, सिर्फ शुद्ध गाय और भैंस का दूध</p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-green-500/25 hover:border-green-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <GiCow className="text-3xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 text-center group-hover:text-green-300 transition-colors">Apni 9 Gaayen</h3>
              <p className="text-gray-300 text-center leading-relaxed">हमारी अपनी 9 स्वस्थ गायें जो रोजाना ताजा दूध देती हैं</p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-purple-500/25 hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <MdLocalShipping className="text-3xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 text-center group-hover:text-purple-300 transition-colors">सुबह का ताजा दूध</h3>
              <p className="text-gray-300 text-center leading-relaxed">प्रत्येक सुबह निकाला गया दूध, शाम तक आपके घर पहुंचता है</p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-red-500/25 hover:border-red-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <GiShield className="text-3xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 text-center group-hover:text-red-300 transition-colors">No Chemicals</h3>
              <p className="text-gray-300 text-center leading-relaxed">कोई पानी, पाउडर या रसायन नहीं मिलाया जाता</p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-yellow-500/25 hover:border-yellow-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <GiClockwork className="text-3xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 text-center group-hover:text-yellow-300 transition-colors">Timely Delivery</h3>
              <p className="text-gray-300 text-center leading-relaxed">सही समय पर घर पहुंचाने की गारंटी</p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-cyan-500/25 hover:border-cyan-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <GiPriceTag className="text-3xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 text-center group-hover:text-cyan-300 transition-colors">Transparent Pricing</h3>
              <p className="text-gray-300 text-center leading-relaxed">स्पष्ट मूल्य निर्धारण, कोई छिपी हुई फीस</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Milk Pricing & Plans
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 text-center hover:shadow-blue-500/25 hover:border-blue-500/50 transition-all duration-500">
              <h3 className="text-2xl font-bold text-white mb-6">Cow Milk</h3>
              <div className="text-6xl font-black text-blue-400 mb-2">₹60<span className="text-lg font-normal text-gray-400">/Liter</span></div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-purple-200 p-8 rounded-2xl shadow-2xl border-4 border-purple-400 text-center hover:shadow-purple-500/30 hover:scale-105 transition-all duration-500 relative overflow-hidden">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg border-2 border-white">Most Popular</div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-black mb-6">Buffalo Milk</h3>
                <div className="text-6xl font-black text-black mb-2 drop-shadow-lg">₹65<span className="text-lg font-normal text-gray-700">/Liter</span></div>
                <div className="w-16 h-1 bg-purple-400 mx-auto rounded-full mt-4"></div>
              </div>
            </div>
          </div>

          <h3 className="text-3xl font-bold text-center mb-12 text-white">Monthly Subscription Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 text-center hover:shadow-blue-500/25 hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-2">
              <h4 className="text-xl font-bold text-white mb-4">Starter Pack</h4>
              <div className="text-4xl font-black text-blue-400 mb-2">₹1,800<span className="text-sm font-normal text-gray-400">/month</span></div>
              <p className="text-gray-300 mb-6">30 Liters Cow Milk</p>
              <Link to="/register" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors duration-300">Choose Plan</Link>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 rounded-2xl shadow-2xl border-4 border-green-400 text-center hover:shadow-green-500/25 hover:scale-105 transition-all duration-500 relative">
              <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">Save ₹300</span>
              <h4 className="text-xl font-bold text-white mb-4">Family Pack</h4>
              <div className="text-4xl font-black text-white mb-2">₹3,600<span className="text-sm font-normal text-green-100">/month</span></div>
              <p className="text-green-100 mb-6">60 Liters Buffalo Milk</p>
              <Link to="/register" className="inline-block bg-white text-green-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors duration-300">Choose Plan</Link>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 text-center hover:shadow-purple-500/25 hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-2">
              <h4 className="text-xl font-bold text-white mb-4">Custom Plan</h4>
              <div className="text-4xl font-black text-purple-400 mb-2">Custom</div>
              <p className="text-gray-300 mb-6">Choose your quantity & type</p>
              <Link to="/register" className="inline-block border-2 border-purple-500 text-purple-400 px-6 py-3 rounded-xl font-bold hover:bg-purple-500 hover:text-white transition-all duration-300">Contact Us</Link>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-12 rounded-3xl text-center shadow-2xl">
            <h3 className="text-3xl font-bold text-white mb-4">Try Before You Buy!</h3>
            <p className="text-purple-100 mb-8 text-lg">Get 2 days free sample delivery</p>
            <Link to="/register" className="inline-block bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors duration-300">Request Free Sample</Link>
          </div>
        </div>
      </section>


      {/* Testimonials */}
      <section className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            What Our Customers Say
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl text-gray-600 mb-4">⭐</div>
              <p className="text-xl text-gray-400">Loading customer reviews...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviews.map((review, index) => (
                <div key={review._id} className={`bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-yellow-500/25 hover:border-yellow-500/50 transition-all duration-500 hover:-translate-y-2 ${index === 2 ? 'md:col-span-2 lg:col-span-1' : ''}`}>
                  <div className="text-yellow-400 text-2xl mb-4 text-center">
                    {'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                  <p className="text-gray-300 mb-6 leading-relaxed italic">"{review.review_text}"</p>
                  <div className="text-center">
                    <strong className="text-white text-lg block">{review.customer_name}</strong>
                    {review.location && <span className="text-gray-400 text-sm">{review.location}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/register" className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-yellow-500/25 hover:scale-105 transition-all duration-300">
              Share Your Experience
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 bg-clip-text text-transparent">
            Our Dairy Farm
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {farmImages.length > 0 ? (
              farmImages.map((image, index) => (
                <div key={image._id} className="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-green-500/25 transition-all duration-500 hover:-translate-y-2">
                  <div className="aspect-square overflow-hidden">
                    <img src={image.url.startsWith('/uploads') ? `${image.url}` : image.url} alt={image.title || `Farm Image ${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-lg font-bold">{image.title || `Farm Image ${index + 1}`}</h3>
                    <p className="text-sm">{image.description || 'Our dairy farm'}</p>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-green-500/25 transition-all duration-500 hover:-translate-y-2">
                  <div className="aspect-square overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=400" alt="Healthy cows" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-lg font-bold">Healthy Cows</h3>
                    <p className="text-sm">Our prized dairy herd</p>
                  </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 hover:-translate-y-2">
                  <div className="aspect-square overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" alt="Milk extraction" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-lg font-bold">Milk Extraction</h3>
                    <p className="text-sm">Hygienic milking process</p>
                  </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:-translate-y-2">
                  <div className="aspect-square overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400" alt="Fresh milk" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-lg font-bold">Fresh Milk</h3>
                    <p className="text-sm">Straight from the farm</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Why Trust Hareram DudhWale?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-2xl hover:shadow-indigo-500/25 hover:border-indigo-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <GiStarMedal className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-indigo-300 transition-colors">Daily Milk Tracking</h3>
              <p className="text-gray-300 leading-relaxed">Track your daily milk consumption and delivery schedule with our advanced tracking system</p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-2xl hover:shadow-green-500/25 hover:border-green-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <MdLocalShipping className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-green-300 transition-colors">On-Time Delivery</h3>
              <p className="text-gray-300 leading-relaxed">Reliable delivery at your preferred time slot with real-time tracking updates</p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-2xl hover:shadow-green-500/25 hover:border-green-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FaWhatsapp className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-green-300 transition-colors">WhatsApp Billing</h3>
              <p className="text-gray-300 leading-relaxed">Get instant bills and important updates directly on WhatsApp for convenience</p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-2xl hover:shadow-blue-500/25 hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <MdPayment className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">Monthly Invoice</h3>
              <p className="text-gray-300 leading-relaxed">Detailed monthly statements for your records with complete transaction history</p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-2xl hover:shadow-purple-500/25 hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <MdSupport className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">Multiple Payment Options</h3>
              <p className="text-gray-300 leading-relaxed">COD, Online payment, and monthly billing available for your convenience</p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-2xl hover:shadow-red-500/25 hover:border-red-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <MdVerified className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-red-300 transition-colors">Quality Guarantee</h3>
              <p className="text-gray-300 leading-relaxed">100% satisfaction guarantee or your money back - quality you can trust</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quality Assurance */}
      <section className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
            Quality Assurance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-2xl hover:shadow-emerald-500/25 hover:border-emerald-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <GiMilkCarton className="text-3xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">Pure Cow Milk</h3>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">Direct from our farm to your home with no intermediaries</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-2xl hover:shadow-blue-500/25 hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <MdLocalShipping className="text-3xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors">Farm to Home</h3>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">No middlemen, direct delivery ensuring freshness and quality</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-2xl hover:shadow-yellow-500/25 hover:border-yellow-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <GiClockwork className="text-3xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white group-hover:text-yellow-300 transition-colors">Freshly Extracted Daily</h3>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">Morning extraction, evening delivery for maximum freshness</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-2xl hover:shadow-red-500/25 hover:border-red-500/50 transition-all duration-500 hover:-translate-y-2 group">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <GiShield className="text-3xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white group-hover:text-red-300 transition-colors">No Mixing, No Adulteration</h3>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">100% pure, guaranteed with no artificial additives</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                About Hareram DudhWale
              </h2>
              <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                <p>
                  हरराम दूधवाले की स्थापना 2020 में हुई थी। हम रांची, झारखंड में ग्राहकों को
                  शुद्ध, ताजा और पौष्टिक गाय और भैंस का दूध उपलब्ध कराते हैं। हमारे पास अपनी
                  9 स्वस्थ गायें हैं जो रोजाना उच्च गुणवत्ता वाला दूध उत्पादित करती हैं।
                </p>
                <p className="text-xl font-semibold text-white border-l-4 border-purple-500 pl-4">
                  हमारा मिशन: <span className="text-purple-400">शुद्ध दूध, भरोसा और पारदर्शिता</span>
                </p>
                <p>
                  हम मानते हैं कि अच्छा स्वास्थ्य अच्छे भोजन से शुरू होता है, और अच्छा भोजन
                  शुद्ध दूध से शुरू होता है। हम रांची के लोगों को सर्वोत्तम गुणवत्ता वाला दूध
                  उपलब्ध कराने के लिए प्रतिबद्ध हैं।
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                <img src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=500" alt="Hareram Dudhwale" className="w-full h-auto rounded-3xl shadow-2xl hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="absolute -top-6 -left-6 w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-3xl -z-10"></div>
              <div className="absolute -bottom-6 -right-6 w-full h-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-3xl -z-10"></div>
              <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm rounded-full p-4">
                <GiMilkCarton className="text-3xl text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Contact Us
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-2xl hover:shadow-blue-500/25 hover:border-blue-500/50 transition-all duration-500">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FaPhone className="text-white text-lg" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">Phone</h4>
                    <p className="text-gray-300 text-lg">{adminSettings.mobile || '+91 XXXXX XXXXX'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-2xl hover:shadow-green-500/25 hover:border-green-500/50 transition-all duration-500">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FaMapMarkerAlt className="text-white text-lg" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">Address</h4>
                    <p className="text-gray-300 mb-1">{adminSettings.address || 'Saket Vihar Dela Toli Khatal'}</p>
                    <p className="text-gray-300">Harmu, Ranchi, Jharkhand (834002)</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-2xl hover:shadow-purple-500/25 hover:border-purple-500/50 transition-all duration-500">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <MdLocalShipping className="text-white text-lg" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">Delivery Area</h4>
                    <p className="text-gray-300 mb-1">Ranchi, Jharkhand</p>
                    <p className="text-gray-300 text-sm">Morning: 6:00 AM - 10:00 AM</p>
                    <p className="text-gray-300 text-sm">Evening: 4:00 PM - 8:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <a href={`https://wa.me/91${adminSettings.whatsapp?.replace(/\D/g, '') || adminSettings.mobile?.replace(/\D/g, '') || 'XXXXXXXXXX'}`} className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-xl hover:shadow-green-500/25 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3">
                <FaWhatsapp className="text-xl" />
                <span>WhatsApp Order</span>
              </a>

              <a href={`tel:+91${adminSettings.mobile?.replace(/\D/g, '') || 'XXXXXXXXXX'}`} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-xl hover:shadow-blue-500/25 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3">
                <FaPhone className="text-xl" />
                <span>Call Now</span>
              </a>

              <Link to="/register" className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-xl hover:shadow-purple-500/25 hover:scale-105 transition-all duration-300 flex items-center justify-center">
                Register for Delivery
              </Link>
            </div>
          </div>
        </div>
      </section>

          {/* Footer */}
          <footer className="bg-gray-900 text-white py-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black opacity-50"></div>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 bg-clip-text text-transparent mb-4">Hareram DudhWale</h3>
                  <p className="text-gray-300 mb-2">Gaay aur Bhains ka Taaza & Shuddh Doodh</p>
                  <p className="text-gray-400">Ranchi, Jharkhand</p>
                </div>
                <div className="text-center md:text-left">
                  <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                  <div className="space-y-2">
                    <a href="#home" className="block text-gray-300 hover:text-blue-400 transition-colors duration-300">Home</a>
                    <Link to="/products" className="block text-gray-300 hover:text-blue-400 transition-colors duration-300">Our Products</Link>
                    <a href="#about" className="block text-gray-300 hover:text-blue-400 transition-colors duration-300">About</a>
                    <a href="#pricing" className="block text-gray-300 hover:text-blue-400 transition-colors duration-300">Pricing</a>
                    <a href="#contact" className="block text-gray-300 hover:text-blue-400 transition-colors duration-300">Contact</a>
                    <a href="/privacy-policy.html" className="block text-gray-300 hover:text-blue-400 transition-colors duration-300">Privacy Policy</a>
                    <a href="/terms-of-service.html" className="block text-gray-300 hover:text-blue-400 transition-colors duration-300">Terms of Service</a>
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
                  <div className="space-y-3">
                    <a href={`https://wa.me/91${adminSettings.whatsapp?.replace(/\D/g, '') || adminSettings.mobile?.replace(/\D/g, '') || 'XXXXXXXXXX'}`} className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-300">
                      <FaWhatsapp className="inline mr-2" /> WhatsApp
                    </a>
                    <a href={`tel:+91${adminSettings.mobile?.replace(/\D/g, '') || 'XXXXXXXXXX'}`} className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300 ml-2">
                      <FaPhone className="inline mr-2" /> Call
                    </a>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-8 text-center">
                <p className="text-gray-400">&copy; 2024 Hareram DudhWale, Ranchi. All rights reserved.</p>
              </div>
            </div>
          </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={() => setShowAuthModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">{authMode === 'register' ? 'Join Hareram DudhWale' : 'Welcome Back'}</h2>
              <button className="text-gray-400 hover:text-gray-600 text-3xl leading-none" onClick={() => { setShowAuthModal(false); resetAuthForm(); }}>×</button>
            </div>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GiMilkCarton className="text-3xl text-blue-600" />
              </div>
              <p className="text-gray-600 mb-6 text-lg">
                {authMode === 'login' ? 'Enter your mobile number to login' :
                 authMode === 'register' ? 'Create your customer account' :
                 'Enter the OTP sent to your mobile'}
              </p>

              {authMode === 'login' && (
                <form onSubmit={handleSendOTP}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg"
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="Enter registered mobile number"
                      pattern="[0-9]{10}"
                      maxLength="10"
                      required
                      disabled={authLoading}
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={authLoading}>
                    {authLoading ? 'Logging in...' : 'Login'}
                  </button>
                  <p className="text-xs text-gray-500 mt-4">* Currently using simplified login. OTP feature will be available after server restart.</p>
                </form>
              )}

              {authMode === 'otp' && (
                <form onSubmit={handleVerifyOTP} className="auth-form">
                  <div className="form-group">
                    <label>Enter OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP (use 123456 for testing)"
                      pattern="[0-9]{6}"
                      maxLength="6"
                      required
                      disabled={authLoading}
                    />
                  </div>
                  <p className="otp-info">For testing: use OTP 123456</p>
                  <button type="submit" className="auth-btn" disabled={authLoading}>
                    {authLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button type="button" onClick={() => setAuthMode('login')} className="back-btn">
                    Back
                  </button>
                </form>
              )}

              {authMode === 'register' && (
                <form onSubmit={handleRegister} className="auth-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                        placeholder="Full name"
                        required
                        disabled={authLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label>Mobile</label>
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="10-digit mobile"
                        pattern="[0-9]{10}"
                        maxLength="10"
                        required
                        disabled={authLoading}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email (Optional)</label>
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      placeholder="Email address"
                      disabled={authLoading}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Address</label>
                      <input
                        type="text"
                        value={registerData.address}
                        onChange={(e) => setRegisterData({...registerData, address: e.target.value})}
                        placeholder="Delivery address"
                        disabled={authLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label>Pincode</label>
                      <input
                        type="text"
                        value={registerData.pincode}
                        onChange={(e) => setRegisterData({...registerData, pincode: e.target.value})}
                        placeholder="Pincode"
                        disabled={authLoading}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Billing Type</label>
                      <select
                        value={registerData.billing_type}
                        onChange={(e) => setRegisterData({...registerData, billing_type: e.target.value})}
                        disabled={authLoading}
                      >
                        <option value="subscription">Monthly Subscription</option>
                        <option value="per_liter">Per Liter</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Price Per Liter (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={registerData.price_per_liter}
                        onChange={(e) => setRegisterData({...registerData, price_per_liter: e.target.value})}
                        placeholder="Price per liter"
                        disabled={authLoading}
                      />
                    </div>
                  </div>
                  {registerData.billing_type === 'subscription' && (
                    <div className="form-group">
                      <label>Subscription Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={registerData.subscription_amount}
                        onChange={(e) => setRegisterData({...registerData, subscription_amount: e.target.value})}
                        placeholder="Monthly subscription amount"
                        disabled={authLoading}
                      />
                    </div>
                  )}
                  <button type="submit" className="auth-btn" disabled={authLoading}>
                    {authLoading ? 'Creating Account...' : 'Create Account & Send OTP'}
                  </button>
                </form>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-gray-600">
                  {authMode === 'login' ? "New customer? " : "Already have an account? "}
                  <button
                    type="button"
                    className="text-blue-600 font-medium hover:text-blue-800 underline"
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      resetAuthForm();
                    }}
                  >
                    {authMode === 'login' ? 'Register here' : 'Login here'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default Home;

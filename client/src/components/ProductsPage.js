import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GiMilkCarton } from 'react-icons/gi';
import { FaShoppingCart } from 'react-icons/fa';

const ProductsPage = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('categories'); // 'categories' or 'products'
  const [loadingProducts, setLoadingProducts] = useState(true);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    fetchProducts();

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

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      // Filter only active products
      const activeProducts = response.data.filter(product => product.is_active);
      setProducts(activeProducts);
      setFilteredProducts(activeProducts);
      setLoadingProducts(false);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setLoadingProducts(false);
    }
  };

  const selectCategory = (category) => {
    setSelectedCategory(category);
    setViewMode('products');
    const filtered = products.filter(product => product.category.toLowerCase() === category.name.toLowerCase());
    setFilteredProducts(filtered);
  };

  const goBackToCategories = () => {
    setViewMode('categories');
    setSelectedCategory(null);
    setFilteredProducts(products);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-primary-600 shadow-lg z-50">
        <div className="w-full px-5 flex justify-between items-center h-16">
          <div className="nav-logo">
            <Link to="/" className="no-underline text-inherit">
              <h2 className="text-white m-0 text-xl font-bold">Hareram DudhWale</h2>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="no-underline text-white font-medium transition-colors duration-300 cursor-pointer hover:text-accent-blue">Home</Link>
            <Link to="/products" className="no-underline text-white font-medium transition-colors duration-300 cursor-pointer hover:text-accent-blue">Our Products</Link>
            <a href="#about" onClick={(e) => {e.preventDefault(); document.getElementById('about')?.scrollIntoView({behavior: 'smooth'});}} className="no-underline text-white font-medium transition-colors duration-300 cursor-pointer hover:text-accent-blue">About</a>
            <a href="#pricing" onClick={(e) => {e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({behavior: 'smooth'});}} className="no-underline text-white font-medium transition-colors duration-300 cursor-pointer hover:text-accent-blue">Pricing</a>
            <a href="#contact" onClick={(e) => {e.preventDefault(); document.getElementById('contact')?.scrollIntoView({behavior: 'smooth'});}} className="no-underline text-white font-medium transition-colors duration-300 cursor-pointer hover:text-accent-blue">Contact</a>
            <Link to="/login" className="bg-accent-blue text-white px-5 py-2 rounded-full font-semibold transition-colors duration-300 hover:bg-accent-blue-dark">Login</Link>
          </div>
          <div className="md:hidden flex flex-col cursor-pointer" onClick={toggleMobileMenu}>
            <span className="w-6 h-0.5 bg-white my-0.5 transition-all duration-300"></span>
            <span className="w-6 h-0.5 bg-white my-0.5 transition-all duration-300"></span>
            <span className="w-6 h-0.5 bg-white my-0.5 transition-all duration-300"></span>
          </div>
        </div>
        <div className={`md:hidden fixed top-16 left-0 w-full bg-white flex-col p-5 shadow-lg transition-all duration-300 ${isMobileMenuOpen ? 'translate-y-0 opacity-100 visible' : '-translate-y-full opacity-0 invisible'}`}>
          <button className="absolute top-2.5 right-5 bg-none border-none text-2xl cursor-pointer text-white" onClick={() => setIsMobileMenuOpen(false)}>×</button>
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-primary-600">Home</Link>
          <Link to="/products" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-primary-600">Our Products</Link>
          <a href="#about" onClick={(e) => {e.preventDefault(); document.getElementById('about')?.scrollIntoView({behavior: 'smooth'}); setIsMobileMenuOpen(false);}} className="block py-2 text-primary-600">About</a>
          <a href="#pricing" onClick={(e) => {e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({behavior: 'smooth'}); setIsMobileMenuOpen(false);}} className="block py-2 text-primary-600">Pricing</a>
          <a href="#contact" onClick={(e) => {e.preventDefault(); document.getElementById('contact')?.scrollIntoView({behavior: 'smooth'}); setIsMobileMenuOpen(false);}} className="block py-2 text-primary-600">Contact</a>
          <Link to="/login" className="block py-2 bg-accent-blue text-white px-5 py-2 rounded-full font-semibold text-center mt-4" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
        </div>
      </nav>

      {/* Products Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-secondary-50 to-secondary-100 flex-1">
        <div className="w-full px-5">
          {viewMode === 'categories' ? (
            <>
              <h2 className="text-center text-primary-600 mb-2.5 text-4xl">Our Product Categories</h2>
              <p className="text-center text-secondary-400 text-lg mb-8 max-w-xl mx-auto">Choose a category to explore our fresh dairy products</p>

              {categories.length === 0 ? (
                <div className="text-center py-16 text-secondary-400">
                  <p className="text-lg m-0">No categories available at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
                  {categories.map(category => {
                    const categoryProducts = products.filter(product =>
                      product.category.toLowerCase() === category.name.toLowerCase()
                    );
                    return (
                      <div
                        key={category._id}
                        className="bg-white rounded-xl shadow-lg p-8 text-center cursor-pointer transition-all duration-300 border border-secondary-200 hover:-translate-y-1 hover:shadow-xl"
                        onClick={() => selectCategory(category)}
                      >
                        <div className="text-5xl text-accent-blue mb-4">
                          <GiMilkCarton />
                        </div>
                        <h3 className="text-xl font-semibold text-primary-600 mb-2.5">{category.name}</h3>
                        <p className="text-secondary-400 text-sm mb-4 leading-relaxed">{category.description || 'Fresh dairy products'}</p>
                        <span className="inline-block bg-accent-teal-light text-accent-teal px-3 py-1.5 rounded-full text-xs font-medium">{categoryProducts.length} products</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="products-header">
                <button className="back-btn" onClick={goBackToCategories}>
                  ← Back to Categories
                </button>
                <h2>{selectedCategory?.name} Products</h2>
                <p className="section-subtitle">Fresh {selectedCategory?.name.toLowerCase()} from our farm</p>
              </div>

              {loadingProducts ? (
                <div className="loading">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="no-products">
                  <p>No products found in {selectedCategory?.name} category.</p>
                </div>
              ) : (
                <div className="products-grid">
                  {filteredProducts.map(product => (
                <div key={product._id} className="product-card">
                  <div className="product-image">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} />
                    ) : (
                      <div className="no-image">
                        <GiMilkCarton />
                        <span>No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-category">{product.category}</p>
                    <p className="product-description">{product.description}</p>

                    <div className="product-details">
                      <span className="product-unit">{product.unit}</span>
                      <span className="product-stock">
                        {product.stock_quantity > 0 ? `In Stock (${product.stock_quantity})` : 'Out of Stock'}
                      </span>
                    </div>

                    <div className="product-price">
                      <span className="price">₹{product.default_price}</span>
                      <span className="per-unit">per {product.unit.slice(0, -1)}</span>
                    </div>

                    <div className="product-actions">
                      <button className="btn-add-cart">
                        <FaShoppingCart /> Add to Cart
                      </button>
                      <button className="btn-order" onClick={() => navigate('/register')}>
                        Order Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-600 text-white p-10 mt-auto">
        <div className="w-full px-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="footer-brand">
              <h3 className="text-accent-blue mb-2 text-xl">Hareram DudhWale</h3>
              <p className="text-primary-100 mb-1 leading-relaxed">Gaay aur Bhains ka Taaza & Shuddh Doodh</p>
              <p className="text-primary-100">Ranchi, Jharkhand</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-primary-100 no-underline hover:text-accent-blue transition-colors duration-300">Home</Link>
              <Link to="/products" className="text-primary-100 no-underline hover:text-accent-blue transition-colors duration-300">Our Products</Link>
              <a href="#about" className="text-primary-100 no-underline hover:text-accent-blue transition-colors duration-300">About</a>
              <a href="#pricing" className="text-primary-100 no-underline hover:text-accent-blue transition-colors duration-300">Pricing</a>
              <a href="#contact" className="text-primary-100 no-underline hover:text-accent-blue transition-colors duration-300">Contact</a>
            </div>
            <div className="flex gap-4">
              <a href="https://wa.me/91XXXXXXXXXX" className="text-primary-100 no-underline px-5 py-2 border border-primary-100 rounded hover:text-accent-blue hover:border-accent-blue transition-all duration-300">WhatsApp</a>
              <a href="tel:+91XXXXXXXXXX" className="text-primary-100 no-underline px-5 py-2 border border-primary-100 rounded hover:text-accent-blue hover:border-accent-blue transition-all duration-300">Call</a>
            </div>
          </div>
          <div className="border-t border-primary-500 pt-5 text-center">
            <p className="m-0 text-secondary-300 text-sm">&copy; 2024 Hareram DudhWale, Ranchi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductsPage;

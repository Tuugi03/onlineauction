import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { io } from 'socket.io-client';
import { CountdownTimer } from '../../components/Timer';
import { FaSearch,  FaTimes, FaGavel, FaInfoCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

export const Product = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidErrors, setBidErrors] = useState({}); 
  const [error, setError] = useState(null);
  const [bidAmounts, setBidAmounts] = useState({});
  const [socket, setSocket] = useState(null);
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(6);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token || localStorage.getItem('token');
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket']
    });
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/product/products'),
          axios.get('http://localhost:5000/api/category/')
        ]);
        
        setProducts(productsResponse.data);
        setCategories(categoriesResponse.data);
        
        const queryParams = new URLSearchParams(location.search);
        const searchParam = queryParams.get('search');
        const categoryParam = queryParams.get('category');
        
        if (categoryParam) {
          setSelectedCategory(categoryParam);
        }
        
        if (searchParam) {
          setSearchQuery(searchParam);
          const results = productsResponse.data.filter(product => 
            product.title.toLowerCase().includes(searchParam.toLowerCase())
          );
          setFilteredProducts(results);
        } else {
          setFilteredProducts(productsResponse.data);
        }
        
        const initialBids = {};
        productsResponse.data.forEach(product => {
          initialBids[product._id] = (product.currentBid || product.price) + 1000;
        });
        setBidAmounts(initialBids);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [location.search]); 
  
  useEffect(() => {
    if (!socket) return;

    const handleBidUpdate = async (updatedProduct) => {
      const isOutbid = await checkBidStatus(updatedProduct._id);
      
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product._id === updatedProduct._id 
            ? { ...updatedProduct, isUserOutbid: isOutbid }
            : product
        )
      );
      
      setFilteredProducts(prev => 
        prev.map(product => 
          product._id === updatedProduct._id 
            ? { ...updatedProduct, isUserOutbid: isOutbid }
            : product
        )
      );
      
      setBidAmounts(prev => ({
        ...prev,
        [updatedProduct._id]: updatedProduct.currentBid + 500
      }));
    };

    socket.on('bidUpdate', handleBidUpdate);
    socket.on('bidError', (error) => setError(error.message));

    return () => {
      socket.off('bidUpdate', handleBidUpdate);
      socket.off('bidError');
    };
  }, [socket]);

  const checkBidStatus = async (productId) => {
    const token = getAuthToken();

    try {
      const response = await axios.get(
        `http://localhost:5000/api/bidding/check-bid-status/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.isOutbid;
    } catch (error) {
      console.error('Error checking bid status:', error);
      return false;
    }
  };
  
  useEffect(() => {
    let result = [...products];
    
    if (searchQuery) {
      result = result.filter(product => 
        product.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter(product => {
        if (typeof product.category === 'object' && product.category !== null) {
          return product.category._id === selectedCategory;
        } else {
          return product.category === selectedCategory;
        }
      });
    }
    
    switch (sortOption) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'price-low':
        result.sort((a, b) => (a.currentBid || a.price) - (b.currentBid || b.price));
        break;
      case 'price-high':
        result.sort((a, b) => (b.currentBid || b.price) - (a.currentBid || a.price));
        break;
      case 'ending-soon':
        result.sort((a, b) => new Date(a.bidDeadline) - new Date(b.bidDeadline));
        break;
      default:
        break;
    }  
    
    setFilteredProducts(result);
    setCurrentPage(1);
  }, [sortOption, products, searchQuery, selectedCategory]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleBidChange = (productId, amount) => {
    const numericValue = parseFloat(amount) || 0;
    setBidAmounts(prev => ({
      ...prev,
      [productId]: numericValue
    }));
  };

  const placeBid = async (productId, currentPrice) => {
    const token = getAuthToken();
    
    if (!token) {
      navigate('/login');
      return;
    }
      
    if (bidAmounts[productId] <= currentPrice) {
      setBidErrors(prev => ({
        ...prev,
        [productId]: "Та илүү өндөр үнэ санал болгох ёстой."
      }));
      return;
    }
  
    try {
      const response = await axios.post(
        'http://localhost:5000/api/bidding/',
        {
          productId,
          price: bidAmounts[productId],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
  
      if (response.data.sold) {
        socket.emit('productSold', {
          productId,
          buyerId: response.data.buyerId,
          price: bidAmounts[productId]
        });
        alert(`Та энэ барааг ${bidAmounts[productId]}₮-р худалдан авлаа!`);
      } else {
        socket.emit('bidUpdate', response.data.product);
        alert("Амжилттай үнэ өглөө");
      }
  
      setProducts(prev =>
        prev.map(product =>
          product._id === productId
            ? { ...response.data.product, isUserOutbid: !response.data.isUserHighest }
            : product
        )
      );
  
      setFilteredProducts(prev =>
        prev.map(product =>
          product._id === productId
            ? { ...response.data.product, isUserOutbid: !response.data.isUserHighest }
            : product
        )
      );
  
      setBidAmounts(prev => ({ ...prev, [productId]: "" }));
    } catch (error) {
      console.error('Bidding error:', error);
      setBidErrors(prev => ({
        ...prev,
        [productId]: error.response?.data?.message || 'Үнийн санал өгөхөд алдаа гарлаа'
      }));
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <FaInfoCircle className="me-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-5">
      <div className="hero-section mb-5 rounded-3 p-5 text-white" 
           style={{ background: 'linear-gradient(135deg, #1971c2 0%, #0c4b8e 100%)' }}>
        <h1 className="display-5 fw-bold">Цахим Дуудлага худалдаа</h1>
        
        <div className="row justify-content-center mt-4">
          <div className="col-md-8">
            <div className="input-group shadow-lg">
              <span className="input-group-text bg-white border-0">
                <FaSearch className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-0 py-3"
                placeholder="Бараа хайх..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
             
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {showFilters && (
          <div className="col-12 d-md-none mb-4">
            <div className="card shadow-sm">
              <div className="card-header d-flex justify-content-between align-items-center bg-primary text-white">
                <h5 className="mb-0">Шүүлтүүр</h5>
                <button 
                  className="btn btn-sm btn-light" 
                  onClick={() => setShowFilters(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="card-body">
                <div className="mb-4">
                  <h6 className="mb-3">Ангилал</h6>
                  <select 
                    className="form-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">Бүх ангилал</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <h6 className="mb-3">Эрэмбэлэх</h6>
                  <select 
                    className="form-select"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <option value="newest">Шинээр нэмэгдсэн</option>
                    <option value="oldest">Хуучин</option>
                    <option value="price-low">Үнэ өсөхөөр</option>
                    <option value="price-high">Үнэ буурахаар</option>
                    <option value="ending-soon">Дуусах хугацааны дараалал</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="col-md-3 d-none d-md-block">
          <div className="card mb-4 sticky-top shadow-sm" style={{ top: '20px' }}>
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Шүүлтүүр</h5>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <h6 className="mb-3">Ангилал</h6>
                <select 
                  className="form-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Бүх ангилал</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <h6 className="mb-3">Эрэмбэлэх</h6>
                <select 
                  className="form-select"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="newest">Шинээр нэмэгдсэн</option>
                  <option value="oldest">Хуучин</option>
                  <option value="price-low">Үнэ өсөхөөр</option>
                  <option value="price-high">Үнэ буурахаар</option>
                  <option value="ending-soon">Дуусах хугацааны дараалал</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-9">
          <div className="mb-4 d-flex justify-content-between align-items-center">
            <h4 className="m-0">
              {selectedCategory !== 'all' 
                ? categories.find(c => c._id === selectedCategory)?.title || 'Бараанууд' 
                : 'Бүх бараа'}
              <span className="badge bg-primary ms-2">{filteredProducts.length}</span>
            </h4>
            
            <div className="d-flex">
              <div className="btn-group" role="group">
                <button 
                  type="button" 
                  className={`btn btn-outline-primary ${sortOption === 'newest' ? 'active' : ''}`}
                  onClick={() => setSortOption('newest')}
                >
                  Шинэ
                </button>
                <button 
                  type="button" 
                  className={`btn btn-outline-primary ${sortOption === 'price-low' ? 'active' : ''}`}
                  onClick={() => setSortOption('price-low')}
                >
                  Үнэ ↑
                </button>
                <button 
                  type="button" 
                  className={`btn btn-outline-primary ${sortOption === 'price-high' ? 'active' : ''}`}
                  onClick={() => setSortOption('price-high')}
                >
                  Үнэ ↓
                </button>
                <button 
                  type="button" 
                  className={`btn btn-outline-primary ${sortOption === 'ending-soon' ? 'active' : ''}`}
                  onClick={() => setSortOption('ending-soon')}
                >
                  Дуусах
                </button>
              </div>
            </div>
          </div>

          {currentProducts.length > 0 ? (
            <div className="row g-4">
              {currentProducts.map((product, index) => (
                <motion.div 
                  key={product._id}
                  className="col-md-6 col-lg-4"
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="card h-100 shadow-sm border-0 overflow-hidden">
                    <div className="position-relative">
                      <img 
                        src={product.images?.find(img => img.isPrimary)?.url || '/default.png'}
                        className="card-img-top" 
                        alt={product.title}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      {product.sold && (
                        <div className="position-absolute top-50 start-50 translate-middle bg-danger text-white px-3 py-1 rounded-pill">
                          Зарагдсан
                        </div>
                      )}
                    </div>
                    
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{product.title}</h5>
                      <p className="card-text text-muted text-truncate">{product.description}</p>
                      
                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <small className="text-muted">Дуусах хугацаа:</small>
                            <CountdownTimer 
                              deadline={product.bidDeadline} 
                              className="fw-bold"
                            />
                          </div>
                          <span className="badge bg-primary">
                            {typeof product.category === 'object' 
                              ? product.category.title 
                              : categories.find(c => c._id === product.category)?.title || ''}
                          </span>
                        </div>
                        
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <small className="text-muted">Одоогийн үнэ:</small>
                            <h5 className="m-0 text-primary">₮{product.currentBid || product.price}</h5>
                          </div>
                          <div className="text-end">
                          </div>
                        </div>
                        
                        {bidErrors[product._id] && (
                          <div className="alert alert-danger mt-2 mb-2 p-2 small">
                            {bidErrors[product._id]}
                          </div>
                        )}
                        
                        {!product.sold && (
                          <>
                            <div className="input-group mb-2">
                              <span className="input-group-text bg-light">₮</span>
                              <input
                                type="number"
                                className="form-control"
                                value={bidAmounts[product._id] || ''}
                                onChange={(e) => handleBidChange(product._id, e.target.value)}
                                min={(product.currentBid || product.price) + 1}
                                step="10"
                                placeholder={`${(product.currentBid || product.price) + 1000}`}
                              />
                            </div>
                            
                            <button 
                              className={`btn w-100 mb-2 ${product.isUserOutbid 
                                ? 'btn-danger' 
                                : 'btn-warning'} shadow-sm`}
                              onClick={() => placeBid(product._id, product.currentBid || product.price)}
                            >
                              <FaGavel className="me-2" />
                              {product.isUserOutbid ? 'Таны санал хүчингүй' : 'Үнийн санал өгөх'}
                            </button>
                          </>
                        )}
                        
                        <Link 
                          to={`/products/${product._id}`} 
                          className="btn btn-outline-primary w-100"
                        >
                          <FaInfoCircle className="me-2" />
                          Дэлгэрэнгүй
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-body text-center py-5">
                  <FaSearch className="display-4 text-muted mb-3" />
                  <h4>Бараа олдсонгүй</h4>
                  <p className="text-muted">Таны хайлттай тохирох бараа олдсонгүй</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                  >
                    Бүх барааг үзэх
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Pagination */}
          {filteredProducts.length > productsPerPage && (
            <div className="d-flex justify-content-center mt-5">
              <nav aria-label="Page navigation">
                <ul className="pagination shadow-sm">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &laquo;
                    </button>
                  </li>
                  
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + index;
                    } else {
                      pageNumber = currentPage - 2 + index;
                    }

                    return (
                      <li 
                        key={index} 
                        className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}
                      >
                        <button 
                          className="page-link" 
                          onClick={() => paginate(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      </li>
                    );
                  })}
                  
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Product;
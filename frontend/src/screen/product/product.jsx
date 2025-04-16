import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { io } from 'socket.io-client';

export const Product = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidAmounts, setBidAmounts] = useState({});
  const [socket, setSocket] = useState(null);
  const [sortOption, setSortOption] = useState('newest');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(6);
  const navigate = useNavigate();

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
          // axios.get('http://localhost:5000/api/category/getAllCategories')
        ]);
        
        setProducts(productsResponse.data);
        setFilteredProducts(productsResponse.data);
        // setCategories(categoriesResponse.data);
        
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

    if (socket) {
      socket.on('bidUpdate', (updatedProduct) => {
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product._id === updatedProduct._id ? updatedProduct : product
          )
        );
        
        setBidAmounts(prev => ({
          ...prev,
          [updatedProduct._id]: updatedProduct.currentBid + 500
        }));
      });

      socket.on('bidError', (error) => {
        setError(error.message);
      });
    }
  }, [socket]);

  useEffect(() => {
    let result = [...products];
    
    // if (selectedCategory !== 'all') {
    //   result = result.filter(product => product.category === selectedCategory);
    // }
    
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
        result.sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
        break;
      default:
        break;
    }
    
    setFilteredProducts(result);
    setCurrentPage(1);
  }, [sortOption,  products]);

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
    const token = localStorage.getItem('token') || 
                 JSON.parse(localStorage.getItem('user'))?.token;
    
    if (!token) {
      navigate('/login');
      return;
    }
  
    try {
      const response = await axios.post(
        'http://localhost:5000/api/bidding/',
        {
          productId,
          price: bidAmounts[productId]
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
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
        // Normal bid placement
        socket.emit('bidUpdate', response.data.product);
      }
  
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product._id === productId ? response.data.product : product
        )
      );
      
      setFilteredProducts(prev => 
        prev.map(product => 
          product._id === productId ? response.data.product : product
        )
      );
  
      setError(null);
  
    } catch (error) {
      console.error('Bidding error:', error);
      setError(error.response?.data?.message || 'Үнийн санал өгөхөд алдаа гарлаа');
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading products...</div>;
  }

  if (error) {
    return <div className="alert alert-danger mt-5">{error}</div>;
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-center">Бараанууд ({filteredProducts.length})</h2>
      
      <div className="row">
        {/* Left Sidebar - Filters */}
        <div className="col-md-3">
          <div className="card mb-4 sticky-top" style={{ top: '20px' }}>
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Шүүлтүүр</h5>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <h6 className="mb-3">Ангилал</h6>
                {/* <select 
                  className="form-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Бүх ангилал</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select> */}
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

        {/* Right Side - Products */}
        <div className="col-md-9">
          <div className="row">
            {currentProducts.length > 0 ? (
              currentProducts.map((product) => (
                <div key={product._id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100">
                    <img 
                      src={product.image?.filePath || 'https://via.placeholder.com/300'} 
                      className="card-img-top" 
                      alt={product.title}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <div className="card-body">
                      <h5 className="card-title">{product.title}</h5>
                      <p className="card-text text-muted small mb-2">
                        {/* {categories.find(c => c._id === product.category)?.name || 'Unknown Category'} */}
                      </p>
                      <p className="card-text text-truncate">{product.description}</p>
                      <p className="text-muted fw-bold">Одоогийн үнэ: ₮{product.currentBid || product.price}</p>
                      
                      {!product.isSold && (
                        <>
                          <div className="input-group mb-2">
                            <span className="input-group-text">₮</span>
                            <input
                              type="number"
                              className="form-control"
                              value={bidAmounts[product._id] || ''}
                              onChange={(e) => handleBidChange(product._id, e.target.value)}
                              min={(product.currentBid || product.price) + 1}
                              step="10"
                            />
                          </div>
                          <button 
                            className="btn btn-warning w-100 mb-2"
                            onClick={() => placeBid(product._id, product.currentBid || product.price)}
                          >
                            Үнийн санал өгөх
                          </button>
                        </>
                      )}
                      
                      <Link 
                        to={`/products/${product._id}`} 
                        className="btn btn-outline-primary w-100"
                      >
                        Дэлгэрэнгүй
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12">
                <div className="alert alert-info">Бараа олдсонгүй</div>
              </div>
            )}
          </div>
          
          {/* Pagination - Centered */}
          {filteredProducts.length > productsPerPage && (
            <div className="d-flex justify-content-center mt-4">
              <nav aria-label="Page navigation">
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &laquo; Өмнөх
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
                      Дараах &raquo;
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
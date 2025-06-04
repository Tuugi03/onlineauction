import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { io } from 'socket.io-client';
import { CountdownTimer } from '../../components/Timer';

export const Details = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();

  const [productDetails, setProductDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [userBidAmount, setUserBidAmount] = useState(0);
  const [socketConnection, setSocketConnection] = useState(null);
  const [pastBids, setPastBids] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [bidError, setBidError] = useState(null);
  const [isUserOutbid, setIsUserOutbid] = useState(false); 
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token || localStorage.getItem('token');
  };
  
  const nextImage = () => {
    setCurrentImageIndex(prev => 
      (prev + 1) % productDetails.images.length
    );
  };
  const prevImage = () => {
    setCurrentImageIndex(prev => 
      (prev - 1 + productDetails.images.length) % productDetails.images.length
    );
  };
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket']
    });
    setSocketConnection(socket);

    return () => socket.disconnect();
  }, []);

  const checkBidStatus = async (productId) => {
    const token = getAuthToken();
    if (!token) return false;

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
    const getProductData = async () => {
      try {
        setIsLoading(true);
        
        const [productInfo, bidHistory, allProducts] = await Promise.all([
          axios.get(`http://localhost:5000/api/product/${productId}`),
          axios.get(`http://localhost:5000/api/bidding/${productId}`),
          axios.get('http://localhost:5000/api/product/products')
        ]);
  
        setProductDetails(productInfo.data);
        setPastBids(bidHistory.data.history);
        
        const similarProducts = allProducts.data
          .filter(p => 
            p._id !== productId && 
            (p.category === productInfo.data.category || 
             p.category?._id === productInfo.data.category)
          )
          .sort(() => 0.5 - Math.random()) 
          .slice(0, 4); 
        
        setRecommendedProducts(similarProducts);
        setProductDetails(productInfo.data);
        setPastBids(bidHistory.data.history);
        
        const outbidStatus = await checkBidStatus(productId);
        setIsUserOutbid(outbidStatus);
        
        const currentPrice = productInfo.data.currentBid || productInfo.data.price;
        setUserBidAmount(currentPrice + 1000);
        
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Couldn't load product details");
      } finally {
        setIsLoading(false);
      }
    };
  
    getProductData();
  }, [productId]);

  useEffect(() => {
    if (!socketConnection || !productDetails) return;

    const handlePriceUpdate = async (updatedProduct) => {
      if (updatedProduct._id === productDetails._id) {
        const outbidStatus = await checkBidStatus(updatedProduct._id);
        setIsUserOutbid(outbidStatus);
        
        setProductDetails(updatedProduct);
        setUserBidAmount(updatedProduct.currentBid + 500);
      }
    };

    const handleNewBidNotification = (newBid) => {
      if (newBid.product === productDetails._id) {
        setPastBids(previousBids => [newBid, ...previousBids]);
      }
    };

    socketConnection.on('bidUpdate', handlePriceUpdate);
    socketConnection.on('newBid', handleNewBidNotification);
    socketConnection.on('bidError', (error) => setErrorMessage(error.message));

    return () => {
      socketConnection.off('bidUpdate', handlePriceUpdate);
      socketConnection.off('newBid', handleNewBidNotification);
      socketConnection.off('bidError');
    };
  }, [socketConnection, productDetails]);

  const submitBid = async () => {
    const token = getAuthToken();

    if (!token) {
      navigate('/login');
      return;
    }

    setBidError(null);

    const minimumBid = (productDetails.currentBid || productDetails.price) + 1;
    if (userBidAmount <= minimumBid) {
      setBidError("Та илүү өндөр үнэ санал болгох ёстой.");
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/bidding/',
        {
          productId: productDetails._id,
          price: userBidAmount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.sold) {
        socketConnection.emit('productSold', { 
          productId: productDetails._id,
          buyerId: response.data.buyerId,
          price: userBidAmount
        });
        alert(`Та энэ барааг ${userBidAmount}₮-р худалдан авлаа!`);
      } else {
        socketConnection.emit('bidUpdate', response.data.product);
        socketConnection.emit('newBid', response.data.bid);
        alert("Амжилттай үнэ өглөө");
        
        setIsUserOutbid(false);
      }

      setProductDetails(response.data.product);
      setPastBids(previousBids => [response.data.bid, ...previousBids]);
      setUserBidAmount(response.data.product.currentBid + 500); 
      
    } catch (error) {
      console.error('Bidding error:', error);
      setBidError(error.response?.data?.message || 'Үнийн санал өгөхөд алдаа гарлаа');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center my-5 py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading product details...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger">
          <h5>Алдаа гарлаа</h5>
          <p>{errorMessage}</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Дахин оролдох
          </button>
        </div>
      </div>
    );
  }

  if (!productDetails) {
    return (
      <div className="container my-5">
        <div className="alert alert-info">
          <h5>Product not found</h5>
          <Link to="/products" className="btn btn-outline-primary">
            View other products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <div className="row">
        <div className="col-lg-8">
          <div className="card mb-4 shadow-sm">
            <div className="row g-0">
              <div className="col-md-6 position-relative">
                <div 
                  id="productCarousel" 
                  className="carousel slide"
                  style={{ height: '100%' }}
                >
                  <div className="carousel-inner" style={{ height: '100%' }}>
                    {productDetails.images.map((image, index) => (
                      <div 
                        key={index}
                        className={`carousel-item ${index === currentImageIndex ? 'active' : ''}`}
                        style={{ height: '100%' }}
                      >
                        <img
                          src={image.url || '/default.png'}
                          className="d-block w-100"
                          alt={`Product view ${index + 1}`}
                          style={{
                            height: '400px',
                            objectFit: 'contain',
                            backgroundColor: '#f8f9fa'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {productDetails.images.length > 1 && (
                    <>
                      <button 
                        className="carousel-control-prev"
                        type="button"
                        onClick={prevImage}
                        style={{ width: '40px' }}
                      >
                        <span className="carousel-control-prev-icon bg-dark rounded-circle p-2"></span>
                      </button>
                      <button 
                        className="carousel-control-next"
                        type="button"
                        onClick={nextImage}
                        style={{ width: '40px' }}
                      >
                        <span className="carousel-control-next-icon bg-dark rounded-circle p-2"></span>
                      </button>
                    </>
                  )}
                </div>

                {productDetails.images.length > 1 && (
                  <div className="carousel-indicators position-static mt-2">
                    {productDetails.images.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`mx-1 ${index === currentImageIndex ? 'active' : ''}`}
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: index === currentImageIndex ? '#0d6efd' : '#6c757d'
                        }}
                        onClick={() => setCurrentImageIndex(index)}
                      ></button>
                    ))}
                  </div>
                )}
              </div>
              

              
              <div className="col-md-6">
                <div className="card-body">
                  <h1 className="card-title mb-3">{productDetails.title}</h1>
                  <p className="card-text text-muted mb-4">{productDetails.description}</p>
                  
                  <div className="pricing-section mb-4 p-3 bg-light rounded">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Одоогийн үнэ:</span>
                      <span className="fs-4 text-danger fw-bold">
                        ₮{productDetails.currentBid || productDetails.price}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">Үндсэн үнэ:</small>
                      <small className="text-muted">₮{productDetails.price}</small>
                    </div>
                  </div>

                  <div className="auction-timer mb-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">Үлдсэн цаг:</span>
                      <CountdownTimer deadline={productDetails.bidDeadline} />
                    </div>
                  </div>

                  {!productDetails.sold && (
                    <div className="bid-form mb-4">
                      <label htmlFor="bidAmount" className="form-label">
                        Таны санал (хамгийн бага ₮{(productDetails.currentBid || productDetails.price) + 1})
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">₮</span>
                        <input
                          type="number"
                          id="bidAmount"
                          className="form-control"
                          value={userBidAmount}
                          onChange={(e) => setUserBidAmount(parseFloat(e.target.value) || 0)}
                          min={(productDetails.currentBid || productDetails.price) + 1}
                          step="100"
                        />
                        <button 
                          className={`btn fw-bold ${isUserOutbid ? 'btn-danger' : 'btn-warning'}`} 
                          type="button"
                          onClick={submitBid}
                        >
                          {isUserOutbid ? 'Таны үнийн санал хүчингүй боллоо!' : 'Үнийн санал өгөх'}
                        </button>
                      </div>
                      {bidError && (
                        <div className="alert alert-danger mt-2">
                          {bidError}
                        </div>
                      )}
                    </div>
                  )}

                  {productDetails.sold && (
                    <div className="alert alert-success">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Энэ бараа нь ₮{productDetails.currentBid} төгрөгөөр {new Date(productDetails.soldAt).toLocaleString()}-нд зарагдасан
                    </div>
                  )}

                  <div className="product-meta mt-4">
                    <h5 className="mb-3">Барааны мэдээлэл</h5>
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Ангилал:</span>
                        <span>{productDetails.category?.name || 'Not specified'}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Эхэлсэн хугадаа:</span>
                        <span>{new Date(productDetails.createdAt).toLocaleDateString()}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Төлөв:</span>
                        <span className={productDetails.sold ? 'text-success' : 'text-warning'}>
                          {productDetails.sold ? 'Sold' : 'Available'}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h2 className="h5 mb-0">Үнийн саналууд</h2>
            </div>
            <div className="card-body">
              {pastBids.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Bidder</th>
                        <th>Amount</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastBids.map((bid) => (
                        bid ? (
                          <tr key={bid._id}>
                            <td>{bid.user?.name || 'Anonymous'}</td>
                            <td className="fw-bold">₮{bid.price?.toLocaleString() || 'N/A'}</td>
                            <td>{bid.createdAt ? new Date(bid.createdAt).toLocaleTimeString() : 'Unknown'}</td>
                          </tr>
                        ) : null
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-clock-history fs-1 text-muted mb-3"></i>
                  <p className="text-muted">Ямар нэгэн үнийн санал ирээгүй байна</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card mb-4 shadow-sm">
  <div className="card-header bg-info text-white">
    <h2 className="h5 mb-0">Худалдагч</h2>
  </div>
  <div className="card-body text-center">
    <img 
      src={productDetails.user?.photo?.filePath || '/default.png'} 
      className="rounded-circle mb-3 seller-avatar" 
      alt="Seller" 
      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
    />
    <h3 className="h5 mb-1">{productDetails.user?.name || 'Нууц хэрэглэгч'}</h3>
    <a>{productDetails.user?.email || ''}</a>
    <h5 className="h5 mb-1">{productDetails.user?.phone || ''}</h5>

   
  </div>
</div>

          <div className="card shadow-sm">
            <div className="card-header bg-warning text-white">
              <h2 className="h5 mb-0">Ижил төстэй бараанууд</h2>
            </div>
            <div className="card-body">
              {recommendedProducts.length > 0 ? (
                <div className="list-group">
                  {recommendedProducts.map((product) => (
                    <Link 
                      key={product._id} 
                      to={`/products/${product._id}`} 
                      className="list-group-item list-group-item-action"
                    >
                      <div className="d-flex align-items-center">
                        <img 
                          src={product.images?.find(img => img.isPrimary)?.url || '/default.png'}
                          alt={product.title}
                          className="rounded me-3"
                          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                        />

                        <div>
                          <h3 className="h6 mb-1">{product.title}</h3>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Үнэ:</span>
                            <span className="fw-bold">₮{product.currentBid || product.price}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="bi bi-box-seam fs-1 text-muted mb-3"></i>
                  <p className="text-muted">Ижил төстэй бараа олдсонгүй</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Details;
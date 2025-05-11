import "bootstrap/dist/css/bootstrap.min.css";
import "../../index.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { CountdownTimer } from '../../components/Timer';
import { useNavigate } from 'react-router-dom';

export const Home = () => {
  const navigate = useNavigate();
  
  // State for auctions data
  const [endingSoonAuctions, setEndingSoonAuctions] = useState([]);
  const [newAuctions, setNewAuctions] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/product/products'),
          axios.get('http://localhost:5000/api/category/')
        ]);

        const now = new Date();
        
        // Process products
        const endingSoon = productsResponse.data.filter(product => {
          const endTime = new Date(product.bidDeadline);
          return endTime > now && endTime - now < 24 * 60 * 60 * 1000;
        });
        
        const newlyAdded = productsResponse.data.filter(product => {
          const createdAt = new Date(product.createdAt);
          return now - createdAt < 7 * 24 * 60 * 60 * 1000; // Last 7 days
        });

        setAllProducts(productsResponse.data);
        setEndingSoonAuctions(endingSoon);
        setNewAuctions(newlyAdded);
        setCategories(categoriesResponse.data);
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to fetch data");
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Search functionality
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/allproduct?search=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };

  const handleLiveSearch = (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const results = allProducts.filter(product => 
      product.title.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(results);
  };

  useEffect(() => {
    const searchDelay = setTimeout(() => {
      handleLiveSearch(searchQuery);
    }, 300);

    return () => clearTimeout(searchDelay);
  }, [searchQuery]);

  const handleSearchResultClick = () => {
    setShowResults(false);
    setSearchQuery("");
  };

  // Auction Card Component
  const AuctionCard = ({ auction }) => {
    const endTime = new Date(auction.bidDeadline);
    const now = new Date();
    const isEndingSoon = endTime - now < 24 * 60 * 60 * 1000;
    const isNew = new Date(auction.createdAt) > new Date(now - 7 * 24 * 60 * 60 * 1000);

    return (
      <div className="col-lg-4 col-md-6 mb-4">
        <div className="card h-100 auction-card shadow-sm hover-effect">
          <div className="card-image-container">
            <img 
              src={auction.image?.filePath || '\default.png'} 
              className="card-img-top" 
              alt={auction.title}
              loading="lazy"
            />
            <div className="badge-container">
             
            </div>
          </div>
          <div className="card-body d-flex flex-column">
            <h5 className="card-title text-truncate">{auction.title}</h5>
            <p className="card-text text-muted small mb-3">{auction.description.substring(0, 60)}...</p>
            
            <div className="mt-auto">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small">Одоогийн үнэ:</span>
                <span className="text-primary fw-bold">₮{auction.currentBid || auction.price}</span>
              </div>
              
              <div className="time-remaining mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Дуусах хугацаа:</span>
                  <CountdownTimer deadline={auction.bidDeadline} />
                </div>
                
              </div>
              
              <Link 
                to={`/products/${auction._id}`} 
                className="btn btn-primary w-100 details-button hover-grow"
              >
                <i className="bi bi-arrow-right-circle me-2"></i>Дэлгэрэнгүй
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Category Card Component
  const CategoryCard = ({ category }) => {
    const categoryProducts = allProducts.filter(p => p.category === category._id);
    
    return (
      <div 
        className="col-xl-2 col-lg-3 col-md-4 col-sm-6 mb-4"
        onMouseEnter={() => setActiveCategory(category._id)}
        onMouseLeave={() => setActiveCategory(null)}
      >
        <Link 
          to={`/allproduct?category=${category._id}`} 
          className="text-decoration-none"
        >
          <div className={`card h-100 category-card-inner ${activeCategory === category._id ? 'active' : ''}`}>
            <div className="card-body text-center">
              <h5 className="category-title">{category.title}</h5>
              <p className="text-muted small">{categoryProducts.length} бараа</p>
            </div>
          </div>
        </Link>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '80vh'}}>
        <div className="text-center">
          <div className="spinner-grow text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 fs-5 text-muted">Дуудлага худалдааны мэдээлэл ачаалж байна...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-octagon-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section py-5 bg-gradient-primary text-white">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">
                Дуудлага худалдааны <span className="text-warning">цахим шийдэл</span>
              </h1>
              <p className="lead mb-4">
                Шилдэг бараануудыг хамгийн хямд үнээр авах боломж. Бидэнтэй хамт амжилттай худалдаа хийх цаг боллоо!
              </p>
              
              {/* Search Bar */}
              <div className="search-container mb-4 position-relative">
                <div className="input-group search-group shadow-lg">
                  <span className="input-group-text bg-white border-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control search-input border-0 py-3" 
                    placeholder="Хайж буй бараагаа энд бичнэ үү..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => searchQuery.length > 0 && setShowResults(true)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                  />
                  <button 
                    className="btn btn-warning text-dark fw-bold px-4 search-button" 
                    type="button"
                    onClick={handleSearchSubmit}
                  >
                    Хайх
                  </button>
                </div>

                {/* Search Results Dropdown */}
                {showResults && searchQuery.length > 0 && (
                  <div className="search-results-container shadow-lg rounded-bottom">
                    {searchResults.length > 0 ? (
                      <ul className="search-results-list list-group">
                        {searchResults.slice(0, 5).map((product) => (
                          <Link 
                            key={product._id} 
                            to={`/products/${product._id}`}
                            className="list-group-item list-group-item-action search-result-item"
                            onClick={handleSearchResultClick}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <span>{product.title}</span>
                              <span className="badge bg-primary rounded-pill">
                                ₮{product.currentBid || product.price}
                              </span>
                            </div>
                          </Link>
                        ))}
                        {searchResults.length > 5 && (
                          <li className="list-group-item text-center small text-primary">
                            {searchResults.length - 5} илэрц дэлгэрэнгүй...
                          </li>
                        )}
                      </ul>
                    ) : searchQuery.length > 1 ? (
                      <div className="search-no-results p-3 text-center">
                        <i className="bi bi-exclamation-circle me-2"></i>
                        Илэрц олдсонгүй
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              
              <div className="d-flex flex-wrap gap-2">
                <span className="badge bg-light text-dark me-2 mb-2">
                  <i className="bi bi-lightning-fill text-warning me-1"></i> Онцлох
                </span>
                {categories.slice(0, 4).map(cat => (
                  <Link 
                    key={cat._id} 
                    to={`/allproduct?category=${cat._id}`}
                    className="badge bg-white text-dark text-decoration-none me-2 mb-2"
                  >
                    {cat.title}
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="col-lg-6 d-none d-lg-block">
              <div className="hero-image-container position-relative">
                <div className="hero-main-image">
                  <img 
                    src="https://images.unsplash.com/photo-1585518419759-7fe2e0fbf8a6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Auction" 
                    className="img-fluid rounded-3 shadow"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section py-5 bg-light">
        <div className="container">
          <div className="section-header text-center mb-5">
            <h2 className="section-title position-relative d-inline-block">
              <i className="bi bi-tags-fill text-primary me-2"></i>
              Ангилалууд
              <span className="section-title-decoration"></span>
            </h2>
            <p className="text-muted">Онцлох барааны ангилалууд</p>
          </div>
          
          <div className="row justify-content-center">
            {categories.length > 0 ? (
              categories.slice(0, 6).map(category => (
                <CategoryCard key={category._id} category={category} />
              ))
            ) : (
              <div className="col-12">
                <div className="alert alert-info text-center">
                  <i className="bi bi-info-circle me-2"></i>
                  Ангилал олдсонгүй
                </div>
              </div>
            )}
          </div>
          
          {categories.length > 6 && (
            <div className="text-center mt-4">
              <Link to="/allproduct" className="btn btn-outline-primary px-4">
                <i className="bi bi-grid-3x3-gap me-2"></i>Бүх ангилалыг харах
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Ending Soon Auctions */}
      <section className="auction-section py-5">
        <div className="container">
          <div className="section-header d-flex justify-content-between align-items-center mb-5">
            <div>
              <h2 className="section-title position-relative d-inline-block">
                <i className="bi bi-clock-history text-danger me-2"></i>
                <span className="text-gradient-danger">Өнөөдөр дуусах</span> дуудлага худалдаанууд
                <span className="section-title-decoration bg-danger"></span>
              </h2>
              <p className="text-muted mb-0">Тун удахгүй дуусч байгаа дуудлага худалдаанууд</p>
            </div>
            <Link to="/allproduct?filter=ending" className="btn btn-outline-danger">
              Бүгдийг харах <i className="bi bi-arrow-right ms-2"></i>
            </Link>
          </div>
          
          <div className="row">
            {endingSoonAuctions.length > 0 ? (
              endingSoonAuctions.slice(0, 3).map(auction => (
                <AuctionCard key={auction._id} auction={auction} />
              ))
            ) : (
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body text-center py-5">
                    <i className="bi bi-hourglass-split text-muted fs-1 mb-3"></i>
                    <h5 className="text-muted">Ойролцоо дуусах дуудлага худалдаа олдсонгүй</h5>
                    <Link to="/allproduct" className="btn btn-link">
                      Бүх дуудлага худалдааг харах
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="auction-section py-5 bg-light">
        <div className="container">
          <div className="section-header d-flex justify-content-between align-items-center mb-5">
            <div>
              <h2 className="section-title position-relative d-inline-block">
                <i className="bi bi-stars text-success me-2"></i>
                <span className="text-gradient-success">Шинээр нэмэгдсэн</span> дуудлага худалдаанууд
                <span className="section-title-decoration bg-success"></span>
              </h2>
              <p className="text-muted mb-0">Сүүлийн 7 хоногт нэмэгдсэн дуудлага худалдаанууд</p>
            </div>
            <Link to="/allproduct?filter=new" className="btn btn-outline-success">
              Бүгдийг харах <i className="bi bi-arrow-right ms-2"></i>
            </Link>
          </div>
          
          <div className="row">
            {newAuctions.length > 0 ? (
              newAuctions.slice(0, 3).map(auction => (
                <AuctionCard key={auction._id} auction={auction} />
              ))
            ) : (
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body text-center py-5">
                    <i className="bi bi-box-seam text-muted fs-1 mb-3"></i>
                    <h5 className="text-muted">Шинэ дуудлага худалдаа олдсонгүй</h5>
                   
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>



    </div>
  );
};
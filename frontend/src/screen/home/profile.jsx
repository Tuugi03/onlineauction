import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const Profile = () => {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false); // Added for better UX

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    height: '',
    length: '',
    width: '',
    weight: '',
    bidThreshold: '', // Added new field
    bidDeadline: '',  // Added new field
    image: null,
  });

  const [activeTab, setActiveTab] = useState('myProducts'); 
  const navigate = useNavigate();

  useEffect(() => {
    const getMyProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const productsResponse = await axios.get('http://localhost:5000/api/product/my', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setProducts(productsResponse.data);
        
      } catch (err) {
        console.log('Oops, something went wrong:', err);
        setError('Couldn\'t load products right now. Try refreshing?');
      } finally {
        setLoading(false);
      }
    };
  
    getMyProducts();

    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (e) {
        console.log('Hmm, had trouble reading user data');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    // Handling file uploads differently
    if (name === 'image') {
      if (files && files[0]) {
        // Quick check if it's an image
        if (!files[0].type.startsWith('image/')) {
          alert('Please upload an image file');
          return;
        }
        setFormData({ ...formData, image: files[0] });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
  
    if (!formData.title || !formData.description || !formData.price) {
      alert('Please fill in all required fields');
      setUploading(false);
      return;
    }

    if (formData.bidDeadline && new Date(formData.bidDeadline) <= new Date()) {
      alert('Auction end date must be in the future');
      setUploading(false);
      return;
    }

    const data = new FormData();
    for (const key in formData) {
      if (formData[key] !== null && formData[key] !== '') {
        data.append(key, formData[key]);
      }
    }
  
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      await axios.post('http://localhost:5000/api/product/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
  
      alert('Product added successfully!');
      setFormData({
        ...formData,
        title: '',
        description: '',
        price: '',
        height: '',
        length: '',
        width: '',
        weight: '',
        bidThreshold: '',
        bidDeadline: '',
        image: null,
      });
      
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Something went wrong. Maybe try again?');
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mt-5 text-center">
        <h2>You need to log in first</h2>
        <p className="mb-3">Please sign in to view your profile</p>
        <a href="/login" className="btn btn-primary">Login</a>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-3">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 col-lg-2 d-md-block bg-light sidebar">
          <div className="position-sticky pt-3">
            <div className="text-center mb-4">
              <h4>Welcome back, {user.name}</h4>
              <p className="text-muted small">{user.email}</p>
            </div>
            
            <ul className="nav flex-column">
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-start ${activeTab === 'addProduct' ? 'active fw-bold' : ''}`}
                  onClick={() => setActiveTab('addProduct')}
                >
                  ➕ Шинэ бараа нэмэх
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-start ${activeTab === 'myProducts' ? 'active fw-bold' : ''}`}
                  onClick={() => setActiveTab('myProducts')}
                >
                  🛍️ Миний бараанууд
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-start ${activeTab === 'history' ? 'active fw-bold' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  🛍️ Миний худалдан авалтын түүх
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-start ${activeTab === 'profile' ? 'active fw-bold' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  👤 Нүүр хуудас
                </button>
              </li>
            </ul>
            
            <div className="mt-3 pt-2 border-top">
              <button 
                className="btn btn-outline-danger w-100" 
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9 col-lg-10 px-4">
          {activeTab === 'addProduct' && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h4 className="card-title text-center mb-4">List a New Item</h4>
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                  <div className="row g-3">
                    {/* Required fields */}
                    {['title', 'description', 'price'].map(field => (
                      <div className="col-md-6" key={field}>
                        <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}*</label>
                        {field === 'description' ? (
                          <textarea
                            className="form-control"
                            name={field}
                            value={formData[field]}
                            onChange={handleChange}
                            required
                            rows={3}
                          />
                        ) : (
                          <input
                            type={field === 'price' ? 'number' : 'text'}
                            className="form-control"
                            name={field}
                            value={formData[field]}
                            onChange={handleChange}
                            required
                            min={field === 'price' ? 1 : undefined}
                          />
                        )}
                      </div>
                    ))}

                    {/* Optional fields */}
                    {['category', 'height', 'length', 'width', 'weight'].map(field => (
                      <div className="col-md-6" key={field}>
                        <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                        <input
                          type={field === 'category' ? 'text' : 'number'}
                          className="form-control"
                          name={field}
                          value={formData[field]}
                          onChange={handleChange}
                        />
                      </div>
                    ))}

                    {/* Auction specific fields */}
                    <div className="col-md-6">
                      <label className="form-label">Bid Threshold (optional)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="bidThreshold"
                        value={formData.bidThreshold}
                        onChange={handleChange}
                        min="0"
                        placeholder="Instant buy price"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Auction End Date*</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        name="bidDeadline"
                        value={formData.bidDeadline}
                        onChange={handleChange}
                        required
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>

                    {/* Image upload */}
                    <div className="col-12">
                      <label className="form-label">Product Image</label>
                      <input
                        type="file"
                        className="form-control"
                        name="image"
                        onChange={handleChange}
                        accept="image/*"
                      />
                      <div className="form-text">Upload a clear photo of your item</div>
                    </div>

                    <div className="col-12 mt-2">
                      <button 
                        type="submit" 
                        className="btn btn-primary w-100"
                        disabled={uploading}
                      >
                        {uploading ? 'Uploading...' : 'List Item'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'myProducts' && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="card-title mb-0">My Listed Items</h4>
                  <span className="badge bg-secondary">{products.length} items</span>
                </div>

                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Getting your products...</p>
                  </div>
                ) : error ? (
                  <div className="alert alert-warning">
                    <p>Whoops! {error}</p>
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => window.location.reload()}
                    >
                      Try Again
                    </button>
                  </div>
                ) : products.length > 0 ? (
                  <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                    {products.map((product) => (
                      <div className="col" key={product._id}>
                        <div className="card h-100">
                          {product.image?.filePath && (
                            <img 
                              src={product.image.filePath} 
                              className="card-img-top" 
                              alt={product.title}
                              style={{ height: '200px', objectFit: 'cover' }}
                            />
                          )}
                          <div className="card-body">
                            <h5 className="card-title">{product.title}</h5>
                            <p className="card-text text-truncate">{product.description}</p>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-bold">${product.price}</span>
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => navigate(`/product/${product.slug}`)}
                              >
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <p className="text-muted">You haven't listed any items yet</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setActiveTab('addProduct')}
                    >
                      List Your First Item
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
           {activeTab === 'history' && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="card-title mb-0">My Listed Items</h4>
                  <span className="badge bg-secondary">{products.length} items</span>
                </div>

                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Getting your products...</p>
                  </div>
                ) : error ? (
                  <div className="alert alert-warning">
                    <p>Whoops! {error}</p>
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => window.location.reload()}
                    >
                      Try Again
                    </button>
                  </div>
                ) : products.length > 0 ? (
                  <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                    {products.map((product) => (
                      <div className="col" key={product._id}>
                        <div className="card h-100">
                          {product.image?.filePath && (
                            <img 
                              src={product.image.filePath} 
                              className="card-img-top" 
                              alt={product.title}
                              style={{ height: '200px', objectFit: 'cover' }}
                            />
                          )}
                          <div className="card-body">
                            <h5 className="card-title">{product.title}</h5>
                            <p className="card-text text-truncate">{product.description}</p>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-bold">${product.price}</span>
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => navigate(`/product/${product.slug}`)}
                              >
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <p className="text-muted">You haven't listed any items yet</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setActiveTab('addProduct')}
                    >
                      List Your First Item
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h4 className="card-title mb-4">My Profile</h4>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={user.name || ''} 
                        readOnly 
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        value={user.email || ''} 
                        readOnly 
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6 className="card-subtitle mb-2 text-muted">Нүүр хуудас</h6>
                        <ul className="list-unstyled">
                          <li>🛍️ Миний бараанууд: {products.length}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
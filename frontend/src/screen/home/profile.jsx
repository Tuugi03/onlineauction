import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const Profile = () => {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    height: '',
    length: '',
    width: '',
    weight: '',
    image: null,
  });
  const [activeTab, setActiveTab] = useState('myProducts'); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token'); 
        
        const [productsResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/product/my', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
        ]);
        
        setProducts(productsResponse.data);
        console.log(products)
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();

    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setFormData({ ...formData, image: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const data = new FormData();
    for (const key in formData) {
      data.append(key, formData[key]);
    }
  
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const res = await axios.post('http://localhost:5000/api/product/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
  
      alert('Бүтээгдэхүүн амжилттай нэмэгдлээ');
      setFormData({
        title: '',
        description: '',
        price: '',
        category: '',
        height: '',
        length: '',
        width: '',
        weight: '',
        image: null,
      });
    } catch (error) {
      console.error(error);
      alert('Алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  if (!user) {
    return (
      <div className="container mt-5 text-center">
        <h2>Та нэвтрээгүй байна</h2>
        <a href="/login" className="btn btn-primary">Нэвтрэх</a>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <div className="col-md-3 col-lg-2 d-md-block bg-light sidebar">
          <div className="position-sticky pt-3">
            <div className="text-center mb-4">
              <h4>Хэрэглэгч: {user.name}</h4>
              <p className="text-muted">{user.email}</p>
            </div>
            
            <ul className="nav flex-column">
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-start ${activeTab === 'addProduct' ? 'active' : ''}`}
                  onClick={() => setActiveTab('addProduct')}
                >
                  Бүтээгдэхүүн нэмэх
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-start ${activeTab === 'myProducts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('myProducts')}
                >
                  Миний бүтээгдэхүүнүүд
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-start ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  Профайл
                </button>
              </li>
            </ul>
            
            <div className="mt-3">
              <button className="btn btn-danger w-100" onClick={handleLogout}>
                Гарах
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-9 col-lg-10">
          {activeTab === 'addProduct' && (
            <div className="card">
              <div className="card-body">
                <h4 className="card-title text-center mb-4">Бүтээгдэхүүн нэмэх</h4>
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                  {['title', 'description', 'price', 'category', 'height', 'length', 'width', 'weight'].map(field => (
                    <div className="mb-3" key={field}>
                      <label className="form-label">{field}</label>
                      <input
                        type={field === 'price' || field === 'height' || field === 'length' || field === 'width' || field === 'weight' ? 'number' : 'text'}
                        className="form-control"
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                        required={['title', 'description', 'price'].includes(field)}
                      />
                    </div>
                  ))}
                  <div className="mb-3">
                    <label className="form-label">Зураг</label>
                    <input
                      type="file"
                      className="form-control"
                      name="image"
                      onChange={handleChange}
                      accept="image/*"
                    />
                  </div>
                  <button type="submit" className="btn btn-success w-100">Нэмэх</button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'myProducts' && (
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">Миний бүтээгдэхүүнүүд</h4>

                {loading && <p>Уншиж байна...</p>}
                {error && <p className="text-danger">Алдаа: {error}</p>}
                
                {!loading && !error && (
                  <ul className="list-group">
                    {products.length > 0 ? (
                      products.map((product) => (
                        <li key={product._id} className="list-group-item">
                          <strong>{product.name}</strong> - {product.price}₮
                        </li>
                      ))
                    ) : (
                      <p>Танд бүртгэгдсэн бүтээгдэхүүн алга байна.</p>
                    )}
                  </ul>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">Миний Профайл</h4>
                <p><strong>Нэр:</strong> {user.name || 'N/A'}</p>
                <p><strong>Имэйл:</strong> {user.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
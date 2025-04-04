import { useState, useEffect } from 'react';
import axios from 'axios';
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from 'react-router-dom';

export const Product = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/product/getAllProducts');
        setProducts(response.data);
        console.log(response.data,"asdasd")
        setLoading(false);
      } catch (er) {
        setError(er.message);
        setLoading(false);
        console.error('Алдаа:', er);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mt-5">
        : {error}
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Бараанууд</h2>
      
      <div className="row">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product._id} className="col-md-4 mb-4">
              <div className="card h-100">
                <img 
                  src={product.image || 'https://via.placeholder.com/300'} 
                  className="card-img-top" 
                  alt={product.title}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <div className="card-body">
                  <h5 className="card-title">{product.title}</h5>
                  <p className="card-text">{product.description}</p>
                  <p className="text-muted">Үнэ:₮{product.price}</p>
                  <Link 
                    to={`/products/${product._id}`} 
                    className="btn btn-primary"
                  >
                    Дэлгэрэнгүй
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="alert alert-info">No products found</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Product;
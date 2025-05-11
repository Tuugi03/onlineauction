import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSave, FiX, FiUpload } from 'react-icons/fi';
import axios from 'axios';

export const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [success, setSuccess] = useState('');
  
  // Get token from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const token = user?.token;

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

  useEffect(() => {
    if (!token) {
      setError('Нэвтрэх шаардлагатай');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const productResponse = await axios.get(`http://localhost:5000/api/product/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const productData = productResponse.data;
        setProduct(productData);
        setFormData({
          title: productData.title,
          description: productData.description,
          price: productData.price,
          height: productData.height || '',
          length: productData.length || '',
          width: productData.width || '',
          weight: productData.weight || '',
          image: null,
        });
        
        if (productData.image) {
          setPreviewImage(productData.image.filePath || productData.image);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Алдаа гарлаа');
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
      });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('height', formData.height);
      formDataToSend.append('length', formData.length);
      formDataToSend.append('width', formData.width);
      formDataToSend.append('weight', formData.weight);
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const response = await fetch(`http://localhost:5000/api/product/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Засахад алдаа гарлаа');
      }

      setSuccess('Бараа амжилттай шинэчлэгдлээ');
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading && !product) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Ачаалж байна...</span>
      </div>
      <p className="mt-3">Барааны мэдээлэл ачаалж байна...</p>
    </div>
  );

  if (error) return (
    <div className="container py-4">
      <div className="alert alert-danger">
        <p>{error}</p>
        <button 
          className="btn btn-sm btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          Буцах
        </button>
      </div>
    </div>
  );

  return (
    <div className="container py-4">
      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <h4 className="mb-0">Бараа засах</h4>
        </div>
        <div className="card-body">
          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Image Upload */}
              <div className="col-md-4">
                <div className="mb-3">
                  <label htmlFor="image" className="form-label">
                    Барааны зураг
                  </label>
                  <div className="border rounded p-3 text-center">
                    {previewImage ? (
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="img-fluid mb-2"
                        style={{ maxHeight: '200px' }}
                      />
                    ) : (
                      <div className="text-muted py-4">Зураг оруулаагүй</div>
                    )}
                    <div className="d-flex justify-content-center">
                      <label className="btn btn-sm btn-outline-primary">
                        <FiUpload className="me-1" />
                        Зураг сонгох
                        <input 
                          type="file" 
                          id="image"
                          className="d-none" 
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Product Details */}
              <div className="col-md-8">
                <div className="row g-3">
                  {/* Title */}
                  <div className="col-12">
                    <label htmlFor="title" className="form-label">
                      Гарчиг <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  {/* Description */}
                  <div className="col-12">
                    <label htmlFor="description" className="form-label">
                      Тайлбар
                    </label>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                  
                  {/* Price */}
                  <div className="col-md-6">
                    <label htmlFor="price" className="form-label">
                      Үнэ <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                      />
                      <span className="input-group-text">₮</span>
                    </div>
                  </div>
                  
                  {/* Dimensions */}
                  <div className="col-md-3">
                    <label htmlFor="height" className="form-label">
                      Өндөр (см)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="height"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="col-md-3">
                    <label htmlFor="length" className="form-label">
                      Урт (см)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="length"
                      name="length"
                      value={formData.length}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="col-md-3">
                    <label htmlFor="width" className="form-label">
                      Өргөн (см)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="width"
                      name="width"
                      value={formData.width}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="col-md-3">
                    <label htmlFor="weight" className="form-label">
                      Жин (кг)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                <FiX className="me-1" /> Цуцлах
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Хадгалж байна...
                  </>
                ) : (
                  <>
                    <FiSave className="me-1" /> Хадгалах
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;
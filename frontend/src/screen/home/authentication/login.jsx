import { useState, useEffect } from 'react';
import axios from 'axios';
import "bootstrap/dist/css/bootstrap.min.css";
import { Link, useNavigate } from 'react-router-dom';

export const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();

  // Load Google Client ID and initialize
  useEffect(() => {
    const loadGoogleScript = () => {
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google script loaded');
      };
      script.onerror = () => {
        console.error('Failed to load Google script');
      };
      document.body.appendChild(script);
    };

    const loadGoogleClientId = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users/google/client-id');
        setGoogleClientId(response.data.clientId);
        console.log('Google Client ID loaded:', response.data.clientId);
        loadGoogleScript();
      } catch (error) {
        console.error('Failed to load Google Client ID:', error);
      }
    };

    loadGoogleClientId();

    return () => {
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (googleClientId && window.google) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleResponse
      });

      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInButton'),
        { 
          theme: 'outline', 
          size: 'large',
          width: '400'
        }
      );
    }
  }, [googleClientId]);

  const handleGoogleResponse = async (response) => {
    setIsGoogleLoading(true);
    setErrors({});

    try {
      const authResponse = await axios.post('http://localhost:5000/api/users/google', {
        credential: response.credential
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });

      if (authResponse.status === 200) {
        localStorage.setItem('user', JSON.stringify(authResponse.data));
        window.dispatchEvent(new Event("userLogin"));
        navigate("/");
      }
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Google нэвтрэлт амжилтгүй боллоо'
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Имэйл ээ бөглөнө үү';
    } 
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Зөв утга оруулна уу';
    }
    
    if (!formData.password) {
      newErrors.password = 'Нууц үгээ оруулна уу';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/users/login', formData, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true 
        }
      );

      if (response.status === 200) {
        localStorage.setItem('user', JSON.stringify(response.data));
        window.dispatchEvent(new Event("userLogin"));
        navigate("/");
      }
    } catch (error) {
      console.error('Алдаа:', error);
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            setErrors({
              ...errors,
              submit: error.response.data.message 
            });
            break;
          case 401:
            setErrors({
              ...errors,
              submit: 'Нууц үг эсвэл имэйл буруу байна'
            });
            break;
          default:
            setErrors({
              ...errors,
              submit: 'Алдаа.'
            });
        }
      } else {
        setErrors({
          ...errors,
          submit: error.message
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Нэвтрэх</h2>
              
              {errors.submit && (
                <div className="alert alert-danger">{errors.submit}</div>
              )}

              {/* Google Sign-In Section */}
              <div className="mb-4">
                <div className="text-center mb-3">
                  <div id="googleSignInButton" className="d-inline-block"></div>
                  {isGoogleLoading && (
                    <div className="mt-2">
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Google-ээр нэвтэрч байна...
                    </div>
                  )}
                </div>
                <div className="d-flex align-items-center mb-3">
                  <hr className="flex-grow-1" />
                  <span className="mx-3">Эсвэл</span>
                  <hr className="flex-grow-1" />
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Нууц үг</label>
                  <input
                    type="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password}</div>
                  )}
                </div>

                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="rememberMe"
                    />
                    <label className="form-check-label" htmlFor="rememberMe">
                      Намайг сана
                    </label>
                  </div>
                  <Link to="/forgot-password" className="text-decoration-none">
                    Нууц үг мартсан?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Нэвтрэх...
                    </>
                  ) : 'Нэвтрэх'}
                </button>

                <div className="text-center">
                  <p className="mb-0">Бүртгэлгүй юу? <Link to="/register" className="text-decoration-none">Бүртгүүлэх</Link></p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
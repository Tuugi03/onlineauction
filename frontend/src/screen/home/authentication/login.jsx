import { useState } from 'react';
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
  const navigate = useNavigate();

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
        console.log("amjilttai");
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

                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="rememberMe"
                  />
                  <label className="form-check-label" htmlFor="rememberMe">
                    Хадгалах
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Нэвтрэх...
                    </>
                  ) : 'Нэвтрэх'}
                </button>
              </form>

              <div className="mt-3 text-center">
                <Link to="/" className="text-decoration-none d-block mb-2">
                  Нууц үг сэргээх
                </Link>
                <Link to="/register" className="text-decoration-none">
                  Бүртгэл үүсгэх
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
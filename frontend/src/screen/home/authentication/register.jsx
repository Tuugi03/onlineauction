import { useState } from 'react';
import axios from 'axios';
import "bootstrap/dist/css/bootstrap.min.css";

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '' 
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({...formData,[name]: value});
    
    if (errors[name]) {
      setErrors({...errors,[name]: null});
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
   
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {newErrors.email = 'Зөв утга оруулна уу';}
  
    if (!formData.password) {newErrors.password = 'Нууц үгээ оруулна уу';} 
    
    else if (formData.password.length < 6) {newErrors.password = 'Нууц үг багадаа 6 оронтой байх ёстой'}
   
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Нууц үг таарахгүй байна';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const { confirmPassword, ...userData } = formData;
      
      const response = await axios.post('http://localhost:5000/api/users/register', userData,{
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );

      if (response.status === 201) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
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
          case 409:
            setErrors({
              ...errors,
              email: 'Бүртгэлтэй имэйл байна'
            });
            break;
          default:
            setErrors({
              ...errors,
              submit: 'Server error. Please try again later.'
            });
        }
      } else {
        setErrors({
          ...errors,
          submit: error.message || 'Алдаа'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-success text-center">
              <h2>Амжилттай!</h2>
            
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Бүртгэл үүсгэх</h2>
              
              {errors.submit && (
                <div className="alert alert-danger">{errors.submit}</div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Нэр</label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  {errors.name && (
                    <div className="invalid-feedback">{errors.name}</div>
                  )}
                </div>

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
                    minLength="6"
                  />
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Нууц үг (дахин оруулах)
                  </label>
                  <input
                    type="password"
                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  {errors.confirmPassword && (
                    <div className="invalid-feedback">{errors.confirmPassword}</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                      Бүртгэл үүсэж байна...
                    </>
                  ) : 'Бүртгэл үүсгэх'}
                </button>
              </form>

              <div className="mt-3 text-center">
                <a href="/login">Нэвтрэх</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
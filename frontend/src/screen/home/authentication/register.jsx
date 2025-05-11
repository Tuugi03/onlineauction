import { useState, useEffect } from 'react';
import axios from 'axios';
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from 'react-router-dom';
export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Load Google Client ID and initialize
  useEffect(() => {
    const loadGoogleScript = () => {
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        setGoogleScriptLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setGoogleScriptLoaded(true);
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
          text: 'signup_with',
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
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const { name, email, password, confirmPassword } = formData;

    if (!name.trim()) newErrors.name = 'Нэрээ оруулна уу';
    if (!email.trim()) {
      newErrors.email = 'Имэйлээ оруулна уу';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Зөв имэйл хаяг оруулна уу';
    }

    if (!password) {
      newErrors.password = 'Нууц үгээ оруулна уу';
    } else if (password.length < 6) {
      newErrors.password = 'Нууц үг багадаа 6 тэмдэгтээс бүрдсэн байх ёстой';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Нууц үг таарахгүй байна';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});
    setRegisteredEmail(formData.email);

    try {
      await axios.post('http://localhost:5000/api/users/send-code', {
        email: formData.email
      });

      setRegistrationStep(2);
    } catch (error) {
      if (error.response?.status === 409) {
        setErrors({ email: 'Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна' });
      } else {
        setErrors({ submit: 'Код илгээхэд алдаа гарлаа' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
  
    try {
      await axios.post('http://localhost:5000/api/users/verify-email', {
        email: registeredEmail,
        code: verificationCode
      });
  
      const { confirmPassword, ...userData } = formData;
  
      await axios.post('http://localhost:5000/api/users/register', userData);
      const loginResponse = await axios.post('http://localhost:5000/api/users/login', {
        email: userData.email,
        password: userData.password
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });
  
      if (loginResponse.status === 200) {
        localStorage.setItem('user', JSON.stringify(loginResponse.data));
        window.dispatchEvent(new Event("userLogin"));
        navigate("/");
      }
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Баталгаажуулах код буруу байна'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendVerificationCode = async () => {
    try {
      await axios.post('http://localhost:5000/api/users/resend-verification', {
        email: registeredEmail
      });
      alert('Баталгаажуулах шинэ код имэйлээр илгээгдлээ!');
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Код дахин илгээхэд алдаа гарлаа'
      });
    }
  };

  if (registrationStep === 2) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h2 className="card-title text-center mb-4">Имэйл баталгаажуулалт</h2>

                {errors.submit && (
                  <div className="alert alert-danger">{errors.submit}</div>
                )}

                <p className="text-center">
                  Бид <strong>{registeredEmail}</strong> хаяг руу 6 оронтой баталгаажуулах код илгээлээ.
                </p>

                <form onSubmit={handleVerificationSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Баталгаажуулах код</label>
                    <input
                      type="text"
                      className="form-control"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                      maxLength="6"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isSubmitting || verificationCode.length < 6}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Баталгаажуулж байна...
                      </>
                    ) : 'Баталгаажуулах'}
                  </button>
                </form>

                <div className="mt-3 text-center">
                  <button
                    onClick={resendVerificationCode}
                    className="btn btn-link p-0"
                  >
                    Код дахин илгээх
                  </button>
                </div>
              </div>
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

              {/* Google Sign-In Section */}
              <div className="mb-4">
                <div className="d-flex align-items-center mb-3">
                  <hr className="flex-grow-1" />
                  <span className="mx-3">Эсвэл</span>
                  <hr className="flex-grow-1" />
                </div>
                <div className="text-center">
                  <div id="googleSignInButton" className="d-inline-block"></div>
                  {isGoogleLoading && (
                    <div className="mt-2">
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Google-ээр нэвтэрч байна...
                    </div>
                  )}
                </div>
              </div>

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
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Имэйл</label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
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
                  {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                </div>

                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">Нууц үг (дахин)</label>
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
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Баталгаажуулах код илгээж байна...
                    </>
                  ) : 'Бүртгэл үүсгэх'}
                </button>
              </form>

              <div className="mt-3 text-center">
                <p>Бүртгэлтэй юу? <a href="/login">Нэвтрэх</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
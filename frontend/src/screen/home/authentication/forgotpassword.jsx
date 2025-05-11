import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email) {
      setError('Имэйл хаягаа оруулна уу');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Зөв имэйл хаяг оруулна уу');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/users/forgot-password', {
        email
      });

      if (response.status === 200) {
        setSuccess('Нууц үг сэргээх линк имэйл хаягруу илгээгдлээ!');
      }
    } catch (err) {
      console.error('Алдаа:', err);
      setError(err.response?.data?.message || 'Алдаа гарлаа. Дахин оролдоно уу.');
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
              <h2 className="card-title text-center mb-4">Нууц үг сэргээх</h2>
              
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Имэйл хаяг</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <div className="form-text">Бүртгэлтэй имэйл хаягаа оруулна уу</div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Илгээж байна...
                    </>
                  ) : 'Илгээх'}
                </button>
              </form>

              <div className="mt-3 text-center">
                <Link to="/login" className="text-decoration-none">
                  Нэвтрэх хуудас руу буцах
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
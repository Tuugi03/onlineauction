import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";


export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/users/verify-reset-token/${token}`);
        if (response.status === 200) {
          setTokenValid(true);
        }
      } catch (err) {
        setError('Линк хүчингүй эсвэл хугацаа нь дууссан байна.');
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || !confirmPassword) {
      setError('Шинэ нууц үгээ оруулна уу');
      return;
    }

    if (password !== confirmPassword) {
      setError('Нууц үг таарахгүй байна');
      return;
    }

    if (password.length < 6) {
      setError('Нууц үг хамгийн багадаа 6 тэмдэгтээс бүрдэнэ');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await axios.post(`http://localhost:5000/api/users/reset-password/${token}`, {
        password
      });

      if (response.status === 200) {
        setSuccess('Нууц үг амжилттай солигдлоо! Та нэвтрэх хуудас руу шилжинэ.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      console.error('Алдаа:', err);
      setError(err.response?.data?.message || 'Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <h2 className="card-title mb-4">Алдаа</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                <Link to="/forgot-password" className="btn btn-primary">
                  Шинээр нууц үг сэргээх хүсэлт илгээх
                </Link>
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
              <h2 className="card-title text-center mb-4">Шинэ нууц үг бүртгэх</h2>
              
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Шинэ нууц үг</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength="6"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">Шинэ нууц үг давтах</label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength="6"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Боловсруулж байна...
                    </>
                  ) : 'Нууц үг солих'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
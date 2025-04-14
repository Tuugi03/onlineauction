import "../../index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { IoSearchOutline } from "react-icons/io5";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export const Header = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="header py-3 text-warning d-flex justify-content-between align-items-center px-4">
      <div className="d-flex align-items-center gap-4">
        <h1 className="m-0">AUCTIONHUB</h1>
        <ul className="list-unstyled d-flex gap-4 m-0 align-items-center">
          <li><Link to="/" className="text-red text-decoration-none">Home</Link></li>
          <li><Link to="/allproduct" className="text-red text-decoration-none">Product</Link></li>
          <li><Link to="/" className="text-red text-decoration-none">About</Link></li>
        </ul>
      </div>

      <nav>
        <ul className="list-unstyled d-flex gap-4 m-0 align-items-center">
          <li>
            <Link to="/" className="text-red text-decoration-none">
              <IoSearchOutline size={23} />
            </Link>
          </li>
          
          {user ? (
            <>
              <li><a href="/profile" className="text-red text-decoration-none">{user.name || ""}</a></li>
              <li><button onClick={handleLogout} className="btn btn-sm btn-outline-danger">Гарах</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login" className="text-red text-decoration-none">Нэвтрэх</Link></li>
              <li><Link to="/register" className="text-red text-decoration-none">Бүртгүүлэх</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

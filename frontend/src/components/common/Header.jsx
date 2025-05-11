import "../../index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { IoSearchOutline, IoPersonCircleOutline } from "react-icons/io5";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export const Header = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const updateUser = () => {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };
  
    updateUser();
  
    window.addEventListener("userLogin", updateUser);
    window.addEventListener("storage", updateUser);
  
    return () => {
      window.removeEventListener("userLogin", updateUser);
      window.removeEventListener("storage", updateUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
    navigate("/login");
  };

  const handleProfileClick = (e) => {
    if (!user) return;
    
    if (user.role === "admin") {
      e.preventDefault(); 
      navigate("/admin"); 
    }
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="header sticky-top py-3 bg-dark text-light shadow-sm">
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center">
          {/* Logo and Main Navigation */}
          <div className="d-flex align-items-center gap-4">
            <Link to="/" className="text-decoration-none">
              <h1 className="m-0 text-warning fw-bold">
                <span className="text-gradient">AUCTION</span>HUB
              </h1>
            </Link>
            
            <ul className="list-unstyled d-flex gap-4 m-0 align-items-center d-none d-md-flex">
              <li>
                <Link to="/" className="text-light text-decoration-none hover-underline">
                  Нүүр хуудас
                </Link>
              </li>
              <li>
                <Link to="/allproduct" className="text-light text-decoration-none hover-underline">
                  Дуудлага худалдаа
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-light text-decoration-none hover-underline">
                  Тухай
                </Link>
              </li>
            </ul>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="navbar-toggler d-md-none border-0" 
            type="button" 
            onClick={toggleMenu}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon text-light">☰</span>
          </button>

          <nav className="d-none d-md-block">
            <ul className="list-unstyled d-flex gap-4 m-0 align-items-center">
              {user ? (
                <>
                  <li className="dropdown position-relative">
                    <button 
                      className="btn btn-link text-light text-decoration-none p-0 d-flex align-items-center"
                      onClick={toggleDropdown}
                      aria-expanded={isDropdownOpen}
                    >
                      <IoPersonCircleOutline className="me-1" size={24} />
                      <span>{user.name || "Профайл"}</span>
                    </button>
                    {isDropdownOpen && (
                      <ul 
                        className="dropdown-menu show position-absolute end-0 mt-2" 
                        style={{ display: 'block' }}
                      >
                        <li>
                          <Link 
                            to={user.role === "admin" ? "#" : "/profile"} 
                            className="dropdown-item"
                            onClick={handleProfileClick}
                          >
                            {user.role === "admin" ? "Админ панел" : "Миний профайл"}
                          </Link>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <button 
                            onClick={handleLogout} 
                            className="dropdown-item text-danger"
                          >
                            Гарах
                          </button>
                        </li>
                      </ul>
                    )}
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login" className="btn btn-outline-light btn-sm">
                      Нэвтрэх
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="btn btn-warning btn-sm text-dark">
                      Бүртгүүлэх
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>

        {/* Mobile Menu - Dropdown */}
        {isMenuOpen && (
          <div className="mt-3 d-md-none bg-dark p-3 rounded">
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link 
                  to="/" 
                  className="text-light text-decoration-none d-block p-2 rounded hover-bg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Нүүр хуудас
                </Link>
              </li>
              <li className="mb-2">
                <Link 
                  to="/allproduct" 
                  className="text-light text-decoration-none d-block p-2 rounded hover-bg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Дуудлага худалдаа
                </Link>
              </li>
              <li className="mb-2">
                <Link 
                  to="/about" 
                  className="text-light text-decoration-none d-block p-2 rounded hover-bg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Тухай
                </Link>
              </li>
              
              {user ? (
                <>
                  <li className="mb-2">
                    <Link 
                      to={user.role === "admin" ? "#" : "/profile"} 
                      className="text-light text-decoration-none d-block p-2 rounded hover-bg"
                      onClick={handleProfileClick}
                    >
                      {user.role === "admin" ? "Админ панел" : "Миний профайл"}
                    </Link>
                  </li>
                  <li>
                    <button 
                      onClick={handleLogout} 
                      className="btn btn-outline-danger w-100"
                    >
                      Гарах
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="mb-2">
                    <Link 
                      to="/login" 
                      className="btn btn-outline-light w-100 mb-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Нэвтрэх
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/register" 
                      className="btn btn-warning w-100 text-dark"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Бүртгүүлэх
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};
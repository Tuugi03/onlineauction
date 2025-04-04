import "../../index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { IoSearchOutline } from "react-icons/io5";

export const Header = () => {
    return (
      <header className="header py-3 text-warning d-flex justify-content-between align-items-center px-4">
        <div className="d-flex align-items-center gap-4">
  <h1 className="m-0">AUCTIONHUB</h1>
  <ul className="list-unstyled d-flex gap-4 m-0 align-items-center">
    <li><a href="/" className="text-red text-decoration-none">Home</a></li>
    <li><a href="/allproduct" className="text-red text-decoration-none">Product</a></li>
    <li><a href="/" className="text-red text-decoration-none">About</a></li>
  </ul>
</div>
        <nav>
          <ul className="list-unstyled d-flex gap-4 m-0 align-items-center">
           
            <li>
              <a href="/" className="text-red text-decoration-none">
                <IoSearchOutline size={23} />
              </a>
            </li>
            <li><a href="/login" className="text-red text-decoration-none">Login</a></li>
            <li><a href="/register" className="text-red text-decoration-none">Sign up</a></li>
           
          </ul>
        </nav>
      </header>
    );
};
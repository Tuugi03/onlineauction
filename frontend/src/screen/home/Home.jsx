import "bootstrap/dist/css/bootstrap.min.css";
import "../../index.css";
import { useEffect, useState } from "react";

export const Home = () => {
  const [endingSoonAuctions, setEndingSoonAuctions] = useState([
    { id: 1, title: "Apple iPhone 15 Pro", price: "₮3,850,000", timeLeft: "12 мин", image: "https://via.placeholder.com/150" },
    
  ]);

  const [newAuctions, setNewAuctions] = useState([
    { id: 4, title: "Rolex Submariner", price: "₮25,000,000", timeLeft: "2 цаг", image: "https://via.placeholder.com/150" },

  ]);

  const [featuredCategories, setFeaturedCategories] = useState([
    { id: 1, name: "Гар утас", icon: "📱", count: "1" },
  
  ]);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section py-5 bg-light">
        <div className="container text-center">
          <h1 className="display-4 mb-4 fw-bold text-primary">Дуудлага худалдааны цахим шийдэл</h1>
          <p className="lead mb-5">Шилдэг бараануудыг хамгийн хямд үнээр авах боломж</p>
          
          <div className="input-group mx-auto search-box" style={{maxWidth: "700px"}}>
            <input 
              type="text" 
              className="form-control form-control-lg border-primary" 
              placeholder="Хайж буй бараагаа энд бичнэ үү"
            />
            <button className="btn btn-primary btn-lg" type="button">
              <i className="bi bi-search me-2"></i>Хайх
            </button>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">Удахгүй дуусгах дуудлага</h2>
            <a href="#" className="btn btn-outline-primary">Бүгдийг харах</a>
          </div>
          
          <div className="row g-4">
            {endingSoonAuctions.map(auction => (
              <div key={auction.id} className="col-md-4">
                <div className="card auction-card h-100 border-0 shadow-sm">
                  <div className="badge bg-danger position-absolute m-2">Дуусах хугацаа: {auction.timeLeft}</div>
                  <img src={auction.image} className="card-img-top p-3" alt={auction.title} />
                  <div className="card-body">
                    <h5 className="card-title">{auction.title}</h5>
                    <p className="card-text text-danger fw-bold">{auction.price}</p>
                  </div>
                  <div className="card-footer bg-transparent border-0">
                    <button className="btn btn-primary w-100">Оролцох</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Auctions Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">Шинээр эхэлсэн дуудлага</h2>
            <a href="#" className="btn btn-outline-primary">Бүгдийг харах</a>
          </div>
          
          <div className="row g-4">
            {newAuctions.map(auction => (
              <div key={auction.id} className="col-md-4">
                <div className="card auction-card h-100 border-0 shadow-sm">
                  <div className="badge bg-success position-absolute m-2">Шинэ</div>
                  <img src={auction.image} className="card-img-top p-3" alt={auction.title} />
                  <div className="card-body">
                    <h5 className="card-title">{auction.title}</h5>
                    <p className="card-text text-danger fw-bold">{auction.price}</p>
                  </div>
                  <div className="card-footer bg-transparent border-0">
                    <button className="btn btn-outline-primary w-100">Дэлгэрэнгүй</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center mb-5 fw-bold">Ангилалууд</h2>
          
          <div className="row g-4">
            {featuredCategories.map(category => (
              <div key={category.id} className="col-md-4 col-lg-2">
                <div className="card category-card h-100 border-0 text-center p-3 shadow-sm">
                  <div className="display-4 mb-3">{category.icon}</div>
                  <h5>{category.name}</h5>
                  <small className="text-muted">{category.count} бараа</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-5 bg-primary text-white">
        <div className="container">
          <div className="row text-center">
            <div className="col-md-3">
              <p>Идэвхтэй хэрэглэгч</p>
            </div>
            <div className="col-md-3">
              <p>Идэвхтэй дуудлага</p>
            </div>
            <div className="col-md-3">
              <p>Сэтгэл хангалуун байдал</p>
            </div>
            <div className="col-md-3">
              <p>Өдрийн шинэ дуудлага</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};


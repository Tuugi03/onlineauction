import React from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaChartLine, FaHandshake, FaAward } from 'react-icons/fa';
import { MdSecurity, MdSupportAgent } from 'react-icons/md';

export const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero bg-primary text-white py-5">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">Бидний тухай</h1>
              <p className="lead mb-4">
                Бид нь Монголын хамгийн найдвартай, илүүдэлгүй дуудлага худалдааны платформ юм.
              </p>
              <div className="d-flex gap-3">
                <Link to="/allproduct" className="btn btn-light btn-lg px-4">
                  Дуудлага худалдааны жагсаалт
                </Link>
                <Link to="/contact" className="btn btn-outline-light btn-lg px-4">
                  Холбоо барих
                </Link>
              </div>
            </div>
            <div className="col-lg-6 d-none d-lg-block">
              <img 
                src="/images/about-hero.png" 
                alt="About Us" 
                className="img-fluid rounded-3 shadow"
              />
            </div>
          </div>
        </div>
      </section>

   

      {/* Stats Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row g-4 text-center">
            <div className="col-md-4">
              <div className="p-4 bg-white rounded-3 shadow-sm h-100">
                <FaUsers className="display-4 text-primary mb-3" />
                <h3 className="fw-bold">100,000+</h3>
                <p className="mb-0">Хэрэглэгч</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-4 bg-white rounded-3 shadow-sm h-100">
                <FaHandshake className="display-4 text-primary mb-3" />
                <h3 className="fw-bold">50,000+</h3>
                <p className="mb-0">Амжилттай худалдаа</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-4 bg-white rounded-3 shadow-sm h-100">
                <FaChartLine className="display-4 text-primary mb-3" />
                <h3 className="fw-bold">₮50 тэрбум+</h3>
                <p className="mb-0">Нийт худалдааны хэмжээ</p>
              </div>
            </div>
          </div>
        </div>
      </section>

  
     

     
    </div>
  );
};


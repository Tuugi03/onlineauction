import "../../index.css";

export const Footer = () => {
  return (
    <footer className="footer text-white text-center py-3 mt-5">
      <p className="mb-0"> {new Date().getFullYear()} AUCTIONHUB</p>
    </footer>
  );
};

export default Footer;

import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/search/search?q=${encodeURIComponent(query)}`
      );
      setResults(response.data.products);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  return (
    <div className="position-relative">
      <input
        type="text"
        className="form-control form-control-lg border-primary"
        placeholder="Хайх барааны нэр..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
      />

      {showResults && (
        <div className="position-absolute w-100 bg-white shadow-sm mt-1 rounded">
          {loading ? (
            <div className="p-2 text-muted">Хайж байна...</div>
          ) : results.length > 0 ? (
            <ul className="list-unstyled mb-0">
              {results.map((product) => (
                <li key={product._id}>
                  <Link
                    to={`/products/${product._id}`}
                    className="d-block p-2 text-decoration-none text-dark hover-primary"
                  >
                    {product.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : searchQuery.length > 1 ? (
            <div className="p-2 text-muted">Илэрц олдсонгүй</div>
          ) : null}
        </div>
      )}
    </div>
  );
};
import "bootstrap/dist/css/bootstrap.min.css";
import "../../index.css";

export const Home = () => {
  return (
    <div className="container text-center mt-5">
      <h1 className="display-4 mb-4">Дуудлага худалдааны цахим шийдэл</h1>
      <div className="input-group mx-auto" style={{maxWidth: "700px"}}>
        <input 
          type="text" 
          className="form-control form-control-lg" 
          placeholder="Хайж буй бараагаа энд бичнэ үү"
        />
        <button className="btn btn-primary" type="button">
          Хайх
        </button>
      </div>
      
      
    </div>
  );
};
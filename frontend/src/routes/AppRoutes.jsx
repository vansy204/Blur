import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Signin from "../Components/Register/Signin";
import Home from "../Components/Home/Home";
import Signup from "../Components/Register/Signup";


const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Signin />} />
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
import {
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Signin from "../Components/Register/Signin";
import Signup from "../Components/Register/Signup";
import { Sidebar } from "../Components/sidebar/Sidebar";
import Home from "../Components/Home/Home";

const AppRoutes = () => {
  const location = useLocation();
  return (
    <div>
      {location.pathname !== "/login" && location.pathname !== "/signup" && (
        <div className="flex">
          <div className="w-[20%] border border-;-slate-500">
            <Sidebar />
          </div>
          <div className="w-full">
            <Routes>
              <Route path="/" element={<Home/>}></Route>
            </Routes>
          </div>
        </div>
      )}
      {(location.pathname === "/login" || location.pathname === "/signup") && (
        <div>
          <Routes>
            <Route path="/signup" element={<Signup />}></Route>
            <Route path="/login" element={<Signin />}></Route>
          </Routes>
        </div>
      )}
    </div>
  );
};

export default AppRoutes;

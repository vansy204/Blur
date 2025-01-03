
import './App.css';
import Authenticate from './Components/Register/authenticate';
import { Sidebar } from './Components/sidebar/Sidebar';

import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <div className="App">
      
      <AppRoutes/>  
     {/* <UserProfile/> */}
    </div>
  );
}

export default App;

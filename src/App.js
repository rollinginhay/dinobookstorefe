import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './layout';
import './App.css'
import Home from './page/home/home';
import { PATH_NAME } from './constant/path';

function App() {
  return (
    <Router>
      <Routes>
        <Route path={PATH_NAME.LAYOUT} element={<Layout />}>
          <Route index element={<Home/>}/>
        </Route>
      </Routes> 
    </Router>
  );
}

export default App;

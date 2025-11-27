import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Index from './pages/Index';
import Resources from './pages/Resources';
import Decision from './pages/Decision';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path='/resources' element={<Resources />} />
          <Route path="/index" element={<Index />} />
          <Route path="/decision" element={<Decision />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

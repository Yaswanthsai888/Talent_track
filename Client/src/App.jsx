import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/index';
import Navbar from './components/navigation/Navbar.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

// Import global styles
import './styles/global.css';
import './styles/index.css';
import './styles/components.css';
import './styles/dashboard.css';

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <AppRoutes />
          </main>
        </div>
      </BrowserRouter>
    </Provider>
  );
};

export default App;

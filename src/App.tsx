import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import CustomersPage from './pages/CustomersPage';
import TrainingsPage from './pages/TrainingsPage';
import CalendarPage from './pages/CalendarPage';


function App() {
  return (
    <div className="app-container">
      <Router>
        <Navbar />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Navigate to="/customers" replace />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/trainings" element={<TrainingsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />

          </Routes>
        </main>
      </Router>
    </div>
  );
}

export default App;

import React, { useState } from 'react';
import NavBar from './components/NavBar';
import RulesPage from './pages/RulesPage';
import OverridesPage from './pages/OverridesPage';
import PlannerPage from './pages/PlannerPage';
import DevToolsPage from './pages/DevToolsPage';

function App() {
  const [currentPage, setCurrentPage] = useState('planner');

  return (
    <div>
      {/* 2. Use the new NavBar component */}
      <NavBar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <main>
        {/* The content below the navbar will change based on the state */}
        {currentPage === 'planner' && <PlannerPage />}
        {currentPage === 'rules' && <RulesPage />}
        {currentPage === 'overrides' && <OverridesPage />}
        {currentPage === 'dev' && <DevToolsPage />}
      </main>
    </div>
  );
}

export default App;
import React, { useState } from 'react';
import NavBar from './components/NavBar';
import RulesPage from './pages/RulesPage';
import OverridesPage from './pages/OverridesPage';
import PlannerPage from './pages/PlannerPage';
import DevToolsPage from './pages/DevToolsPage';
import ScheduleBuilderPage from './pages/ScheduleBuilderPage';

function App() {
  const [currentPage, setCurrentPage] = useState('planner');

  return (
    <div>
      <NavBar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <main>
        {currentPage === 'planner' && <PlannerPage />}
        {currentPage === 'schedule' && <ScheduleBuilderPage />}
        {currentPage === 'rules' && <RulesPage />}
        {currentPage === 'overrides' && <OverridesPage />}
        {currentPage === 'dev' && <DevToolsPage />}
      </main>
    </div>
  );
}

export default App;
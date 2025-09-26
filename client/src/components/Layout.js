import React, { useState } from 'react';
import NavBar from './NavBar';
import PlannerPage from '../pages/student/PlannerPage';
import ScheduleBuilderPage from '../pages/student/ScheduleBuilderPage';
import RulesPage from '../pages/admin/RulesPage';
import OverridesPage from '../pages/admin/OverridesPage';
import DevToolsPage from '../pages/dev/DevToolsPage';

const Layout = ({ semestersToSchedule, setSemestersToSchedule }) => {
  const [currentPage, setCurrentPage] = useState('planner');

  const renderPage = () => {
    switch (currentPage) {
      case 'planner': 
        return <PlannerPage setSemestersToSchedule={setSemestersToSchedule} setCurrentPage={setCurrentPage} />;
      case 'schedule': 
        return <ScheduleBuilderPage semesters={semestersToSchedule} />;
      case 'rules': return <RulesPage />;
      case 'overrides': return <OverridesPage />;
      case 'dev': return <DevToolsPage />;
      default: return <PlannerPage />;
    }
  };

  return (
    <div>
      <NavBar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main>
        {renderPage()}
      </main>
    </div>
  );
};

export default Layout;
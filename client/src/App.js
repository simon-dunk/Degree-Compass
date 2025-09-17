import React from 'react';
import RulesPage from './pages/RulesPage';
import OverridesPage from './pages/OverridesPage';
import PlannerPage from './pages/PlannerPage'; // 1. Import the new page

function App() {
  return (
    <div className="App">
      {/* Student View */}
      <PlannerPage />

      {/* Admin Views */}
      <hr style={{ margin: '4rem 0', border: '2px solid #005826' }} />
      <RulesPage />
      <hr style={{ margin: '4rem 0', border: '2px solid #005826' }} />
      <OverridesPage />
    </div>
  );
}

export default App;
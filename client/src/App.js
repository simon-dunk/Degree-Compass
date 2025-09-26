import React, { useState } from 'react';
import Layout from './components/Layout';

function App() {
  const [semestersToSchedule, setSemestersToSchedule] = useState([]);

  return (
    <div className="App">
      <Layout 
        semestersToSchedule={semestersToSchedule}
        setSemestersToSchedule={setSemestersToSchedule}
      />
    </div>
  );
}

export default App;
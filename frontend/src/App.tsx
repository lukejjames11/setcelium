import { useState } from 'react';
import GraphView from './GraphView';
import AddDataPanel from './AddDataPanel';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div>
      <GraphView refreshTrigger={refreshTrigger} />
      <AddDataPanel onDataAdded={() => setRefreshTrigger((t) => t + 1)} />
    </div>
  );
}

export default App;
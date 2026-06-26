import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Vehicles } from './pages/Vehicles';
import { ActiveRentals } from './pages/ActiveRentals';
import { CompletedRentals } from './pages/CompletedRentals';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Maintenance } from './pages/Maintenance';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/rentals" element={<ActiveRentals />} />
          <Route path="/completed" element={<CompletedRentals />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Car, Fuel, PenTool as Tool, Calendar } from 'lucide-react';
import VehicleList from './components/VehicleList';
import FuelLogs from './components/FuelLogs';
import ServiceRecords from './components/ServiceRecords';
import ServiceSchedule from './components/ServiceSchedule';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Car className="h-8 w-8 text-blue-600" />
                  <span className="ml-2 text-xl font-bold text-gray-800">Fleet Manager</span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link to="/" className="flex items-center px-3 py-2 text-sm font-medium text-gray-900">
                    <Car className="h-5 w-5 mr-1" />
                    Vehicles
                  </Link>
                  <Link to="/fuel" className="flex items-center px-3 py-2 text-sm font-medium text-gray-900">
                    <Fuel className="h-5 w-5 mr-1" />
                    Fuel Logs
                  </Link>
                  <Link to="/service" className="flex items-center px-3 py-2 text-sm font-medium text-gray-900">
                    <Tool className="h-5 w-5 mr-1" />
                    Service Records
                  </Link>
                  <Link to="/schedule" className="flex items-center px-3 py-2 text-sm font-medium text-gray-900">
                    <Calendar className="h-5 w-5 mr-1" />
                    Service Schedule
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<VehicleList />} />
            <Route path="/fuel" element={<FuelLogs />} />
            <Route path="/service" element={<ServiceRecords />} />
            <Route path="/schedule" element={<ServiceSchedule />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
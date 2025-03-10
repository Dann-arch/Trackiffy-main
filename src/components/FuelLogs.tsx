import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X } from 'lucide-react';

interface FuelLog {
  id: string;
  vehicle_id: string;
  fuel_amount: number;
  cost_per_unit: number;
  total_cost: number;
  mileage: number;
  fuel_type: string;
  created_at: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
  };
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
}

interface FuelLogFormData {
  vehicle_id: string;
  fuel_amount: string;
  cost_per_unit: string;
  mileage: string;
  fuel_type: string;
}

export default function FuelLogs() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FuelLogFormData>({
    vehicle_id: '',
    fuel_amount: '',
    cost_per_unit: '',
    mileage: '',
    fuel_type: 'regular'
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchFuelLogs();
    fetchVehicles();
  }, []);

  async function fetchVehicles() {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, year')
        .eq('status', 'active')
        .order('make');

      if (error) throw error;
      setVehicles(data || []);
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, vehicle_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  }

  async function fetchFuelLogs() {
    try {
      const { data, error } = await supabase
        .from('fuel_logs')
        .select(`
          *,
          vehicle:vehicles(make, model, year)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFuelLogs(data || []);
    } catch (error) {
      console.error('Error fetching fuel logs:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');

    // Calculate total cost when either amount or cost per unit changes
    if (name === 'fuel_amount' || name === 'cost_per_unit') {
      const amount = name === 'fuel_amount' ? parseFloat(value) : parseFloat(formData.fuel_amount);
      const costPerUnit = name === 'cost_per_unit' ? parseFloat(value) : parseFloat(formData.cost_per_unit);
      
      if (!isNaN(amount) && !isNaN(costPerUnit)) {
        const total = (amount * costPerUnit).toFixed(2);
        document.getElementById('total-cost')!.textContent = `$${total}`;
      }
    }
  };

  const validateForm = () => {
    if (!formData.vehicle_id) {
      setError('Please select a vehicle');
      return false;
    }

    const amount = parseFloat(formData.fuel_amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid fuel amount');
      return false;
    }

    const cost = parseFloat(formData.cost_per_unit);
    if (isNaN(cost) || cost <= 0) {
      setError('Please enter a valid cost per unit');
      return false;
    }

    const mileage = parseInt(formData.mileage);
    if (isNaN(mileage) || mileage < 0) {
      setError('Please enter a valid mileage');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const amount = parseFloat(formData.fuel_amount);
      const costPerUnit = parseFloat(formData.cost_per_unit);
      const totalCost = amount * costPerUnit;

      const { error } = await supabase
        .from('fuel_logs')
        .insert([{
          vehicle_id: formData.vehicle_id,
          fuel_amount: amount,
          cost_per_unit: costPerUnit,
          total_cost: totalCost,
          mileage: parseInt(formData.mileage),
          fuel_type: formData.fuel_type
        }]);

      if (error) throw error;

      setShowForm(false);
      setFormData({
        vehicle_id: vehicles[0]?.id || '',
        fuel_amount: '',
        cost_per_unit: '',
        mileage: '',
        fuel_type: 'regular'
      });
      fetchFuelLogs();
    } catch (error) {
      console.error('Error adding fuel log:', error);
      setError('Failed to add fuel log. Please try again.');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Fuel Consumption Logs</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-1" />
          Add Fuel Log
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Fuel Log</h3>
              <button 
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vehicle *
                  </label>
                  <select
                    name="vehicle_id"
                    value={formData.vehicle_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    {vehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fuel Amount (L) *
                  </label>
                  <input
                    type="number"
                    name="fuel_amount"
                    value={formData.fuel_amount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cost per Liter ($) *
                  </label>
                  <input
                    type="number"
                    name="cost_per_unit"
                    value={formData.cost_per_unit}
                    onChange={handleInputChange}
                    step="0.001"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total Cost
                  </label>
                  <div id="total-cost" className="mt-1 text-lg font-semibold">
                    $0.00
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Current Mileage (km) *
                  </label>
                  <input
                    type="number"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fuel Type
                  </label>
                  <select
                    name="fuel_type"
                    value={formData.fuel_type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="regular">Regular</option>
                    <option value="premium">Premium</option>
                    <option value="diesel">Diesel</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Add Fuel Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200">
        {loading ? (
          <div className="p-4 text-center">Loading fuel logs...</div>
        ) : fuelLogs.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No fuel logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fuel Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mileage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fuelLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.vehicle.year} {log.vehicle.make} {log.vehicle.model}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.fuel_amount} L
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${log.total_cost.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.mileage.toLocaleString()} km
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
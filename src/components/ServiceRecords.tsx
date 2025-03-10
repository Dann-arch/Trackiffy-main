import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, PenTool as Tool } from 'lucide-react';

interface ServiceRecord {
  id: string;
  vehicle_id: string;
  service_date: string;
  service_type: string;
  description: string;
  cost: number;
  mileage: number;
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

interface ServiceFormData {
  vehicle_id: string;
  service_date: string;
  service_type: string;
  description: string;
  cost: string;
  mileage: string;
}

export default function ServiceRecords() {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>({
    vehicle_id: '',
    service_date: new Date().toISOString().split('T')[0],
    service_type: 'maintenance',
    description: '',
    cost: '',
    mileage: ''
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchServiceRecords();
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

  async function fetchServiceRecords() {
    try {
      const { data, error } = await supabase
        .from('service_records')
        .select(`
          *,
          vehicle:vehicles(make, model, year)
        `)
        .order('service_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching service records:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.vehicle_id || !formData.service_type || !formData.description) {
      setError('Please fill in all required fields');
      return false;
    }

    const cost = parseFloat(formData.cost);
    if (isNaN(cost) || cost < 0) {
      setError('Please enter a valid cost');
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
      const { error } = await supabase
        .from('service_records')
        .insert([{
          vehicle_id: formData.vehicle_id,
          service_date: formData.service_date,
          service_type: formData.service_type,
          description: formData.description,
          cost: parseFloat(formData.cost),
          mileage: parseInt(formData.mileage)
        }]);

      if (error) throw error;

      setShowForm(false);
      setFormData({
        vehicle_id: vehicles[0]?.id || '',
        service_date: new Date().toISOString().split('T')[0],
        service_type: 'maintenance',
        description: '',
        cost: '',
        mileage: ''
      });
      fetchServiceRecords();
    } catch (error) {
      console.error('Error adding service record:', error);
      setError('Failed to add service record. Please try again.');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Service Records</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-1" />
          Add Service Record
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Service Record</h3>
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
                    Service Date *
                  </label>
                  <input
                    type="date"
                    name="service_date"
                    value={formData.service_date}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Service Type *
                  </label>
                  <select
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="repair">Repair</option>
                    <option value="inspection">Inspection</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cost ($) *
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mileage (km) *
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
                  Add Service Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200">
        {loading ? (
          <div className="p-4 text-center">Loading service records...</div>
        ) : records.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No service records found</div>
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
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
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
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(record.service_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.vehicle.year} {record.vehicle.make} {record.vehicle.model}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        record.service_type === 'maintenance' 
                          ? 'bg-green-100 text-green-800'
                          : record.service_type === 'repair'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {record.service_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{record.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${record.cost.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.mileage.toLocaleString()} km
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
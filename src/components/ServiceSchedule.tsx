import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface ScheduledService {
  id: string;
  vehicle_id: string;
  service_type: string;
  description: string;
  due_date: string;
  estimated_cost: number;
  status: string;
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

interface ScheduleFormData {
  vehicle_id: string;
  service_type: string;
  description: string;
  due_date: string;
  estimated_cost: string;
}

export default function ServiceSchedule() {
  const [schedules, setSchedules] = useState<ScheduledService[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ScheduleFormData>({
    vehicle_id: '',
    service_type: 'maintenance',
    description: '',
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    estimated_cost: ''
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchScheduledServices();
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

  async function fetchScheduledServices() {
    try {
      const { data, error } = await supabase
        .from('service_schedule')
        .select(`
          *,
          vehicle:vehicles(make, model, year)
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching scheduled services:', error);
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

    const cost = parseFloat(formData.estimated_cost);
    if (isNaN(cost) || cost < 0) {
      setError('Please enter a valid estimated cost');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const { error } = await supabase
        .from('service_schedule')
        .insert([{
          vehicle_id: formData.vehicle_id,
          service_type: formData.service_type,
          description: formData.description,
          due_date: formData.due_date,
          estimated_cost: parseFloat(formData.estimated_cost),
          status: 'pending'
        }]);

      if (error) throw error;

      setShowForm(false);
      setFormData({
        vehicle_id: vehicles[0]?.id || '',
        service_type: 'maintenance',
        description: '',
        due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        estimated_cost: ''
      });
      fetchScheduledServices();
    } catch (error) {
      console.error('Error adding scheduled service:', error);
      setError('Failed to add scheduled service. Please try again.');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Service Schedule</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-1" />
          Schedule Service
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Schedule New Service</h3>
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
                    Due Date *
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
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
                    <option value="inspection">Inspection</option>
                    <option value="oil_change">Oil Change</option>
                    <option value="tire_rotation">Tire Rotation</option>
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
                    Estimated Cost ($) *
                  </label>
                  <input
                    type="number"
                    name="estimated_cost"
                    value={formData.estimated_cost}
                    onChange={handleInputChange}
                    step="0.01"
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
                  Schedule Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200">
        {loading ? (
          <div className="p-4 text-center">Loading scheduled services...</div>
        ) : schedules.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No scheduled services found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(schedule.due_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {schedule.vehicle.year} {schedule.vehicle.make} {schedule.vehicle.model}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        schedule.service_type === 'maintenance' 
                          ? 'bg-green-100 text-green-800'
                          : schedule.service_type === 'inspection'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {schedule.service_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{schedule.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${schedule.estimated_cost.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        schedule.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : schedule.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {schedule.status}
                      </span>
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
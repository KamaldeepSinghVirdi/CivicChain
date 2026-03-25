import { FiAlertCircle, FiClock, FiCheckCircle, FiUsers } from 'react-icons/fi';

// Mock data for recent grievances (same as before)
const recentGrievances = [
  { id: 1, title: 'Broken streetlight', location: 'Main St & 5th Ave', status: 'pending', date: '2025-03-05' },
  { id: 2, title: 'Pothole on road', location: 'Elm Street', status: 'in-progress', date: '2025-03-04' },
  { id: 3, title: 'Garbage not collected', location: 'Park View Colony', status: 'resolved', date: '2025-03-03' },
  { id: 4, title: 'Water leakage', location: 'Lake Side', status: 'pending', date: '2025-03-02' },
];

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
      {status}
    </span>
  );
};

function DashboardHome() {
  return (
    <>
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <FiAlertCircle className="text-2xl text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Grievances</p>
              <p className="text-2xl font-semibold text-gray-900">1,234</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <FiClock className="text-2xl text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">423</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <FiCheckCircle className="text-2xl text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="text-2xl font-semibold text-gray-900">678</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <FiUsers className="text-2xl text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Registered Users</p>
              <p className="text-2xl font-semibold text-gray-900">5,678</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart placeholder */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Grievances Overview</h3>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center text-gray-400">
            [Chart Placeholder] – Grievances per day/week
          </div>
        </div>

        {/* Recent grievances */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Grievances</h3>
          <ul className="space-y-4">
            {recentGrievances.map((g) => (
              <li key={g.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">{g.title}</p>
                    <p className="text-sm text-gray-500">{g.location}</p>
                    <p className="text-xs text-gray-400 mt-1">{g.date}</p>
                  </div>
                  <StatusBadge status={g.status} />
                </div>
              </li>
            ))}
          </ul>
          <a href="#" className="block text-center text-sm text-blue-600 mt-4 hover:underline">
            View all grievances →
          </a>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Add New Grievance
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
            Generate Report
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
            Manage Users
          </button>
        </div>
      </div>
    </>
  );
}

export default DashboardHome;
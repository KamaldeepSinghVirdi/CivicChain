import { FiAlertCircle, FiClock, FiCheckCircle, FiPlusCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Mock user grievances
const userGrievances = [
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

function UserHome() {
  // Mock counts
  const total = userGrievances.length;
  const pending = userGrievances.filter(g => g.status === 'pending').length;
  const inProgress = userGrievances.filter(g => g.status === 'in-progress').length;
  const resolved = userGrievances.filter(g => g.status === 'resolved').length;

  return (
    <>
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <FiAlertCircle className="text-2xl text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Grievances</p>
              <p className="text-2xl font-semibold text-gray-900">{total}</p>
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
              <p className="text-2xl font-semibold text-gray-900">{pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <FiClock className="text-2xl text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">{inProgress}</p>
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
              <p className="text-2xl font-semibold text-gray-900">{resolved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent grievances */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Grievances</h3>
          <Link to="/user/my-grievances" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-gray-100">
          {userGrievances.slice(0, 3).map((g) => (
            <li key={g.id} className="py-3 first:pt-0 last:pb-0">
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
      </div>

      {/* Quick action */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Report a New Issue</h3>
        <p className="text-gray-600 mb-4">Help improve your community by reporting civic issues.</p>
        <Link
          to="/user/submit"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlusCircle className="mr-2" />
          Submit Grievance
        </Link>
      </div>
    </>
  );
}

export default UserHome;
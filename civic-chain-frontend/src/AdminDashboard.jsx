import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  FiHome, 
  FiAlertCircle, 
  FiUsers, 
  FiSettings, 
  FiLogOut,
  FiMenu,
  FiSearch,
  FiBell
} from 'react-icons/fi';

function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigation items
  const navItems = [
    { path: '/admin', icon: FiHome, label: 'Dashboard' },
    { path: '/admin/grievances', icon: FiAlertCircle, label: 'Grievances' },
    { path: '/admin/users', icon: FiUsers, label: 'Users' },
    { path: '/admin/settings', icon: FiSettings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar - desktop */}
      <aside className={`
        fixed inset-y-0 left-0 transform 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:relative lg:translate-x-0 transition duration-200 ease-in-out
        w-64 bg-gradient-to-b from-blue-900 to-green-900 text-white
        flex flex-col z-30
      `}>
        <div className="p-6">
          <h2 className="text-2xl font-bold">Civic Chain</h2>
          <p className="text-sm text-blue-200 mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'} // only exact match for dashboard
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isActive 
                    ? 'bg-white/10' 
                    : 'hover:bg-white/10'
                }`
              }
              onClick={() => setSidebarOpen(false)} // close sidebar on mobile after navigation
            >
              <item.icon className="text-xl" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/20">
          <button
            onClick={() => alert('Logout – to be implemented')}
            className="flex items-center space-x-3 px-4 py-3 w-full hover:bg-white/10 rounded-lg transition"
          >
            <FiLogOut className="text-xl" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <FiMenu className="text-2xl" />
            </button>
            <div className="relative hidden md:block">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => alert('Notifications – to be implemented')}
              className="relative p-2 text-gray-600 hover:text-gray-900"
            >
              <FiBell className="text-xl" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center space-x-3">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                alt="Admin" 
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700">John Doe</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area – where nested routes render */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
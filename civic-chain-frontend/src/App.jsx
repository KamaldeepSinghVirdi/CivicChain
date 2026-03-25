import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Signup from './Signup';
import Signin from './Signin';
import AdminDashboard from './AdminDashboard';
import DashboardHome from './DashboardHome';
import Grievances from './Grievances';
import Users from './Users';
import Settings from './Settings';
import UserDashboard from './UserDashboard';
import UserHome from './UserHome';
import MyGrievances from './MyGrievances';
import SubmitGrievance from './SubmitGrievance';
import UserProfile from './UserProfile';
import UserSettings from './UserSettings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Admin routes */}
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<DashboardHome />} />
          <Route path="grievances" element={<Grievances />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* User routes */}
        <Route path="/user" element={<UserDashboard />}>
          <Route index element={<UserHome />} />
          <Route path="my-grievances" element={<MyGrievances />} />
          <Route path="submit" element={<SubmitGrievance />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="settings" element={<UserSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
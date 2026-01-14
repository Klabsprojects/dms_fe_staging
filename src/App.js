import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import the API interceptor - this sets up global session handling
import './services/apiInterceptor';
import MastersPage from './pages/Masters';
import Header from './components/Header';
import DietPlanner from './components/Dietplanner';
import Dashboard from './components/Dashboard';
import IndentCreation from './components/Indent';
import UserCreation from './components/UserCreation';
import LoginPage from './pages/LoginPage';
import AttendanceCreation from './pages/Attendance';
import IndentApproval from './pages/IndentApproval';
import IndentListing from './pages/AdminIndent';
import DispatchOrder from './pages/DispatchOrder'; // New import
import Items from './pages/Item';
import GrnPage from './pages/GrmPage';
import Stores from './pages/Stores';
import Stock from './pages/Stock';
import StockUpdate from './pages/StockUpdate';
import DietPlan from './pages/DietPlan';
import Diet from './pages/Diet';
import SimplifiedDashboardNew from './pages/DashboardNew';
import UserManagementNew from './pages/UserCreationNew';
import Settings from './pages/Password';
import DeletePc from './components/DeletePc';
import DeletePurchaseConfirmationPage from './components/PcDelete';
import Pie from './components/Pie';
import RequestPopup from './components/RequestPopup';
import RaisedIndnets from './pages/RaisedIndents';
import Billing from './pages/Billing';
import StoreUpdateForm from './pages/StoreUpdate';
import ItemSelection from './components/ItemSelection';
import BranchStores from './pages/BranchStores';


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);

    // Listen for storage changes (when user logs out in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'authToken') {
        setIsAuthenticated(!!e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && <Header />}

        <main className={isAuthenticated ? "max-w-7xl mx-auto px-4 py-8" : ""}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <DietPlanner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/masters"
              element={
                <ProtectedRoute>
                  <MastersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/item"
              element={
                <ProtectedRoute>
                  <Items />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <AttendanceCreation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/indent-request"
              element={
                <ProtectedRoute>
                  <IndentListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/indent"
              element={
                <ProtectedRoute>
                  <IndentCreation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-creation"
              element={
                <ProtectedRoute>
                  <UserCreation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/indent-approval"
              element={
                <ProtectedRoute>
                  <IndentApproval />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pie-chart"
              element={
                <ProtectedRoute>
                  <Pie />
                </ProtectedRoute>
              }
            />
            <Route
              path="/grn"
              element={
                <ProtectedRoute>
                  <GrnPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/diet"
              element={
                <ProtectedRoute>
                  <Diet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/usernew"
              element={
                <ProtectedRoute>
                  <UserManagementNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Dashboradnew"
              element={
                <ProtectedRoute>
                  <SimplifiedDashboardNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stores"
              element={
                <ProtectedRoute>
                  <Stores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/diet-plan"
              element={
                <ProtectedRoute>
                  <DietPlan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/password-change"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/delete-purchase-Confirmation"
              element={
                <ProtectedRoute>
                  <DeletePc />
                </ProtectedRoute>
              }
            />
            <Route
              path="/delete-PC"
              element={
                <ProtectedRoute>
                  <DeletePurchaseConfirmationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stocks"
              element={
                <ProtectedRoute>
                  <Stock />
                </ProtectedRoute>
              }
            />
            <Route
              path="Stock-Update"
              element={
                <ProtectedRoute>
                  <StockUpdate />
                </ProtectedRoute>
              }
            />
            <Route
              path="indents-raised"
              element={
                <ProtectedRoute>
                  <RaisedIndnets />
                </ProtectedRoute>
              }
            />
            <Route
              path="Billing"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />
            <Route
              path="Reqest-cancel"
              element={
                <ProtectedRoute>
                  <RequestPopup />
                </ProtectedRoute>
              }
            />
            <Route
              path="Items-Update"
              element={
                <ProtectedRoute>
                  <StoreUpdateForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="Item-selection"
              element={
                <ProtectedRoute>
                  <ItemSelection />
                </ProtectedRoute>
              }
            />
            {/* New Dispatch Order Route */}
            <Route
              path="/dispatch-order/:id"
              element={
                <ProtectedRoute>
                  <DispatchOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branch-stores"
              element={
                <ProtectedRoute>
                  <BranchStores />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
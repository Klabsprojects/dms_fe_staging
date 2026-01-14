import React, { useState, useEffect } from 'react';
import { Bell } from "lucide-react";
import Notification from "./Notification"; // adjust path if needed
import { useNavigate } from "react-router-dom";
import { List } from "lucide-react";

const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [showNotif, setShowNotif] = useState(false);
const [notificationCount, setNotificationCount] = useState(0);
const navigate = useNavigate();
const [openMenu, setOpenMenu] = useState(false);
  useEffect(() => {
    // Get user data from localStorage (matching your app's authentication pattern)
    const getUserData = () => {
      try {
        const userData = localStorage.getItem('user');
        const loginResponse = localStorage.getItem('loginResponse');

        // Try to get role from user data first
        if (userData) {
          const parsedUser = JSON.parse(userData);
          return parsedUser;
        }

        // Fallback to loginResponse if user data doesn't exist
        if (loginResponse) {
          const parsedResponse = JSON.parse(loginResponse);
          return parsedResponse;
        }

        return null;
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    };

    const userData = getUserData();
    if (userData && userData.role) {
      setUserRole(userData.role);
    }
  }, []);
const fetchNotificationCount = async () => {
  try {
    const token = typeof window !== 'undefined' && window.localStorage 
      ? window.localStorage.getItem("authToken") 
      : "demo-token";
      
    if (!token || token === "demo-token") {
      setNotificationCount(0);
      return;
    }

    const response = await fetch(
      "https://rcs-dms.onlinetn.com/api/v1//notifications",
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    if (!data.error && data.data) {
      // Count only unread notifications
      const unreadCount = data.data.filter(notification => notification.unread !== false).length;
      setNotificationCount(unreadCount);
    } else {
      setNotificationCount(0);
    }
  } catch (err) {
    console.error("Error fetching notification count:", err);
    setNotificationCount(0);
  }
};

// Add this useEffect to fetch count on mount and set interval
useEffect(() => {
  fetchNotificationCount();
  const interval = setInterval(fetchNotificationCount, 30000);
  return () => clearInterval(interval);
}, []);
  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
    setIsMobileMenuOpen(false); // Close mobile menu when profile opens
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsProfileOpen(false); // Close profile when mobile menu opens
  };

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('loginResponse');
    window.location.href = '/login';
    console.log('Logout functionality executed');
  };

  const [user, setUser] = useState(null);


  useEffect(() => {
    const getUserData = () => {
      try {
        const userData = localStorage.getItem('user');
        const loginResponse = localStorage.getItem('loginResponse');
        if (userData) {
          return JSON.parse(userData);
        }
        if (loginResponse) {
          return JSON.parse(loginResponse);
        }
        return null;
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    };

    const userData = getUserData();
    if (userData && userData.role) {
      setUserRole(userData.role);

      const fullResponse = localStorage.getItem('loginResponse');
      const mergedUser = fullResponse
        ? { ...userData, ...JSON.parse(fullResponse) }
        : userData;

      setUser(mergedUser);

      // ✅ Now safely check for logo after merge
      if (mergedUser.role === 'rcs-admin' || mergedUser.role === 'rcs-store') {
        setLogoUrl('/images/logo.png');
      } else if (mergedUser?.department?.logo) {
        setLogoUrl(`https://rcs-dms.onlinetn.com/public/${mergedUser.department.logo}`);
      } else {
        setLogoUrl('/images/logo.png'); // fallback
      }

      console.log('✅ userData stored in state:', mergedUser);
      console.log('✅ userData.department:', mergedUser?.department);
      console.log('user:', mergedUser);
      console.log('user.detail:', mergedUser.detail);
      console.log('user.detail.department:', mergedUser.detail?.department);
    }
  }, []);


  // Function to get navigation buttons based on role
  const getNavigationButtons = () => {
    const buttons = [];

    if (userRole === 'rcs-admin') {
      // For rcs-admin: show User, Items, and Indent Request
      buttons.push(
        <a
          key="dashboard"
          href="/dashboard"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="font-medium text-sm">Dashboard
          </span>
        </a>
      );
      buttons.push(
        <a
          key="user"
          href="/user-creation"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="font-medium text-sm">Department Profile
          </span>
        </a>
      );

      buttons.push(
        <a
          key="items"
          href="/item"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span className="font-medium text-sm">Items</span>
        </a>
      );
      buttons.push(
        <a
          key="stores"
          href="/stores"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h16l-1 5H5L4 4zM3 9h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
          </svg>

          <span className="font-medium text-sm">Stores</span>
        </a>
      );


      buttons.push(
        <a
          key="indent-request"
          href="/indent-request"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="font-medium text-sm">Indent</span>
        </a>
      );


    } else if (userRole === 'department') {
      // For department: show User, Masters, and Segment
       buttons.push(
        <a
          key="dashboard"
          href="/dashboard"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="font-medium text-sm">Dashboard
          </span>
        </a>
      );
      buttons.push(
        <a
          key="user"
          href="/user-creation"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="font-medium text-sm">Users
          </span>
        </a>
      );
 buttons.push(
        <a
          key="diet"
          href="/diet"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="font-medium text-sm">Diet</span>
        </a>
      );
       buttons.push(
        <a
          key="raised indents"
          href="/indents-raised"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
          <span className="font-medium text-sm">Raised
          </span>
        </a>
      );

      buttons.push(
        <a
          key="masters"
          href="/masters"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="font-medium text-sm">Masters</span>
        </a>
      );
      buttons.push(
        <a
          key="indent-request"
          href="/indent-request"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="font-medium text-sm">Indent</span>
        </a>
      );
              buttons.push(
        <a
          key="branch-stores"
          href="/branch-stores"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="font-medium text-sm">Stores
          </span>
        </a>
      );
    }
    else if (userRole === 'dep-rep') {
      // For department: show User, Masters, and Segment
        buttons.push(
        <a
          key="dashboard"
          href="/dashboard"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="font-medium text-sm">Dashboard
          </span>
        </a>
      );
      buttons.push(
        <a
          key="indent-request"
          href="/indent-request"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="font-medium text-sm">Indent</span>
        </a>
      );


    }
else if (userRole === 'all-fun') {
      buttons.push(
        <div key="all-fun-menus" className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <a href="/dashboard" className="flex items-center space-x-1 px-2 py-1 text-white hover:bg-white hover:bg-opacity-20 rounded transition-all duration-200"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg><span className="font-medium text-xs">Dashboard</span></a>
            <a href="/indent" className="flex items-center space-x-1 px-2 py-1 text-white hover:bg-white hover:bg-opacity-20 rounded transition-all duration-200"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span className="font-medium text-xs">Raising</span></a>
            <a href="/indent-approval" className="flex items-center space-x-1 px-2 py-1 text-white hover:bg-white hover:bg-opacity-20 rounded transition-all duration-200"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span className="font-medium text-xs">List</span></a>
            <a href="/stocks" className="flex items-center space-x-1 px-2 py-1 text-white hover:bg-white hover:bg-opacity-20 rounded transition-all duration-200"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 20h18M9 10v10m6-14v14" /></svg><span className="font-medium text-xs">Stocks</span></a>
               <a href="/grn" className="flex items-center space-x-1 px-2 py-1 text-white hover:bg-white hover:bg-opacity-20 rounded transition-all duration-200"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span className="font-medium text-xs">GRN</span></a>
            <a href="/attendance" className="flex items-center space-x-1 px-2 py-1 text-white hover:bg-white hover:bg-opacity-20 rounded transition-all duration-200"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span className="font-medium text-xs">Roll</span></a>
            <a href="/diet-plan" className="flex items-center space-x-1 px-2 py-1 text-white hover:bg-white hover:bg-opacity-20 rounded transition-all duration-200"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span className="font-medium text-xs">Plans</span></a>
          </div>
        </div>
      );
    }
else if (userRole === 'indent') {
  // For indent: show Indent Raising and Attendance
   buttons.push(
        <a
          key="dashboard"
          href="/dashboard"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="font-medium text-sm">Dashboard
          </span>
        </a>
      );
  buttons.push(
    <a
      key="indent-raising"
      href="/indent"
      className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="font-medium text-sm">Indent Raising</span>
    </a>
  );

  // Toggle button
  buttons.push(
    <div key="stock-diet-dropdown" className="relative">
      <button
        onClick={() => setOpenMenu(prev => !prev)}
        className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 20h18M9 10v10m6-14v14" />
        </svg>
        <span className="font-medium text-sm">Stock & Diet Roll</span>
        <svg className={`w-3 h-3 ml-1 transform transition-transform ${openMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {openMenu && (
        <div className="absolute bg-white text-gray-700 mt-2 rounded-lg shadow-lg w-40 z-50">
          <a
            href="/stocks"
            className="block px-4 py-2 hover:bg-sky-50 hover:text-sky-700 rounded-t-lg"
          >
            Stocks
          </a>
          <a
            href="/attendance"
            className="block px-4 py-2 hover:bg-sky-50 hover:text-sky-700 rounded-b-lg"
          >
            Diet Roll
          </a>
        </div>
      )}
    </div>
  );

  // Diet Plans stays separate
  buttons.push(
    <a
      key="diet-plan"
      href="/diet-plan"
      className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="font-medium text-sm">Diet Plans</span>
    </a>
  );
}
    else if (userRole === 'pay-cre') {

      buttons.push(
        <a
          key="indent-request"
          href="/indent-request"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="font-medium text-sm">Indent</span>
        </a>
      );
      buttons.push(
        <a
          key="stock"
          href="/stocks"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 20h18M9 10v10m6-14v14" />

          </svg>
          <span className="font-medium text-sm">Stocks</span>
        </a>
      );
      buttons.push(
    <a
  key="Bill"
  href="/Billing"
  className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
>
  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1V2H4z"></path>
    <path d="M14 8H8"></path>
    <path d="M16 12H8"></path>
    <path d="M13 16H8"></path>
  </svg>

  <span className="font-medium text-sm">Bills</span>
</a>

      );
    }

    else if (userRole === 'supply') {

      buttons.push(
        <a
          key="grn"
          href="/grn"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-medium text-sm">GRN</span>
        </a>
      );
      buttons.push(
        <a
          key="stock"
          href="/stocks"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 20h18M9 10v10m6-14v14" />

          </svg>
          <span className="font-medium text-sm">Stocks</span>
        </a>
      );

    }
    else if (userRole === 'payment') {
      // For payment: show Indent Ledger
      buttons.push(
        <a
          key="indent-ledger"
          href="/indent-ledger"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-sm">Indent Ledger</span>
        </a>
      );
      buttons.push(
        <a
          key="stock"
          href="/stocks"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 20h18M9 10v10m6-14v14" />

          </svg>
          <span className="font-medium text-sm">Stocks</span>
        </a>
      );
    }
    else if (userRole === 'rcs-store') {
      buttons.push(
        <a
          key="dashboard"
          href="/dashboard"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="font-medium text-sm">Dashboard
          </span>
        </a>
      );

      buttons.push(
        <a
          key="indent-request"
          href="/indent-request"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="font-medium text-sm">Indent</span>
        </a>
      );
      buttons.push(
        <a
          key="items"
          href="/item"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span className="font-medium text-sm">Items</span>
        </a>
      );
       buttons.push(
    <a
  key="Bill"
  href="/Billing"
  className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
>
  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1V2H4z"></path>
    <path d="M14 8H8"></path>
    <path d="M16 12H8"></path>
    <path d="M13 16H8"></path>
  </svg>

  <span className="font-medium text-sm">Bills</span>
</a>

      );

         buttons.push(
        <a
          key="branch-stores"
          href="/branch-stores"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="font-medium text-sm">Stores
          </span>
        </a>
      );
    } else if (userRole === 'ind-apr') {
      // For ind-apr: show Indent List and GRN
       buttons.push(
        <a
          key="dashboard"
          href="/dashboard"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="font-medium text-sm">Dashboard
          </span>
        </a>
      );
      buttons.push(
        <a
          key="indent-list"
          href="/indent-approval"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-medium text-sm">Indent List</span>
        </a>
      );

      buttons.push(
        <a
          key="grn"
          href="/grn"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="font-medium text-sm">GRN</span>
        </a>
      );
      buttons.push(
        <a
          key="stock"
          href="/stocks"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 20h18M9 10v10m6-14v14" />
          </svg>
          <span className="font-medium text-sm">Stocks</span>
        </a>
      );

buttons.push(
  <a
    key="item-selection"
    href="/Item-Selection"
    className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
  >
<List className="w-4 h-4" />
    <span className="font-medium text-sm">Items Selection</span>
  </a>
);


    } else {
      // For other roles: show default navigation
      buttons.push(
        <a
          key="segment"
          href="/create"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="font-medium text-sm">Diet Plan</span>
        </a>
      );

      buttons.push(
        <a
          key="indent"
          href="/indent"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-medium text-sm">Indent</span>
        </a>
      );

      buttons.push(
        <a
          key="user"
          href="/user-creation"
          className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="font-medium text-sm">Department Profile
          </span>
        </a>
      );
    }

    return buttons;
  };

  return (
    <header className="bg-[#1978B5] border-b border-[#146699] shadow-lg">
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">

          {/* Logo and Title Section */}
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            {/* Government Logo - Left */}
            {/* Department Logo - Dynamic */}
            {logoUrl && (
              <div className="flex-shrink-0">
                <img
                  src={logoUrl}
                  alt="Department Logo"
                  className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 object-contain rounded-md"
                />
              </div>
            )}


            {/* Title - Center */}
            <div className="min-w-0 flex-1">
              {(userRole === 'rcs-admin' || userRole === 'rcs-store') ? (
                <>
                  <h1 className="text-[10px] sm:text-sm lg:text-base xl:text-lg font-bold text-white leading-tight">
                    தமிழ்நாட்டின் கூட்டுறவு சங்கங்கள்
                  </h1>

                  <p className="text-[10px] sm:text-sm lg:text-base xl:text-lg text-white font-medium leading-tight">
                    TamilNadu Cooperative Societies
                  </p>
                </>

              ) : (
                <>
                  <h1 className="text-xs sm:text-base lg:text-lg xl:text-xl font-bold text-white leading-tight">
                    {user?.department?.banner_name || 'N/A'}
                  </h1>
              <h5 className="text-[8px] sm:text-xs lg:text-sm xl:text-base font-bold text-white leading-tight">
  {user?.department?.banner_name_ta || 'N/A'}
</h5>

                </>

              )}
            </div>

          </div>

          {/* Right Section - Navigation Buttons and Profile */}
          <div className="flex items-center space-x-3 flex-shrink-0">

            {/* Navigation Buttons (Desktop) */}
            <div className="hidden md:flex items-center space-x-2">
              {getNavigationButtons()}
            </div>

            {/* Mobile Navigation Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="flex items-center justify-center w-9 h-9 bg-white bg-opacity-90 hover:bg-opacity-100 text-sky-600 hover:text-sky-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                title="Menu"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Mobile Dropdown Menu */}
              {isMobileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-25"
                    onClick={toggleMobileMenu}
                  ></div>

                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    {/* Mobile Navigation Items */}
                    <div className="px-2 space-y-1">
                      {getNavigationButtons().map((button) => (
                        <div key={button.key} className="block" onClick={toggleMobileMenu}>
                          {React.cloneElement(button, {
                            className: "flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors duration-200 rounded-lg"
                          })}
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-2"></div>

                    {/* Logout Button for Mobile Menu */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-medium">Logout</span>
                    </button>


                  </div>
                </>
              )}
            </div>


            {/* Profile Icon with Dropdown (Desktop only) */}
            {/* Right Section - Notification + Profile */}
            <div className="flex items-center space-x-3">
<div className="relative">
  <button
    onClick={() => setShowNotif(true)}
    className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 
     text-white hover:text-gray-200 transition-all duration-200 
     focus:outline-none relative"
    title="Notifications"
  >
    <Bell className="w-5 h-5" />
    {notificationCount > 0 && (
      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
        {notificationCount > 99 ? '99+' : notificationCount}
      </div>
    )}
  </button>
</div>

              {/* 👤 Profile Icon */}
              <div className="relative hidden md:block">
<button
  onClick={toggleProfile}
  className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-white hover:text-gray-200 transition-all duration-200 focus:outline-none"
  title="Profile"
>
  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
</button>

                {/* Profile Dropdown (Desktop) */}
        {isProfileOpen && (
  <>
    <div
      className="fixed inset-0 z-40 bg-black bg-opacity-25"
      onClick={toggleProfile}
    ></div>

    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
      <div className="px-4 py-3 text-sm text-gray-800 space-y-1">
        <div className="font-semibold text-gray-900">
          {JSON.parse(localStorage.getItem('user'))?.name || 'N/A'}
        </div>
        <div className="text-gray-700">
          {JSON.parse(localStorage.getItem('user'))?.username || 'N/A'}
        </div>
      </div>

      <div className="border-t border-gray-200"></div>

      {/* Change Password Option */}
      <button
        onClick={() => navigate("/password-change")}
        className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
      >
        <svg
          className="w-5 h-5 mr-2 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 11c0-1.105.895-2 2-2s2 .895 2 2v2m-4 0h4m-6 0h.01M12 17h.01M17 16v1a3 3 0 01-3 3H7a3 3 0 01-3-3v-1a3 3 0 013-3h7a3 3 0 013 3z"
          />
        </svg>
        Change Password
      </button>

      <button
        onClick={handleLogout}
        className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 transition-colors duration-200 text-sm font-medium"
      >
        <svg
          className="w-5 h-5 mr-2 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        Logout
      </button>
    </div>
  </>
)}
              </div>
            </div>
            {/* Popup Notification Modal */}
            <Notification
              show={showNotif}
              onClose={() => setShowNotif(false)}
            />

        {/* Text before Logo */}
<div className="flex items-center space-x-3">
  <div className="text-right">
    <div className="text-right">
  <h1 className="text-xs sm:text-sm lg:text-base font-semibold text-white leading-tight">
    Kooturavu
  </h1>
 <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white leading-tight text-left">
  Santhai
</h2>
</div>
  </div>

  {/* Department Logo */}
  <div className="flex-shrink-0">
    <img
      src="/images/logo192.png"
      alt="Government Logo"
      className="h-20 w-20 sm:h-16 sm:w-16 lg:h-20 lg:w-20 object-contain rounded-md"
    />
  </div>
</div>

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
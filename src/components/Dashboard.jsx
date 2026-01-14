import React, { useEffect, useState, useRef } from 'react';
import {
  Users,
  ShoppingCart,
  CalendarDays,
  TrendingUp,
  Building2,
  BellDot,
  Package,
  Activity,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  FileText
} from 'lucide-react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import '../fonts/NotoSansTamil-VariableFont_wdth,wght-normal.js';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { enUS } from "date-fns/locale";
import PieComponent from './Pie.jsx';


const SimplifiedDashboard = () => {
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [storeData, setStoreData] = useState(null);
  const [orderReport, setOrderReport] = useState([]);
  const [recentIndents, setRecentIndents] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeDetails, setStoreDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [storesData, setStoresData] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('364'); // Default Prison Department
  const [branchesModalOpen, setBranchesModalOpen] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState(null);
  const [filteredIndents, setFilteredIndents] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');   // Default period
  const [customRange, setCustomRange] = useState({ start: null, end: null });
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);
  const [departments, setDepartments] = useState([]);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ]);
  const [customLabel, setCustomLabel] = useState(''); // for showing “Oct 1 – Oct 10”
const handleCardClick = (status) => {
  let params = new URLSearchParams();
  params.append('tab', status === 'pc' || status === 'invoice' || status === 'payment' ? 'received' : status);

  // Add filter for specific statuses
  if (status === 'pc') {
    params.append('filter', 'pc-pending');
  } else if (status === 'invoice') {
    params.append('filter', 'invoice-pending');
  } else if (status === 'payment') {
    params.append('filter', 'payment-pending');
  }

  // 🔥 FOR DEP-REP: Pass type, branch, and period
  if (userRole === 'dep-rep') {
    if (selectedType) {
      params.append('type', selectedType);
    }
    if (selectedBranch) {
      params.append('branch', selectedBranch);
    }
    
    // Handle period properly
    if (selectedPeriod) {
      if (selectedPeriod === "custom" && dateRange[0]?.startDate && dateRange[0]?.endDate) {
        const start = dateRange[0].startDate.toISOString().split("T")[0];
        const end = dateRange[0].endDate.toISOString().split("T")[0];
        params.append('period', `${start}:${end}`);
      } else if (selectedPeriod !== "custom") {
        params.append('period', selectedPeriod);
      }
    }
  } else {
    // For other roles (existing logic)
    if (selectedDistrict) {
      const selectedStoreObj = storesData.find(store => store.name === selectedDistrict);
      if (selectedStoreObj) {
        params.append('store', selectedStoreObj.name);
      }
    }

    if (selectedDepartment) {
      const selectedDept = departments.find(d => d.id === selectedDepartment);
      if (selectedDept) {
        params.append('department', selectedDept.name);
      }
    }

    // Add period filter
    if (selectedPeriod) {
      if (selectedPeriod === "custom" && dateRange[0]?.startDate && dateRange[0]?.endDate) {
        const start = dateRange[0].startDate.toISOString().split("T")[0];
        const end = dateRange[0].endDate.toISOString().split("T")[0];
        params.append('period', `${start}:${end}`);
      } else if (selectedPeriod !== "custom") {
        params.append('period', selectedPeriod);
      }
    }
  }

  navigate(`/indent-request?${params.toString()}`);
};
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.name || '');
      setUserRole(user.role || '');
    }
  }, []);

useEffect(() => {
  const fetchOrdersReport = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('⚠️ No authToken found for orders report.');
      return;
    }

    try {
      const response = await fetch(
        'https://rcs-dms.onlinetn.com/api/v1/indent/report/orders?department=364&period=thisMonth',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (response.ok && !result.error) {
        setOrderReport(result.data || []);
        console.log('✅ Orders report fetched from NEW API:', result.data);
      } else {
        console.error('❌ Orders API Error:', result.message || 'Unknown error');
      }

    } catch (err) {
      console.error('❌ Orders Report Fetch Failed:', err);
    }
  };

  fetchOrdersReport();
}, []);


  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('⚠️ No authToken found in localStorage.');
        return;
      }

      try {
        const response = await fetch(
          'https://rcs-dms.onlinetn.com/api/v1//master/report/store-data',
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();
        if (response.ok && !result.error) {
          setStoreData(result.data);
          console.log('✅ Dashboard data fetched:', result.data);
        } else {
          console.error('❌ API Error:', result.message || 'Unknown error');
        }
      } catch (err) {
        console.error('❌ Network/Server Error:', err);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCalendar]);

  useEffect(() => {
    const fetchRecentIndents = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('⚠️ No authToken found for recent indents.');
        return;
      }

      try {
        const response = await fetch(
          'https://rcs-dms.onlinetn.com/api/v1//indent/report/recent?limit=5',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const result = await response.json();
        if (response.ok && !result.error) {
          setRecentIndents(result.data || []);
          console.log('✅ Recent indents fetched:', result.data);
        } else {
          console.error('❌ Recent Indents API Error:', result.message || 'Unknown error');
        }
      } catch (err) {
        console.error('❌ Recent Indents Fetch Failed:', err);
      }
    };
    fetchRecentIndents();
  }, []);
  const totalOrders = orderReport.reduce((acc, item) => acc + (item.orders || 0), 0);
  const receivedOrders = orderReport.reduce((acc, item) => acc + (parseInt(item.received) || 0), 0);
  const dispatchedOrders = orderReport.reduce((acc, item) => acc + (parseInt(item.dispatched) || 0), 0);
  const completedOrders = orderReport.reduce((acc, item) => acc + (parseInt(item.completed) || 0), 0);
  const pcOrders = orderReport.reduce((acc, item) => acc + (parseInt(item.pc) || 0), 0);
  const invoiceOrders = orderReport.reduce((acc, item) => acc + (parseInt(item.invoice) || 0), 0);
  const paidOrders = orderReport.reduce((acc, item) => acc + (parseInt(item.paid) || 0), 0);

  // Calculate pending values
  const pendingOrders = totalOrders - receivedOrders;
  const pcPending = pcOrders - totalOrders;
  const invoicePending = invoiceOrders - totalOrders;
  const paymentPending = paidOrders - totalOrders;
  const summaryCards = [
    {
      key: 'approved',
      title: userRole === 'dep-rep' ? 'Order Placed' : 'Orders',
      value: `${receivedOrders}/${totalOrders}`,
      icon: <ShoppingCart className="w-7 h-7 text-emerald-600" />,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      key: 'dispatch',
      title: 'Dispatched',
      value: dispatchedOrders,
      icon: <Truck className="w-7 h-7 text-amber-600" />,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      key: 'received',
      title: 'Completed',
      value: completedOrders,
      icon: <FileText className="w-7 h-7 text-blue-600" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      key: 'pc',
      title: 'PC',
      // ✅ completedOrders - pcOrders / completedOrders
      value: `${completedOrders - pcOrders}/${completedOrders}`,
      icon: <FileText className="w-7 h-7 text-purple-600" />,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      key: 'invoice',
      title: 'Invoice',
      // ✅ pcOrders - invoiceOrders / pcOrders
      value: `${pcOrders - invoiceOrders}/${pcOrders}`,
      icon: <FileText className="w-7 h-7 text-pink-600" />,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      key: 'payment',
      title: 'Payment ',
      // ✅ invoiceOrders - paidOrders / invoiceOrders
      value: `${invoiceOrders - paidOrders}/${invoiceOrders}`,
      icon: <FileText className="w-7 h-7 text-green-600" />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
  ];
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Activity className="w-4 h-4 text-blue-500" />;
      default:
        return <BellDot className="w-4 h-4" />;
    }
  };

  const handleStoreClick = async (storeCode, storeName) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('⚠️ No authToken found.');
      return;
    }

    try {
      const response = await fetch(
        `https://rcs-dms.onlinetn.com/api/v1//master/detail/${storeCode}/store-data`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const result = await response.json();
      if (response.ok && !result.error) {
        setSelectedStore(storeName); // This shows user-friendly name in modal
        setStoreDetails(result.data || {});
        setIsModalOpen(true);
      } else {
        console.error('❌ Error fetching store details:', result.message);
      }
    } catch (err) {
      console.error('❌ Fetch failed:', err);
    }
  };
  const downloadStoreExcel = () => {
    if (!storeDetails || !storeDetails.items) return;

    // Prepare data for Excel
    const worksheetData = storeDetails.items.map((item, index) => ({
      "S.No": index + 1,
      "Item Name": `${item.name} ${item.unit ? `(${item.unit})` : ""}`,
      "Rate (₹)": item.rate,
      "Pack Size": `${item.pack || ""} ${item.pack_unit || ""}`,
    }));

    // Convert to worksheet
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Store Data");

    // Export as Excel
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `${selectedStore}_store_data.xlsx`);

  };
  const handleBranchClick = (store) => {
    if (store.branches && store.branches.length > 0) {
      setSelectedBranches({
        storeName: store.store,
        branches: store.branches
      });
      setBranchesModalOpen(true);
    }
  };
  const handlePriceItemsExcel = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.warn("⚠️ No authToken found.");
      return;
    }

    try {
      const response = await fetch(
        "https://rcs-dms.onlinetn.com/api/v1//master/detail/rate/comparison",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (response.ok && !result.error) {
        const data = result.data || [];

        // 🔥 Find all city keys dynamically (excluding id, name, unit)
        const cityKeys = Object.keys(data[0] || {}).filter(
          (key) => !["id", "name", "unit"].includes(key)
        );

        // 🔥 Prepare header row
        const headers = ["S.No", "Item Name / Unit", ...cityKeys];

        // 🔥 Prepare rows
        const rows = data.map((item, index) => {
          const row = [
            index + 1, // S.No
            `${item.name} (${item.unit})`, // Name + Unit
          ];
          // Add city values in same order
          cityKeys.forEach((city) => row.push(item[city] ?? "-"));
          return row;
        });

        // 🔥 Combine for Excel
        const worksheetData = [headers, ...rows];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Auto column widths
        worksheet["!cols"] = headers.map(() => ({ wch: 15 }));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rate Comparison");

        XLSX.writeFile(workbook, "rate_comparison.xlsx");
      } else {
        console.error("❌ API Error:", result.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error("❌ Error downloading excel:", err);
    }
  };
  useEffect(() => {
  const fetchDepartments = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const res = await fetch(
        "https://rcs-dms.onlinetn.com/api/v1/user/departments",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await res.json();
      if (!result.error) {
        setDepartments(result.data || []);
      } else {
        console.error("Department API error:", result.message);
      }
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

  fetchDepartments();
}, []);
  useEffect(() => {
    const fetchStores = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('⚠️ No authToken found for stores.');
        return;
      }

      try {
        const response = await fetch(
          'https://rcs-dms.onlinetn.com/api/v1//master/stores',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const result = await response.json();
        if (response.ok && !result.error) {
          // Convert object to array of {id, name} objects
          const storesArray = Object.entries(result.data || {}).map(([key, value]) => ({
            id: key,
            name: value
          }));
          setStoresData(storesArray);
          console.log('✅ Stores fetched:', storesArray);
        } else {
          console.error('❌ Stores API Error:', result.message || 'Unknown error');
        }
      } catch (err) {
        console.error('❌ Stores Fetch Failed:', err);
      }
    };

    fetchStores();
  }, []);
  useEffect(() => {
    const fetchDefaultOrders = async () => {
      const token = localStorage.getItem("authToken");
      const userData = localStorage.getItem("user");
      if (!token || !userData) return;

      const user = JSON.parse(userData);

      try {
        let url = "";

        // ✅ Role-based default API call logic
        if (user.role === "rcs-admin") {
          // Admin default - keep existing
          url = `https://rcs-dms.onlinetn.com/api/v1/indent/report/orders?department=364&period=thisMonth`;
        } else if (user.role === "department") {
          // Department default - no department/store filter
          url = `https://rcs-dms.onlinetn.com/api/v1/indent/report/orders?period=thisMonth`;
        } else if (user.role === "dep-rep") {
          const loginDataRaw = localStorage.getItem("loginResponse");
          if (!loginDataRaw) return;

          const loginData = JSON.parse(loginDataRaw);
          const othersData = loginData?.user?.others ? JSON.parse(loginData.user.others) : {};
          const rangeData = othersData?.range || {};

          // ✅ Combine all branches for all types (dep-rep default)
          const allBranches = Object.values(rangeData).flat();
          const branchQuery = allBranches.map(b => `branch=${encodeURIComponent(b)}`).join("&");

          // ✅ Call both orders and recent indents APIs with all branches + period
          url = `https://rcs-dms.onlinetn.com/api/v1/indent/report/orders?${branchQuery}&period=thisMonth`;

          // 🔹 Fetch orders first
          const response = await fetch(url, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          const result = await response.json();

          if (!result.error) {
            setOrderReport(result.data || []);
            console.log("✅ Dep-rep all-branches orders fetched:", allBranches);
          } else {
            console.error("❌ Dep-rep orders fetch failed:", result.message);
          }

          // 🔹 Fetch recent indents with same branch query + period
          const recentUrl = `https://rcs-dms.onlinetn.com/api/v1/indent/report/recent?${branchQuery}&period=thisMonth&limit=5`;
          const recentRes = await fetch(recentUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          const recentResult = await recentRes.json();

          if (!recentResult.error) {
            setFilteredIndents(recentResult.data || []);
            console.log("✅ Dep-rep all-branches indents fetched");
          } else {
            console.error("❌ Dep-rep indents fetch failed:", recentResult.message);
          }
        } else {
          // All other roles (store-manager, etc.)
          url = `https://rcs-dms.onlinetn.com/api/v1/indent/report/orders?period=thisMonth`;
        }
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();
        if (!result.error) {
          setOrderReport(result.data || []);
          console.log(`✅ Default orders fetched for role: ${user.role}`);
        } else {
          console.error("❌ Default orders fetch failed:", result.message);
        }
      } catch (err) {
        console.error("❌ Default orders fetch failed:", err);
      }
    };

    fetchDefaultOrders();
  }, []);
  const fetchFilteredData = async (storeId = null, deptId = null, period = null, branch = null) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      // Build URL with ALL filters including branch
      let url = 'https://rcs-dms.onlinetn.com/api/v1/indent/report/orders?';
      const params = [];

      if (storeId) params.push(`store=${storeId}`);
      if (deptId) params.push(`department=${deptId}`);
      if (period) params.push(`period=${period}`);
      // ✅ Branch handling logic for dep-rep
      if (userRole === "dep-rep") {
        const loginDataRaw = localStorage.getItem("loginResponse");
        const loginData = loginDataRaw ? JSON.parse(loginDataRaw) : null;
        const othersData = loginData?.user?.others ? JSON.parse(loginData.user.others) : {};
        const rangeData = othersData?.range || {};

        if (branch) {
          // 🔸 If specific branch selected → call only that branch
          params.push(`branch=${encodeURIComponent(branch)}`);
        } else if (selectedType) {
          // 🔸 If type selected → include only branches of that type
          const typeBranches = rangeData[selectedType] || [];
          params.push(typeBranches.map(b => `branch=${encodeURIComponent(b)}`).join("&"));
        } else {
          // 🔸 Default (no type/branch) → include all branches
          const allBranches = Object.values(rangeData).flat();
          params.push(allBranches.map(b => `branch=${encodeURIComponent(b)}`).join("&"));
        }
      } else if (branch) {
        // Other roles - keep normal behavior
        params.push(`branch=${encodeURIComponent(branch)}`);
      }

      url += params.join('&');

      // Fetch orders
      const ordersRes = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const ordersResult = await ordersRes.json();
      if (!ordersResult.error) {
        setOrderReport(ordersResult.data || []);
      }

      // Fetch indents with same filters
      const indentsUrl = url.replace('/orders', '/recent?limit=5');
      const indentsRes = await fetch(indentsUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const indentsResult = await indentsRes.json();
      if (!indentsResult.error) {
        setFilteredIndents(indentsResult.data || []);
      }
    } catch (err) {
      console.error('❌ Fetch failed:', err);
    }
  };
  const [branchesList, setBranchesList] = useState([]);
  // 🔹 Type & Branch filters for dep-rep login
  const [typeOptions, setTypeOptions] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [branchOptions, setBranchOptions] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  useEffect(() => {
    if (userRole === 'dep-rep') {
      const loginDataRaw = localStorage.getItem('loginResponse');
      console.log('🧩 Raw loginResponse:', loginDataRaw);

      try {
        const loginData = JSON.parse(loginDataRaw);
        console.log('✅ Parsed loginResponse:', loginData);

        // 🧠 Extract range from user.others (stringified JSON)
        const othersData = loginData?.user?.others
          ? JSON.parse(loginData.user.others)
          : {};
        const rangeData = othersData?.range || {};

        console.log('📦 rangeData from user.others:', rangeData);

        if (rangeData && typeof rangeData === 'object') {
          const types = Object.keys(rangeData);
          console.log('✅ Extracted types:', types);
          setTypeOptions(types);
        } else {
          console.warn('⚠️ No valid range data found in user.others');
        }
      } catch (err) {
        console.error('❌ Error parsing loginResponse:', err);
      }
    }
  }, [userRole]);

  useEffect(() => {
    // 🧠 Load rangeData from login response for dep-rep role
    const loginDataRaw = localStorage.getItem('loginResponse');
    if (!loginDataRaw) return;

    try {
      const loginData = JSON.parse(loginDataRaw);
      const othersData = loginData?.user?.others
        ? JSON.parse(loginData.user.others)
        : {};
      const rangeData = othersData?.range || {};

      console.log('📦 Extracted rangeData:', rangeData);

      const types = Object.keys(rangeData);
      setTypeOptions(types);
      localStorage.setItem('rangeData', JSON.stringify(rangeData));
    } catch (err) {
      console.error('❌ Error parsing rangeData:', err);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-md border-b border-white/20 sticky top-0 z-10">
        <div className="px-8 py-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Welcome back, {userName || 'User'}
              </h1>
              <p className="text-slate-600 mt-1 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Here's your system overview for today
              </p>
            </div>
            <div className="flex items-center gap-3">
              {userRole === 'rcs-admin' ? (
                <div className="flex gap-3">
                  {/* Stores Filter */}
                  <select
                    value={selectedDistrict}
                    onChange={(e) => {
                      const selectedStoreName = e.target.value;
                      setSelectedDistrict(selectedStoreName);

                      const selectedStoreObj = storesData.find(store => store.name === selectedStoreName);

                      if (selectedStoreObj) {
                        setSelectedDepartment('364'); // Auto-select Prison Department
                        fetchFilteredData(selectedStoreObj.id, '364', selectedPeriod || null);
                      } else {
                        setSelectedDepartment('');
                        fetchFilteredData(null, null, selectedPeriod || null);
                      }
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                  >
                    <option value="">All Stores</option>
                    {storesData.map((store) => (
                      <option key={store.id} value={store.name}>
                        {store.name}
                      </option>
                    ))}
                  </select>
             {/* Department Filter */}
<select
  value={selectedDepartment}
  onChange={(e) => {
    const value = e.target.value;
    setSelectedDepartment(value);

    const selectedStoreObj = storesData.find(store => store.name === selectedDistrict);
    const storeId = selectedStoreObj ? selectedStoreObj.id : null;

    fetchFilteredData(storeId, value || null, selectedPeriod || null);
  }}
  className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
>
  <option value="">All Departments</option>
  {departments.map((dept) => (
    <option key={dept.id} value={dept.id}>
      {dept.name}
    </option>
  ))}
</select>
                  {/* 🔹 Period Filter */}
                  <div className="relative inline-block">
                    <select
                      value={selectedPeriod}
                      onClick={(e) => {
                        // 👇 even if already selected, reopen calendar when clicking “Custom”
                        if (e.target.value === "custom") {
                          setShowCalendar(true);
                        }
                      }}
                      onChange={async (e) => {
                        const value = e.target.value;
                        setSelectedPeriod(value);

                        if (value === "custom") {
                          setShowCalendar(true);
                          return;
                        }

                        setShowCalendar(false);
                        setCustomLabel("");

                        const token = localStorage.getItem("authToken");
                        const selectedStoreObj = storesData.find(store => store.name === selectedDistrict);

                        if (!token) return;

                        try {
                          // Build dynamic API URL
                          let url = `https://rcs-dms.onlinetn.com/api/v1/indent/report/orders?`;

                          const params = [];
                          if (selectedStoreObj) params.push(`store=${selectedStoreObj.id}`);
                          if (selectedDepartment) params.push(`department=${selectedDepartment}`);
                          if (value) params.push(`period=${value}`);

                          url += params.join("&");

                          const response = await fetch(url, {
                            method: "GET",
                            headers: {
                              Authorization: `Bearer ${token}`,
                              "Content-Type": "application/json",
                            },
                          });

                          const result = await response.json();
                          if (!result.error) {
                            setOrderReport(result.data || []);
                          } else {
                            console.error("❌ Period orders fetch failed:", result.message);
                          }
                        } catch (err) {
                          console.error("❌ Period fetch failed:", err);
                        }
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-1 text-sm cursor-pointer"
                    >
                      <option value="thisWeek">This Week</option>
                      <option value="lastWeek">Last Week</option>
                      <option value="thisMonth">This Month</option>
                      <option value="lastMonth">Last Month</option>
                      <option value="custom">Custom</option>
                    </select>

                    {/* 🗓️ Show selected range label if custom */}
                    {customLabel && selectedPeriod === "custom" && (
                      <span className="ml-3 text-sm text-gray-600 italic">{customLabel}</span>
                    )}

                    {/* 🗓️ Calendar Popup (aligned left) */}
                    {showCalendar && (
                      <div
                        ref={calendarRef}
                        className="absolute right-full mr-3 top-0 bg-white shadow-lg border border-gray-200 rounded-lg p-3 z-50"
                      >
                        <DateRange
                          editableDateInputs={true}
                          onChange={(item) => setDateRange([item.selection])}
                          moveRangeOnFirstSelection={false}
                          ranges={dateRange}
                          rangeColors={["#2563eb"]}
                          months={1}
                          direction="horizontal"
                          locale={enUS}
                        />

                        <div className="flex justify-end gap-2 mt-3">
                          <button
                            onClick={() => {
                              setShowCalendar(false);

                              const startDate = dateRange[0].startDate.toISOString().split("T")[0];
                              const endDate = dateRange[0].endDate.toISOString().split("T")[0];
                              const customPeriod = `${startDate}:${endDate}`;

                              setCustomLabel(`${startDate} - ${endDate}`);

                              const selectedStoreObj = storesData.find(store => store.name === selectedDistrict);
                              const storeId = selectedStoreObj ? selectedStoreObj.id : null;

                              fetchFilteredData(storeId, selectedDepartment || null, customPeriod);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                          >
                            Select
                          </button>
                          <button
                            onClick={() => {
                              setShowCalendar(false);
                              setSelectedPeriod("");
                              setCustomLabel("");
                            }}
                            className="border border-gray-300 px-3 py-1 rounded-md text-sm hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : userRole === 'rcs-store' ? (
                  <div className="flex gap-3">
                    {/* Department Filter */}
<select
  value={selectedDepartment}
  onChange={(e) => {
    const value = e.target.value;
    setSelectedDepartment(value);
    fetchFilteredData(null, value || null, selectedPeriod || null);
  }}
  className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
>
  <option value="">All Departments</option>
  {departments.map((dept) => (
    <option key={dept.id} value={dept.id}>
      {dept.name}
    </option>
  ))}
</select>
    {/* ✅ PERIOD FILTER FOR STORE LOGIN */}
    <div className="relative inline-block">
      <select
        value={selectedPeriod}
        onClick={(e) => {
          if (e.target.value === "custom") setShowCalendar(true);
        }}
        onChange={(e) => {
          const value = e.target.value;
          setSelectedPeriod(value);

          if (value !== "custom") {
            fetchFilteredData(null, null, value);
            setShowCalendar(false);
            setCustomLabel("");
          }
        }}
        className="border border-gray-300 rounded-lg px-3 py-1 text-sm cursor-pointer"
      >
        <option value="thisWeek">This Week</option>
        <option value="lastWeek">Last Week</option>
        <option value="thisMonth">This Month</option>
        <option value="lastMonth">Last Month</option>
        <option value="custom">Custom</option>
      </select>

      {/* Custom Range Calendar */}
      {showCalendar && (
        <div
          ref={calendarRef}
          className="absolute right-full mr-3 top-0 bg-white shadow-lg border border-gray-200 rounded-lg p-3 z-50"
        >
          <DateRange
            editableDateInputs={true}
            onChange={(item) => setDateRange([item.selection])}
            moveRangeOnFirstSelection={false}
            ranges={dateRange}
            rangeColors={["#2563eb"]}
            months={1}
            direction="horizontal"
          />

          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => {
                setShowCalendar(false);
                const start = dateRange[0].startDate.toISOString().split("T")[0];
                const end = dateRange[0].endDate.toISOString().split("T")[0];
                const customPeriod = `${start}:${end}`;
                setCustomLabel(`${start} - ${end}`);
                fetchFilteredData(null, null, customPeriod);
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
            >
              Select
            </button>

            <button
              onClick={() => {
                setShowCalendar(false);
                setSelectedPeriod("thisMonth");
                setCustomLabel("");
              }}
              className="border border-gray-300 px-3 py-1 rounded-md text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
              ) : userRole === 'dep-rep' ? (
                <>
                  <div className="flex gap-4 w-full">
                    {/* 🔹 Type Filter */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={selectedType}
                        onChange={async (e) => {
                          const selected = e.target.value;
                          setSelectedType(selected);

                          // 🔹 Get branches for selected type
                          const rangeData = JSON.parse(localStorage.getItem("rangeData")) || {};
                          const branches = rangeData[selected] || [];
                          console.log("✅ Branches for", selected, ":", branches);
                          setBranchOptions(branches);
                          setSelectedBranch("");

                          // ✅ Immediately fetch Orders + Indents for that type's branches + period
                          if (branches.length > 0) {
                            const branchQuery = branches.map(b => `branch=${encodeURIComponent(b)}`).join("&");
                            const token = localStorage.getItem("authToken");
                            const period = selectedPeriod || "thisMonth";

                            try {
                              // 🔸 Fetch Orders
                              const ordersRes = await fetch(
                                `https://rcs-dms.onlinetn.com/api/v1/indent/report/orders?${branchQuery}&period=${period}`,
                                {
                                  method: "GET",
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                  },
                                }
                              );
                              const ordersResult = await ordersRes.json();
                              if (!ordersResult.error) {
                                setOrderReport(ordersResult.data || []);
                                console.log("✅ Orders updated for type:", selected);
                              }

                              // 🔸 Fetch Recent Indents (same branch filter + period)
                              const indentsRes = await fetch(
                                `https://rcs-dms.onlinetn.com/api/v1/indent/report/recent?${branchQuery}&period=${period}&limit=5`,
                                {
                                  method: "GET",
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                  },
                                }
                              );
                              const indentsResult = await indentsRes.json();
                              if (!indentsResult.error) {
                                setFilteredIndents(indentsResult.data || []);
                                console.log("✅ Indents updated for type:", selected);
                              }
                            } catch (err) {
                              console.error("❌ Error fetching type-based data:", err);
                            }
                          }
                        }}
                        className="w-full border border-gray-300 rounded-lg p-2 h-[42px] bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                      >
                        <option value="">Select Type</option>
                        {typeOptions.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 🔹 Branch Filter */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                      <select
                        value={selectedBranch}
                        onChange={async (e) => {
                          const selected = e.target.value;
                          setSelectedBranch(selected);

                          if (!selected) return; // Skip if no branch selected

                          const token = localStorage.getItem("authToken");
                          const period = selectedPeriod || "thisMonth";

                          try {
                            // ✅ Fetch Orders for selected branch + period
                            const ordersUrl = `https://rcs-dms.onlinetn.com/api/v1/indent/report/orders?branch=${encodeURIComponent(selected)}&period=${period}`;
                            const ordersRes = await fetch(ordersUrl, {
                              method: "GET",
                              headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                              },
                            });
                            const ordersResult = await ordersRes.json();

                            if (!ordersResult.error) {
                              setOrderReport(ordersResult.data || []);
                              console.log("✅ Orders fetched for branch:", selected);
                            } else {
                              console.error("❌ Branch orders fetch failed:", ordersResult.message);
                            }

                            // ✅ Fetch Recent Indents for same branch + period
                            const indentsUrl = `https://rcs-dms.onlinetn.com/api/v1/indent/report/recent?branch=${encodeURIComponent(selected)}&period=${period}&limit=5`;
                            const indentsRes = await fetch(indentsUrl, {
                              method: "GET",
                              headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                              },
                            });
                            const indentsResult = await indentsRes.json();

                            if (!indentsResult.error) {
                              setFilteredIndents(indentsResult.data || []);
                              console.log("✅ Recent indents fetched for branch:", selected);
                            } else {
                              console.error("❌ Branch indents fetch failed:", indentsResult.message);
                            }
                          } catch (err) {
                            console.error("❌ Error fetching data for branch:", err);
                          }
                        }}
                        disabled={!selectedType}
                        className="w-full border border-gray-300 rounded-lg p-2 h-[42px] bg-white disabled:bg-gray-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                      >
                        <option value="">Select Branch</option>
                        {branchOptions.map((branch) => (
                          <option key={branch} value={branch}>
                            {branch}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 🔹 Period Filter */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                      <div className="relative">
                        <select
                          value={selectedPeriod}
                          onClick={(e) => {
                            if (e.target.value === "custom") setShowCalendar(true);
                          }}
                          onChange={async (e) => {
                            const value = e.target.value;
                            setSelectedPeriod(value);

                            if (value === "custom") {
                              setShowCalendar(true);
                              return;
                            }

                            setShowCalendar(false);
                            setCustomLabel("");

                            // Trigger API call with current filters + new period
                            const loginDataRaw = localStorage.getItem("loginResponse");
                            const loginData = loginDataRaw ? JSON.parse(loginDataRaw) : null;
                            const othersData = loginData?.user?.others ? JSON.parse(loginData.user.others) : {};
                            const rangeData = othersData?.range || {};

                            let branchQuery = "";
                            if (selectedBranch) {
                              branchQuery = `branch=${encodeURIComponent(selectedBranch)}`;
                            } else if (selectedType) {
                              const typeBranches = rangeData[selectedType] || [];
                              branchQuery = typeBranches.map(b => `branch=${encodeURIComponent(b)}`).join("&");
                            } else {
                              const allBranches = Object.values(rangeData).flat();
                              branchQuery = allBranches.map(b => `branch=${encodeURIComponent(b)}`).join("&");
                            }

                            const token = localStorage.getItem("authToken");
                            try {
                              // Fetch Orders
                              const ordersRes = await fetch(
                                `https://rcs-dms.onlinetn.com/api/v1/indent/report/orders?${branchQuery}&period=${value}`,
                                {
                                  method: "GET",
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                  },
                                }
                              );
                              const ordersResult = await ordersRes.json();
                              if (!ordersResult.error) {
                                setOrderReport(ordersResult.data || []);
                              }

                              // Fetch Indents
                              const indentsRes = await fetch(
                                `https://rcs-dms.onlinetn.com/api/v1/indent/report/recent?${branchQuery}&period=${value}&limit=5`,
                                {
                                  method: "GET",
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                  },
                                }
                              );
                              const indentsResult = await indentsRes.json();
                              if (!indentsResult.error) {
                                setFilteredIndents(indentsResult.data || []);
                              }
                            } catch (err) {
                              console.error("❌ Error fetching period-filtered data:", err);
                            }
                          }}
                          className="w-full border border-gray-300 rounded-lg p-2 h-[42px] bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        >
                          <option value="thisWeek">This Week</option>
                          <option value="lastWeek">Last Week</option>
                          <option value="thisMonth">This Month</option>
                          <option value="lastMonth">Last Month</option>
                          <option value="custom">Custom</option>
                        </select>

                        {/* Calendar for custom range */}
                        {showCalendar && (
                          <div
                            ref={calendarRef}
                            className="absolute right-0 mt-2 bg-white shadow-lg border border-gray-200 rounded-lg p-3 z-50"
                          >
                            <DateRange
                              editableDateInputs={true}
                              onChange={(item) => setDateRange([item.selection])}
                              moveRangeOnFirstSelection={false}
                              ranges={dateRange}
                              rangeColors={["#2563eb"]}
                              months={1}
                              direction="horizontal"
                              locale={enUS}
                            />
                            <div className="flex justify-end gap-2 mt-3">
                              <button
                                onClick={async () => {
                                  setShowCalendar(false);
                                  const startDate = dateRange[0].startDate.toISOString().split("T")[0];
                                  const endDate = dateRange[0].endDate.toISOString().split("T")[0];
                                  const customPeriod = `${startDate}:${endDate}`;
                                  setCustomLabel(`${startDate} - ${endDate}`);

                                  const loginDataRaw = localStorage.getItem("loginResponse");
                                  const loginData = loginDataRaw ? JSON.parse(loginDataRaw) : null;
                                  const othersData = loginData?.user?.others ? JSON.parse(loginData.user.others) : {};
                                  const rangeData = othersData?.range || {};

                                  let branchQuery = "";
                                  if (selectedBranch) {
                                    branchQuery = `branch=${encodeURIComponent(selectedBranch)}`;
                                  } else if (selectedType) {
                                    const typeBranches = rangeData[selectedType] || [];
                                    branchQuery = typeBranches.map(b => `branch=${encodeURIComponent(b)}`).join("&");
                                  } else {
                                    const allBranches = Object.values(rangeData).flat();
                                    branchQuery = allBranches.map(b => `branch=${encodeURIComponent(b)}`).join("&");
                                  }

                                  const token = localStorage.getItem("authToken");
                                  try {
                                    const ordersRes = await fetch(
                                      `https://rcs-dms.onlinetn.com/api/v1/indent/report/orders?${branchQuery}&period=${customPeriod}`,
                                      { method: "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
                                    );
                                    const ordersResult = await ordersRes.json();
                                    if (!ordersResult.error) setOrderReport(ordersResult.data || []);

                                    const indentsRes = await fetch(
                                      `https://rcs-dms.onlinetn.com/api/v1/indent/report/recent?${branchQuery}&period=${customPeriod}&limit=5`,
                                      { method: "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
                                    );
                                    const indentsResult = await indentsRes.json();
                                    if (!indentsResult.error) setFilteredIndents(indentsResult.data || []);
                                  } catch (err) {
                                    console.error("❌ Custom period fetch failed:", err);
                                  }
                                }}
                                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                              >
                                Select
                              </button>
                              <button
                                onClick={() => {
                                  setShowCalendar(false);
                                  setSelectedPeriod("thisMonth");
                                  setCustomLabel("");
                                }}
                                className="border border-gray-300 px-3 py-1 rounded-md text-sm hover:bg-gray-100"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {customLabel && selectedPeriod === "custom" && (
                          <span className="text-xs text-gray-600 italic mt-1 block">{customLabel}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : userRole === 'department' ? (
                <div className="flex gap-3">
                  {/* Branch Filter */}
                  {/* <select
      value={selectedBranch}
      onChange={(e) => {
        const branchName = e.target.value;
        setSelectedBranch(branchName);

        // ✅ Fetch filtered data with branch + period only
        fetchFilteredData(null, null, selectedPeriod || null, branchName || null);
      }}
      className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
    >
      <option value="">All Branches</option>
      {branchesList.map((branch, idx) => (
        <option key={idx} value={branch.branch}>
          {branch.branch} ({branch.branchType})
        </option>
      ))}
    </select> */}

                  {/* Period Filter */}
                  <div className="relative inline-block">
                    <select
                      value={selectedPeriod}
                      onClick={(e) => {
                        if (e.target.value === "custom") setShowCalendar(true);
                      }}
                      onChange={async (e) => {
                        const value = e.target.value;
                        setSelectedPeriod(value);

                        if (value === "custom") {
                          setShowCalendar(true);
                          return;
                        }

                        setShowCalendar(false);
                        setCustomLabel("");

                        // ✅ Period + branch only
                        fetchFilteredData(null, null, value || null, selectedBranch || null);
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-1 text-sm cursor-pointer"
                    >
                      <option value="">All Periods</option>
                      <option value="thisWeek">This Week</option>
                      <option value="lastWeek">Last Week</option>
                      <option value="thisMonth">This Month</option>
                      <option value="lastMonth">Last Month</option>
                      <option value="custom">Custom</option>
                    </select>

                    {customLabel && selectedPeriod === "custom" && (
                      <span className="ml-3 text-sm text-gray-600 italic">{customLabel}</span>
                    )}

                    {/* Calendar Popup */}
                    {showCalendar && (
                      <div
                        ref={calendarRef}
                        className="absolute right-full mr-3 top-0 bg-white shadow-lg border border-gray-200 rounded-lg p-3 z-50"
                      >
                        <DateRange
                          editableDateInputs={true}
                          onChange={(item) => setDateRange([item.selection])}
                          moveRangeOnFirstSelection={false}
                          ranges={dateRange}
                          rangeColors={["#2563eb"]}
                          months={1}
                          direction="horizontal"
                          locale={enUS}
                        />

                        <div className="flex justify-end gap-2 mt-3">
                          <button
                            onClick={() => {
                              setShowCalendar(false);
                              const startDate = dateRange[0].startDate.toISOString().split("T")[0];
                              const endDate = dateRange[0].endDate.toISOString().split("T")[0];
                              const customPeriod = `${startDate}:${endDate}`;
                              setCustomLabel(`${startDate} - ${endDate}`);

                              // ✅ Only period + branch
                              fetchFilteredData(null, null, customPeriod, selectedBranch || null);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                          >
                            Select
                          </button>
                          <button
                            onClick={() => {
                              setShowCalendar(false);
                              setSelectedPeriod("");
                              setCustomLabel("");
                            }}
                            className="border border-gray-300 px-3 py-1 rounded-md text-sm hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                  User
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {summaryCards.map((card, idx) => (
            <div
              key={idx}
              onClick={() => handleCardClick(card.key)}
              className={`group relative border border-white/20 rounded-3xl p-4 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer ${card.bgColor || 'bg-white/80'}`}
            >
              <div className="flex items-center justify-between">
                {/* Left - Icon */}
                <div
                  className={`p-3 rounded-2xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-300`}
                >
                  {card.icon}
                </div>

                {/* Right - Title */}
                <div className="text-right">
                  <p className="text-base font-semibold text-slate-800">{card.title}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="mt-2 border-t border-gray-200"></div>

              {/* Value Section */}
              <div className="mt-2">
                {typeof card.value === "string" && card.value.includes("/") ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {card.key === "approved"
                        ? "Pending / Received"
                        : card.key === "dispatch"
                          ? "In Transit"
                          : card.key === "received"
                            ? "Delivered"
                            : card.key === "pc"
                              ? "Pending / Completed"
                              : card.key === "invoice"
                                ? "Pending / PC Orders"
                                : card.key === "payment"
                                  ? "Pending / Invoice Orders"
                                  : ""}
                    </p>
                    <p className="text-2xl font-bold text-slate-800">
                      <span>{card.value.split("/")[0]}</span>
                      <span className="text-gray-400 text-sm font-normal ml-1">
                        /{card.value.split("/")[1]}
                      </span>
                    </p>
                  </div>
                ) : (
                  // Fallback for cards that only have a single number (no slash)
                  <>
                    <p className="text-sm text-gray-600 mb-1">
                      {card.key === "dispatch"
                        ? "In Transit"
                        : card.key === "received"
                          ? " Delivered"
                          : ""}
                    </p>
                    <p className="text-2xl font-bold text-slate-800">
                      {card.value.toLocaleString()}
                    </p>
                  </>
                )}
              </div>

            </div>
          ))}
        </div>
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          {/* Recent Indents */}
          {recentIndents.length > 0 && (
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 h-full">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-xl">
                    <Clock className="w-6 h-6 text-emerald-600" />
                  </div>
                  🕒 Recent Indents
                </h2>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                      <tr>
                        <th className="text-left px-6 py-4 font-semibold text-slate-700">#</th>
                        <th className="text-left px-6 py-4 font-semibold text-slate-700">Type</th>
                        <th className="text-left px-6 py-4 font-semibold text-slate-700">Branch</th>
                        <th className="text-left px-6 py-4 font-semibold text-slate-700">Store</th>
                        <th className="text-left px-6 py-4 font-semibold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(userRole === 'dep-rep' ? filteredIndents : recentIndents)
                        .map((indent, idx) => (
                          <tr key={indent.id} className="group hover:bg-slate-50 transition-colors duration-200">
                            <td className="px-6 py-4 font-medium text-slate-600">{idx + 1}</td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                {indent.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-800 font-medium">{indent.branch}</td>
                            <td className="px-6 py-4 text-slate-600">{indent.store}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(indent.status)}`}>
                                {indent.status === 'Approved' ? 'Received' : indent.status}

                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
{/* Pie Chart - Department Login Only - FULL WIDTH */}
{userRole === 'department' && (
  <div className="col-span-1 md:col-span-2 lg:col-span-3">
    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          Orders Analytics
        </h3>
      </div>
      <PieComponent 
        data={orderReport}
        selectedPeriod={selectedPeriod}
        selectedBranch={selectedBranch}
      />
    </div>
  </div>
)}
          {/* Store Sidebar */}
          <div className="col-span-1">
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  Store Data
                </h3>

                {userRole !== "indent" && userRole !== "ind-apr" && (
                  <button
                    onClick={handlePriceItemsExcel}
                    title="Export Price Items"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v16h16V4H4zm4 8h8m-8 4h5"
                      />
                    </svg>
                  </button>
                )}

              </div>
              {storeData && Array.isArray(storeData) && storeData.length > 0 ? (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {storeData
                    .filter((item) => item.rate > 0 || item.package > 0 || item.offer > 0)
                    .map((store, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleStoreClick(store.name, store.store)}
                        className="cursor-pointer p-3 rounded-lg bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="text-sm font-semibold text-indigo-700">
                            {store.store}
                          </h3>
                          <span
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-medium cursor-pointer hover:bg-blue-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBranchClick(store);
                            }}
                          >
                            {userRole === "rcs-admin"
                              ? store.name || "No Name"
                              : store.branches
                                ? `${store.branches.length} Branches`
                                : "No Branches"}
                          </span>
                        </div>
                        {userRole !== 'dep-rep' && (
                          <div className="flex justify-between text-xs text-slate-800">
                            <span>
                              Offer: <span className="font-medium">{store.offer}</span>
                            </span>
                            <span>
                              Items Priced: <span className="font-medium">{store.rate}</span>
                            </span>
                            <span>
                              Package: <span className="font-medium">{store.package}</span>
                            </span>
                          </div>
                        )}

                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No store data available.</p>
              )}

            </div>
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl transform transition-all duration-300 ease-out scale-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h2 className="text-2xl font-bold">
                      {selectedStore || 'Store Details'}
                    </h2>
                  </div>
                  <button
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors duration-200"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-auto max-h-[500px]">
                    <table className="w-full text-sm table-fixed">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 font-semibold text-gray-800 w-20">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                              </div>
                              <span className="hidden sm:inline"></span>
                            </div>
                          </th>
                          <th className="px-6 py-3 font-semibold text-gray-800 text-left w-auto">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                              <span>Item Name</span>
                            </div>
                          </th>
                          <th className="px-6 py-3 font-semibold text-gray-800 text-left w-32">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-600 font-bold text-sm">₹</span>
                              </div>
                              <span>Rate</span>
                            </div>
                          </th>
                          <th className="px-6 py-3 font-semibold text-gray-800 text-left w-32">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                              <span>Pack Size</span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {storeDetails.items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-all duration-200 group">
                            <td className="px-6 py-3">
                              <div className="flex items-center justify-center">
                                <div className="w-8 h-8 bg-blue-50 group-hover:bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700 transition-all duration-200 border border-blue-200">
                                  {idx + 1}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 flex-shrink-0"></div>
                                <span className="text-gray-900 font-medium">
                                  {item.name}
                                  {item.unit && (
                                    <span className="ml-2 text-blue-600 text-sm font-medium">({item.unit})</span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <span className="text-green-700 font-semibold">₹{item.rate}</span>
                            </td>
                            <td className="px-6 py-3">
                              <span className="text-purple-700 font-medium">{item.pack}{item.pack_unit}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-between items-center">
                  <div className="bg-gray-50 px-6 py-3 rounded-lg border border-gray-200 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium">
                      Total Items: {storeDetails.items.length}
                    </span>
                  </div>

                  <button
                    onClick={downloadStoreExcel}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16V4H4zm4 8h8m-8 4h5" />
                    </svg>
                    Download Excel
                  </button>

                </div>

              </div>
            </div>
          </div>
        )}
      </div>
      {/* Branches Modal */}
      {branchesModalOpen && selectedBranches && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 ease-out scale-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-7 h-7 text-white" />
                  <h2 className="text-2xl font-bold">
                    {selectedBranches.storeName}
                  </h2>
                </div>
                <button
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors duration-200"
                  onClick={() => setBranchesModalOpen(false)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-auto max-h-[400px]">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-semibold text-gray-800 text-left">S.No</th>
                        <th className="px-6 py-3 font-semibold text-gray-800 text-left">Type</th>
                        <th className="px-6 py-3 font-semibold text-gray-800 text-left">Branch Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedBranches.branches.map((branch, idx) => (
                        <tr key={branch.id} className="hover:bg-gray-50 transition-all duration-200 group">
                          <td className="px-6 py-3">
                            <div className="w-8 h-8 bg-blue-50 group-hover:bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700 transition-all duration-200 border border-blue-200">
                              {idx + 1}
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              {branch.type}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className="text-gray-900 font-medium">
                              {branch.branch}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-between items-center">
                <div className="bg-gray-50 px-6 py-3 rounded-lg border border-gray-200 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium">
                    Total Branches: {selectedBranches.branches.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimplifiedDashboard;
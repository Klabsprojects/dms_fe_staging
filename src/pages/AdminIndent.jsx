import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';
import { Eye, FileText, MoreVertical, FileUp, FileCheck, CreditCard, CheckCircle } from "lucide-react";
import DeletePc from '../components/DeletePc';
import { useLocation } from "react-router-dom";
import ReactDOM from "react-dom";
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { enUS } from "date-fns/locale";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import InvoiceDelete from '../components/InvoiceDelete';
import RequestPopup from '../components/RequestPopup';
const IndentListing = () => {
  const navigate = useNavigate();
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showExpandedView, setShowExpandedView] = useState(false);
const [userRole, setUserRole] = useState(() => {
  try {
    const loginData = JSON.parse(localStorage.getItem('loginResponse'));
    return loginData?.user?.role || '';
  } catch {
    return '';
  }
});
  const [activeTab, setActiveTab] = useState('approved'); // default to 'Order Received'
  const location = useLocation();
  const [completedFilter, setCompletedFilter] = useState("all");
  const [departmentsList, setDepartmentsList] = useState([]);
  const [pagination, setPagination] = useState({
    approved: { page: 1, perPage: 100},
    dispatch: { page: 1, perPage: 100},
    received: { page: 1, perPage: 100}
  });
  const [storeFilter, setStoreFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [storesList, setStoresList] = useState([]);
  const [storeFilterFromUrl, setStoreFilterFromUrl] = useState('');
  const [departmentFilterFromUrl, setDepartmentFilterFromUrl] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);
  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
const [invoiceList, setInvoiceList] = useState([]);
const [loadingInvoices, setLoadingInvoices] = useState(false);
const [showBillingPopup, setShowBillingPopup] = useState(false);
const [selectedBillingOrder, setSelectedBillingOrder] = useState(null);
const [billingList, setBillingList] = useState([]);
const [loadingBilling, setLoadingBilling] = useState(false);


  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ]);
  const [customLabel, setCustomLabel] = useState('');
  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/master/stores`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && !result.error && result.data) {
        // Convert object to array of {key, value} pairs
        const storesArray = Object.entries(result.data).map(([key, value]) => ({
          code: key,
          name: value
        }));
        setStoresList(storesArray);
      } else {
        setStoresList([]);
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
      setStoresList([]);
    }
  };
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
  const params = new URLSearchParams(location.search);
  const tab = params.get("tab");
  const filter = params.get("filter");
  const store = params.get("store");
  const department = params.get("department");
  const period = params.get("period");
  const branch = params.get("branch");
  const type = params.get("type"); // 🔥 ADD THIS LINE

  if (tab) {
    setActiveTab(tab);
  }

  if (filter) {
    setCompletedFilter(filter);
  }

  if (store) {
    setStoreFilterFromUrl(store);
    setStoreFilter(store);
  }

  if (department) {
    setDepartmentFilterFromUrl(department);
    setDepartmentFilter(department);
  }

  // 🔥 NEW: Handle branch from URL
  if (branch) {
    setSelectedBranch(branch);
  }

  // 🔥 NEW: Handle type from URL (for dep-rep)
  if (type) {
    setSelectedType(type);
    
    // Load branches for this type
    const rangeData = JSON.parse(localStorage.getItem('rangeData')) || {};
    const branches = rangeData[type] || [];
    setBranchOptions(branches);
  }

  // Handle period
  if (period) {
    if (period.includes(':')) {
      setSelectedPeriod('custom');
      const [start, end] = period.split(':');
      setDateRange([{
        startDate: new Date(start),
        endDate: new Date(end),
        key: 'selection'
      }]);
      setCustomLabel(`${new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
    } else {
      setSelectedPeriod(period);
    }
  }

  // 🔥 FIX: Pass URL params directly to API call
  if (tab || filter || store || department || period || branch || type) {
    setTimeout(() => {
      // 🔥 For dep-rep with type, get branches from localStorage
      let branchesToFetch = null;
      
      if (userRole === 'dep-rep') {
        if (branch) {
          // Single branch selected
          branchesToFetch = null; // Will be passed as overrideBranch
        } else if (type) {
          // Type selected, get all branches for that type
          const rangeData = JSON.parse(localStorage.getItem('rangeData')) || {};
          branchesToFetch = rangeData[type] || [];
        }
      }

      fetchApprovedOrders(
        period || "thisMonth",
        branchesToFetch, // overrideBranches (array)
        branch || null    // overrideBranch (single branch)
      );
    }, 100);
  }
}, [location, userRole]); // 🔥 Add userRole to dependencies

  const handleViewBilling = async (orderId) => {
  try {
    setLoadingBilling(true);
    const token = localStorage.getItem("authToken");

    const response = await fetch(
      `https://rcs-dms.onlinetn.com/api/v1/bill/list/${orderId}`,
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
      setBillingList(result.data || []);
      setShowBillingPopup(true);
    } else {
      alert("No billing data found.");
    }
  } catch (error) {
    console.error("Error fetching billing:", error);
  } finally {
    setLoadingBilling(false);
  }
};


  const [searchText, setSearchText] = useState('');
  const [uploadLoading, setUploadLoading] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeletePcModal, setShowDeletePcModal] = useState(false);
  const [selectedOrderForPcDelete, setSelectedOrderForPcDelete] = useState(null);
  const [showInvDelete, setShowInvDelete] = useState(false);
  const [selectedOrderForInvDelete, setSelectedOrderForInvDelete] = useState(null);
  const [showDespatchCancelPopup, setShowDespatchCancelPopup] = useState(false);
  const [selectedOrderForDespatchCancel, setSelectedOrderForDespatchCancel] = useState(null);
  const [despatchCancelItems, setDespatchCancelItems] = useState([]);
  const [loadingDespatchItems, setLoadingDespatchItems] = useState(false);
const [typeOptions, setTypeOptions] = useState([]);
const [selectedType, setSelectedType] = useState('');
const [branchOptions, setBranchOptions] = useState([]);
const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedPcData, setSelectedPcData] = useState(null);

  // Fetch approved orders from API
const fetchApprovedOrders = async (
  period = selectedPeriod,
  overrideBranches = null,
  overrideBranch = null
) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');

      // build API URL dynamically with all filters
      const params = new URLSearchParams();
// ✅ dep-rep API filter logic (Type / Branch)
if (userRole === 'dep-rep') {
  const loginDataRaw = localStorage.getItem('loginResponse');
  const loginData = loginDataRaw ? JSON.parse(loginDataRaw) : null;

  const othersData = loginData?.user?.others
    ? JSON.parse(loginData.user.others)
    : {};

  const rangeData = othersData?.range || {};

  if (overrideBranch) {
    // ✅ Single branch
    params.append('branch', overrideBranch);
  }
  else if (overrideBranches && overrideBranches.length > 0) {
    // ✅ Multiple branches (from type)
    overrideBranches.forEach((b) => {
      params.append('branch', b);
    });
  }
  else if (selectedBranch) {
    params.append('branch', selectedBranch);
  }
  else if (selectedType && rangeData[selectedType]) {
    rangeData[selectedType].forEach((b) => {
      params.append('branch', b);
    });
  }
}



      // Add period
      if (period && period.includes(':')) {
        params.append('period', period);
      } else if (period === "custom" && dateRange[0]?.startDate && dateRange[0]?.endDate) {
        const start = dateRange[0].startDate.toISOString().split("T")[0];
        const end = dateRange[0].endDate.toISOString().split("T")[0];
        params.append('period', `${start}:${end}`);
      } else {
        params.append('period', period);
      }

      // Add department filter - use parameter OR state
      // ✅ NEW
     if (departmentFilter && departmentFilter !== "all") {
  params.append("department", departmentFilter);
}


 if (storeFilter && storeFilter !== "all") {
  params.append("store", storeFilter);
}

      const apiUrl = `${API_BASE_URL}indent/approved/list?${params.toString()}`;

      console.log('🔥 API Call:', apiUrl); // Debug log

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        setApprovedOrders(result.data || []);
        if (result.user?.role) setUserRole(result.user.role);
      } else {
        setApprovedOrders([]);
      }
    } catch (err) {
      console.error("Error fetching approved orders:", err);
      setApprovedOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedOrders("thisMonth");
    fetchStores();
    fetchDepartments(); // ✅ Add this
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}user/departments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && !result.error && result.data) {
        setDepartmentsList(result.data);
      } else {
        setDepartmentsList([]);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setDepartmentsList([]);
    }
  };
  useEffect(() => {
  if (userRole === 'dep-rep') {
    const loginDataRaw = localStorage.getItem('loginResponse');
    
    try {
      const loginData = JSON.parse(loginDataRaw);
      const othersData = loginData?.user?.others
        ? JSON.parse(loginData.user.others)
        : {};
      const rangeData = othersData?.range || {};

      if (rangeData && typeof rangeData === 'object') {
        const types = Object.keys(rangeData);
        setTypeOptions(types);
        localStorage.setItem('rangeData', JSON.stringify(rangeData));
        console.log('✅ Type options loaded for dep-rep:', types);
      }
    } catch (err) {
      console.error('❌ Error parsing loginResponse:', err);
    }
  }
}, [userRole]);
  // Fetch detailed order information
  const fetchOrderDetails = async (orderId) => {
    setDetailsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/indent/${orderId}/detail`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        setOrderDetails(result.data || result);
      } else {

      }
    } catch (err) {

      console.error('Error fetching order details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Handle expand/collapse of order details
  const handleToggleExpand = (orderId) => {
    if (expandedOrder === orderId && showExpandedView) {
      setShowExpandedView(false);
      setExpandedOrder(null);
      setOrderDetails(null);
    } else {
      setExpandedOrder(orderId);
      setShowExpandedView(true);
      fetchOrderDetails(orderId);
    }
  };

  // Handle back to listing
  const handleBackToListing = () => {
    setShowExpandedView(false);
    setExpandedOrder(null);
    setOrderDetails(null);
  };

  // Handle dispatch order navigation
  const handleDispatchOrder = () => {
    if (expandedOrder) {
      navigate(`/dispatch-order/${expandedOrder}`);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Handle PDF view
  const handleViewPdf = (order) => {
    if (order.order_list) {
      const pdfUrl = `https://rcs-dms.onlinetn.com/public/pdf/${order.order_list}`;
      window.open(pdfUrl, '_blank');
    }
  };

  // Handle Document view
  const handleViewDocument = (order) => {
    if (order.uploaded_pc) {
      const docUrl = `https://rcs-dms.onlinetn.com/public/${order.uploaded_pc}`;
      window.open(docUrl, '_blank');
    }
  };

  const handleInvoiceUpload = async (orderId, file) => {
    if (!file) {
      setSuccessMessage('Please select a file to upload.');
      return;
    }

    setUploadLoading(prev => ({ ...prev, [`invoice_${orderId}`]: true }));
    setSuccessMessage(''); // Clear previous message

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('file', file); // ✅ correct payload key

      const response = await fetch(`https://rcs-dms.onlinetn.com/api/v1//indent/${orderId}/invoice`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();

        await fetchApprovedOrders(); // Refresh order list to get updated invoice path


        console.log('Invoice Upload successful:', result);
        setSuccessMessage('✅ Invoice uploaded successfully!');
      } else {
        const errorResult = await response.json();
        console.error('Invoice upload failed:', errorResult);
        setSuccessMessage('❌ Invoice upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during invoice upload:', error);
      setSuccessMessage('❌ An error occurred while uploading the invoice.');
    } finally {
      setUploadLoading(prev => ({ ...prev, [`invoice_${orderId}`]: false }));
    }
  };


  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handlePaymentTransfer = async (orderId) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`https://rcs-dms.onlinetn.com/api/v1//indent/${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        alert('✅ Payment transfer successful.');
      } else {
        console.error('Payment transfer failed:', result);
        alert('❌ Payment transfer failed.');
      }
    } catch (error) {
      console.error('Error during payment transfer:', error);
      alert('❌ An error occurred while initiating payment transfer.');
    }
  };
  const [openDropdown, setOpenDropdown] = useState(null);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const toggleDropdown = (orderId) => {
    setOpenDropdown(openDropdown === orderId ? null : orderId);
  };
  const handleDeletePc = (order) => {
    setSelectedPcData({
      orderId: order.id,
      pcDocument: order.uploaded_pc,
      remarks: order.pc_remarks || '' // assuming remarks field exists
    });
    setShowDeletePcModal(true);
  };
  const handleConfirmPcDelete = async (remarks) => {
    if (!selectedPcData) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `https://rcs-dms.onlinetn.com/api/v1/indent/${selectedPcData.orderId}/pc-del`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            remarks: remarks
          })
        }
      );

      const result = await response.json();
      if (response.ok && !result.error) {
        alert("PC deleted successfully.");
        fetchApprovedOrders(); // refresh orders
      } else {
        alert("Failed to delete PC.");
      }
    } catch (error) {
      console.error("Error deleting PC:", error);
      alert("Error while deleting PC.");
    } finally {
      setShowDeletePcModal(false);
      setSelectedPcData(null);
    }
  };
  const handleRequestDelete = (order) => {
    setSelectedOrderForInvDelete(order);
    setShowInvDelete(true);
  };
const handleViewInvoices = async (orderId) => {
  try {
    setLoadingInvoices(true);
    const token = localStorage.getItem("authToken");

    const response = await fetch(
      `https://rcs-dms.onlinetn.com/api/v1/bill/list/${orderId}`,
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
      setInvoiceList(result.data || []);
      setShowInvoicePopup(true);
    } else {
      alert("No invoice data found!");
    }
  } catch (error) {
    console.log("Error fetching invoices:", error);
  } finally {
    setLoadingInvoices(false);
  }
};

  const handleConfirmInvDelete = async (remarks) => {
    if (!selectedOrderForInvDelete) return;

    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        "https://rcs-dms.onlinetn.com/api/v1//notifications/indent/inv-del",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            indent: selectedOrderForInvDelete.id, // ✅ order id
            remarks: remarks || "nil", // ✅ remarks from popup
          }),
        }
      );

      const result = await response.json();

      if (response.ok && !result.error) {
        alert("🗑️ Invoice delete request sent successfully.");
        fetchApprovedOrders(); // refresh the list
      } else {
        alert("❌ Failed to send delete request.");
        console.error("Error response:", result);
      }
    } catch (error) {
      console.error("Error sending delete request:", error);
      alert("❌ Something went wrong while sending request.");
    } finally {
      setShowInvDelete(false);
      setSelectedOrderForInvDelete(null);
    }
  };

  const handleRequestDespatchCancel = async (order) => {
    setSelectedOrderForDespatchCancel(order);
    setShowDespatchCancelPopup(true);
    setLoadingDespatchItems(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/indent/${order.id}/detail`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && !result.error && result.data) {
        const items = result.data
          .filter(item => Number(item.qty) > 0)
          .map(item => ({
            id: item.id,
            name: item.name,
            unit: item.unit,
            qty: item.qty,
            disp_qty: item.disp_qty || '0',
            grn_qty: item.grn_qty || null
          }));

        setDespatchCancelItems(items);
      } else {
        alert('Failed to load order items.');
        setShowDespatchCancelPopup(false);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Error loading items.');
      setShowDespatchCancelPopup(false);
    } finally {
      setLoadingDespatchItems(false);
    }
  };

const handleConfirmDespatchCancel = async (remarks) => {
  if (!selectedOrderForDespatchCancel) return;

  try {
    const token = localStorage.getItem('authToken');

    const response = await fetch(
      `${API_BASE_URL}/indent/${selectedOrderForDespatchCancel.id}/dispatch-reversal`,  // ✅ NEW
      {
        method: 'PUT',  // ✅ CHANGED from POST
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          remarks: remarks || 'nil',  // ✅ SIMPLIFIED - removed 'indent' field
        }),
      }
    );

    const result = await response.json();

    if (response.ok && !result.error) {
      alert('✅ Dispatch reversal successful.');
      fetchApprovedOrders();
    } else {
      alert('❌ Failed to reverse dispatch.');
      console.error('Error response:', result);
    }
  } catch (error) {
    console.error('Error reversing dispatch:', error);
    alert('❌ Something went wrong while reversing dispatch.');
  } finally {
    setShowDespatchCancelPopup(false);
    setSelectedOrderForDespatchCancel(null);
    setDespatchCancelItems([]);
  }
};
useEffect(() => {
  setPagination(prev => ({
    ...prev,
    [activeTab]: { ...prev[activeTab], page: 1 }
  }));
}, [searchText, completedFilter, storeFilter, departmentFilter, selectedPeriod, dateRange, selectedType, selectedBranch]); // 🔥 ADD selectedType, selectedBranch

  const handleDownloadExcel = async () => {
    const filteredData = approvedOrders
.filter(order => {
  const status = (order.status || '').trim().toLowerCase();
  return activeTab ? status === activeTab : true;
})

      .filter(order => {
        if (departmentFilter !== "all" && order.depatment !== departmentFilter) return false;
        if (storeFilter !== "all" && order.store !== storeFilter) return false;
        return true;
      })
      .filter(order => {
        if (activeTab !== "received") return true;

        const isReceived = order.status?.toLowerCase() === "received";

        if (completedFilter === "pc-pending")
          return isReceived && !order.uploaded_pc;


        if (completedFilter === "pc-uploaded")
          return isReceived && order.uploaded_pc;

  if (completedFilter === "completed")
    return isReceived && order.uploaded_pc;

        return true;
      });

    if (filteredData.length === 0) {
      alert("No records to download.");
      return;
    }

    // 🔤 Helpers
    const toTitleCase = (text = "") =>
      text.replace(/[-_]/g, " ").replace(/\b\w/g, ch => ch.toUpperCase());

    const formatPeriod = (period) => {
      switch (period) {
        case "thisMonth": return "This Month";
        case "lastMonth": return "Last Month";
        case "thisWeek": return "This Week";
        case "lastWeek": return "Last Week";
        case "custom": return customLabel || "Custom Period";
        default: return "All Periods";
      }
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return "N/A";
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, "0");
      const monthShort = d.toLocaleString("en-GB", { month: "short" }).slice(0, 3); // ✅ Keep only first 3 chars
      const year = d.getFullYear();
      return `${day}-${monthShort}-${year}`;
    };
    // 🧾 Meta info as a single row
    // 🧾 Title + Meta info rows
    const meta = [
      ["RCS Stores Indent List"],
      [
        "Department:", departmentFilter === "all" ? "All Departments" : departmentFilter,
        "Store:", storeFilter === "all" ? "All Stores" : storeFilter,
        "Period:", formatPeriod(selectedPeriod),
        "Status:",
        activeTab === "received"
          ? (completedFilter !== "all" ? toTitleCase(completedFilter) : "All Completed Orders")
          : toTitleCase(activeTab)
      ],
      [] // blank line before header
    ];

    // 🧮 Data
    const exportRows = filteredData.map((order, idx) => {
      // ✅ Map status text
      let displayStatus = "N/A";

      if (order.status === "Approved") {
        displayStatus = "Received";
      } else if (order.status === "Dispatch") {
        displayStatus = "Despatched";
 } else if (order.status === "Received") {
  if (!order.uploaded_pc) {
    displayStatus = "PC Pending";
  } else {
    displayStatus = "Invoiced";
  }
}


      // ✅ Format dates
      // ✅ Format dates
      const formatDisplayDate = (dateStr) => {
        if (!dateStr || dateStr === "NaN Inv NaN") return "N/A";
        let d;
        if (dateStr.includes("T")) d = new Date(dateStr);
        else d = new Date(`${dateStr}T00:00:00Z`);
        if (isNaN(d.getTime())) return "N/A";
        const day = String(d.getUTCDate()).padStart(2, "0");
        const month = d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
        const year = d.getUTCFullYear();
        return `${day} ${month} ${year}`;
      };

      // ✅ Calculate number of days safely
      const orderDate = order.created
        ? new Date(order.created)
        : null;

      const despatchDate =
        order.dispatched && order.dispatched !== "NaN Inv NaN"
          ? (order.dispatched.includes("T")
            ? new Date(order.dispatched)
            : new Date(`${order.dispatched}T00:00:00Z`))
          : null;

      let daysDiff = "N/A";
      if (
        orderDate &&
        despatchDate &&
        !isNaN(orderDate.getTime()) &&
        !isNaN(despatchDate.getTime())
      ) {
        const diff = (despatchDate - orderDate) / (1000 * 60 * 60 * 24);
        daysDiff = diff >= 0 ? Math.ceil(diff) : 0;
      }
      // 👇 ADD LOG HERE
      console.log("🧩 DEBUG ORDER:", {
        id: order.id,
        created: order.created,
        dispatched: order.dispatched,
        createdParsed: new Date(order.created),
        dispatchedParsed: order.dispatched ? new Date(order.dispatched) : "null",
        formatCreated: formatDisplayDate(order.created),
        formatDispatched: formatDisplayDate(order.dispatched)
      });

      return [
        idx + 1,  // S.No
        order.store || "N/A",  // Store
        order.id || "N/A",  // Order ID
        formatDisplayDate(order.created),  // Date
        formatDisplayDate(order.dispatched),  // Despatch Date
        daysDiff,  // No. of Days
        order.depatment || "N/A",  // Department
        order.type || "N/A",  // Type
        order.branch || "N/A",  // Unit
        displayStatus,  // Status
        order.order_value ? Math.round(order.order_value) : "0",  // Ordered Value
        order.received_Value ? Math.round(order.received_Value) : "0",  // Received Value
      ];

    });


    // 📘 Workbook setup
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Indent List");

    // Add meta info
    meta.forEach((r) => ws.addRow(r));
    // 🎯 Style title row
    const titleRow = ws.getRow(1);
    titleRow.font = { bold: true, size: 16 };
    titleRow.alignment = { horizontal: "center", vertical: "middle" };

    // Merge cells for centered title (A1 to L1)
    ws.mergeCells('A1:L1');


    // Add headers
    const headers = [
      "S.No",
      "Store",
      "Order ID",
      "Order Date",
      "Despatch Date",
      "No. of Days",
      "Department",
      "Type",
      "Unit",
      "Status",
      "Ordered Value",
      "Received Value"
    ];
    const headerRow = ws.addRow(headers);

    // Add data rows
    exportRows.forEach(r => ws.addRow(r));

    // Column widths
    ws.columns = [
      { width: 6 },   // S.No
      { width: 20 },  // Store
      { width: 14 },  // Order ID
      { width: 14 },  // Date
      { width: 16 },  // Despatch Date
      { width: 12 },  // No. of Days
      { width: 22 },  // Department
      { width: 25 },  // Type
      { width: 35 },  // Unit
      { width: 16 },  // Status
      { width: 18 },  // Ordered Value
      { width: 18 },  // Received Value
    ];

    // ✳️ Bold only the keys in the meta info row (second row)
    meta[1].forEach((val, idx) => {
      if (idx % 2 === 0) { // keys are at even indexes (Department, Store, Period, Status)
        ws.getCell(2, idx + 1).font = { bold: true };
      }
    });

    // ✳️ Bold header row only
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Align column values
    ws.eachRow((row, rowNumber) => {
      if (rowNumber > meta.length + 1) { // skip meta + header rows
        // Left align Order ID (col 3) and No. of Days (col 6)
        row.getCell(3).alignment = { horizontal: "left" };
        row.getCell(6).alignment = { horizontal: "left" };

        // Right align Ordered Value (col 11) and Received Value (col 12)
        row.getCell(11).alignment = { horizontal: "right" };
        row.getCell(12).alignment = { horizontal: "right" };
      }
    });

    // Align “S.No” and “Order ID” left
    const snoColumn = 1; // column A
    const orderIdColumn = 2; // column B

    ws.eachRow((row, rowNumber) => {
      if (rowNumber > meta.length) {
        row.getCell(snoColumn).alignment = { horizontal: "left" };
        row.getCell(orderIdColumn).alignment = { horizontal: "left" };
      }
    });


    // ✳️ Remove dropdown/filter arrows — just plain header
    ws.autoFilter = null;

    // 🪶 Generate file
    const buffer = await wb.xlsx.writeBuffer();
    const fileName = `Indent_List_${formatDate(new Date())}.xlsx`;
    saveAs(new Blob([buffer]), fileName);
  };

  return (
    <div className="max-w-7xl mx-auto p-2 bg-gray-50 rounded-lg">

      <div className="bg-white shadow rounded-lg p-6 h-full flex flex-col">
        {successMessage && (
          <div className="mb-2 p-2 bg-green-100 text-green-800 text-sm rounded">
            {successMessage}
          </div>
        )}


        {!showExpandedView ? (
          <>
            <div className="flex items-center justify-between mb-10">
              {/* Header */}
              <h1 className="text-xl font-semibold text-gray-800 text-center flex-1">
                ORDER STATUS
              </h1>

              {/* Search Bar */}
              <div className="relative w-full sm:w-48 ml-4">
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="pl-10 pr-4 py-2 w-full rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  onChange={(e) => setSearchText(e.target.value.toLowerCase())}
                />

                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35M15 11a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
              </div>
              <button
                onClick={handleDownloadExcel}
                className="ml-3 flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm"
              >
                <FileText className="w-4 h-4" />
              </button>

            </div>
            {/* ✅ Outer container with vertical stacking for tabs + filters */}
            <div className="mb-4 space-y-4">

              {/* 🔹 Tabs Row */}
              <div className="flex flex-wrap items-center gap-4">
                {[
                  { key: 'approved', label: 'Received' },
                  { key: 'dispatch', label: 'Despatched' },
                  { key: 'received', label: 'Completed' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-4 py-2 rounded text-sm font-medium transition ${activeTab === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* 🔹 Filters Row - Only visible if userRole !== 'dep-rep' */}
              {userRole && userRole !== 'dep-rep' && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-4 w-full">
                  {/* Department Filter */}
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="all">All Departments</option>
                    {departmentsList.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>

                 {/* Store Filter - Hidden for rcs-store */}
{userRole !== 'rcs-store' && (
  <select
    value={storeFilter}
    onChange={(e) => setStoreFilter(e.target.value)}
    className="border border-gray-300 rounded px-3 py-2 text-sm"
  >
    <option value="all">All Stores</option>
    {storesList.map((store) => (
      <option key={store.code} value={store.name}>
        {store.name}
      </option>
    ))}
  </select>
)}

                  {/* Period Filter */}
                  <div className="relative inline-block">
                    <select
                      value={selectedPeriod}
                      onClick={(e) => {
                        if (e.target.value === 'custom') setShowCalendar(true);
                      }}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedPeriod(value);
                        if (value === 'custom') {
                          setShowCalendar(true);
                        } else {
                          setShowCalendar(false);
                          setCustomLabel('');
                          fetchApprovedOrders(value);
                        }
                      }}
                      className="border border-gray-300 rounded px-3 py-2 text-sm cursor-pointer"
                    >
                      <option value="thisWeek">This Week</option>
                      <option value="lastWeek">Last Week</option>
                      <option value="thisMonth">This Month</option>
                      <option value="lastMonth">Last Month</option>
                      <option value="custom">{customLabel ? customLabel : 'Custom'}</option>
                    </select>

                    {/* Calendar Popup */}
                    {showCalendar && (
                      <div
                        ref={calendarRef}
                        className="absolute left-0 mt-2 bg-white shadow-lg border border-gray-200 rounded-lg p-3 z-50"
                      >
                        <DateRange
                          editableDateInputs={true}
                          onChange={(item) => setDateRange([item.selection])}
                          moveRangeOnFirstSelection={false}
                          ranges={dateRange}
                          rangeColors={['#2563eb']}
                          months={1}
                          direction="horizontal"
                          locale={enUS}
                        />

                        <div className="flex justify-end gap-2 mt-3">
                          <button
                            onClick={() => {
                              setShowCalendar(false);
                              const start = dateRange[0].startDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              });
                              const end = dateRange[0].endDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              });
                              setCustomLabel(`${start} - ${end}`);
                              setSelectedPeriod('custom');
                              fetchApprovedOrders('custom');
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                          >
                            Select
                          </button>
                          <button
                            onClick={() => {
                              setShowCalendar(false);
                              setSelectedPeriod('');
                              setCustomLabel('');
                            }}
                            className="border border-gray-300 px-3 py-1 rounded-md text-sm hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Completed Orders Filter (only for 'received' tab) */}
                  {activeTab === 'received' && (
                    <select
                      value={completedFilter}
                      onChange={(e) => setCompletedFilter(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    >
            <option value="all">All Completed Orders</option>
    <option value="pc-pending">PC Pending</option>
    <option value="pc-uploaded">PC Uploaded</option>
    <option value="completed">Invoiced</option>

                    </select>
                  )}
                </div>
              )}
              {/* ✅ Filters Row – Only for dep-rep (safe, independent block) */}
{/* ✅ Filters Row – Only for dep-rep (safe, independent block) */}
{userRole === 'dep-rep' && (
  <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full mt-2">

    {/* Type Filter */}
    <select
      value={selectedType}
      onChange={(e) => {
        const value = e.target.value;
        setSelectedType(value);
        setSelectedBranch('');

        const loginDataRaw = localStorage.getItem('loginResponse');
        const loginData = loginDataRaw ? JSON.parse(loginDataRaw) : null;
        const othersData = loginData?.user?.others
          ? JSON.parse(loginData.user.others)
          : {};
        const rangeData = othersData?.range || {};
        const branches = rangeData[value] || [];

        setBranchOptions(branches);

        // ✅ Call API with correct branches immediately
        fetchApprovedOrders(selectedPeriod, branches, null);
      }}
      className="border border-gray-300 rounded px-3 py-2 text-sm"
    >
      <option value="">All Types</option>
      {typeOptions.map((type) => (
        <option key={type} value={type}>{type}</option>
      ))}
    </select>

    {/* Branch Filter */}
    <select
      value={selectedBranch}
      onChange={(e) => {
        const value = e.target.value;
        setSelectedBranch(value);

        // ✅ Call API for this single branch
        fetchApprovedOrders(selectedPeriod, null, value);
      }}
      className="border border-gray-300 rounded px-3 py-2 text-sm"
    >
      <option value="">All Branches</option>
      {branchOptions.map((b) => (
        <option key={b} value={b}>{b}</option>
      ))}
    </select>

    {/* Period Filter (same logic, no change) */}
    <div className="relative inline-block">
      <select
        value={selectedPeriod}
        onClick={(e) => {
          if (e.target.value === 'custom') setShowCalendar(true);
        }}
        onChange={(e) => {
          const value = e.target.value;
          setSelectedPeriod(value);
          if (value === 'custom') {
            setShowCalendar(true);
          } else {
            setShowCalendar(false);
            setCustomLabel('');
            fetchApprovedOrders(value);
          }
        }}
        className="border border-gray-300 rounded px-3 py-2 text-sm cursor-pointer"
      >
        <option value="thisWeek">This Week</option>
        <option value="lastWeek">Last Week</option>
        <option value="thisMonth">This Month</option>
        <option value="lastMonth">Last Month</option>
        <option value="custom">{customLabel ? customLabel : 'Custom'}</option>
      </select>

      {/* Calendar Popup (reuse existing) */}
      {showCalendar && (
        <div
          ref={calendarRef}
          className="absolute left-0 mt-2 bg-white shadow-lg border border-gray-200 rounded-lg p-3 z-50"
        >
          <DateRange
            editableDateInputs={true}
            onChange={(item) => setDateRange([item.selection])}
            moveRangeOnFirstSelection={false}
            ranges={dateRange}
            rangeColors={['#2563eb']}
            months={1}
            direction="horizontal"
            locale={enUS}
          />

          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => {
                setShowCalendar(false);
                const start = dateRange[0].startDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                const end = dateRange[0].endDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                setCustomLabel(`${start} - ${end}`);
                setSelectedPeriod('custom');
                fetchApprovedOrders('custom');
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
            >
              Select
            </button>
            <button
              onClick={() => {
                setShowCalendar(false);
                setSelectedPeriod('');
                setCustomLabel('');
              }}
              className="border border-gray-300 px-3 py-1 rounded-md text-sm hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>

    {/* 🔥 NEW: Completed Orders Filter (only for 'received' tab) */}
   {/* Completed Orders Filter (only for 'received' tab) */}
{activeTab === 'received' && (
  <select
    value={completedFilter}
    onChange={(e) => setCompletedFilter(e.target.value)}
    className="border border-gray-300 rounded px-3 py-2 text-sm"
  >
    <option value="all">All Completed Orders</option>
    <option value="pc-pending">PC Pending</option>
    <option value="pc-uploaded">PC Uploaded</option>
    <option value="completed">Invoiced</option>
    {/* 🔥 dep-rep: hide invoice & payment filters */}
    {userRole !== 'dep-rep' && (
      <>
        <option value="invoice-pending">Invoice Pending</option>
        <option value="payment-pending">Payment Pending</option>
        <option value="invoice-uploaded">Invoice Uploaded</option>
        <option value="payment-uploaded">Payment Uploaded</option>
      </>
    )}
  </select>
)}

  </div>
)}

            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading approved orders...</p>
              </div>
            ) : approvedOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No approved orders found.</p>
              </div>
            ) : (
              <div className="flex-grow overflow-auto">

                <table className="w-full table-auto border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">S.No</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Order ID</th> {/* New column */}
                      {userRole === 'rcs-admin' && (
                        <th className="border border-gray-300 px-4 py-2 text-left">Department</th>
                      )}
                      <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Unit</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Store</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Filter and sort orders
                      // Filter and sort orders
                      const filteredOrders = approvedOrders
.filter(order => {
  const status = (order.status || '').trim().toLowerCase();
  return activeTab ? status === activeTab.toLowerCase() : true;
})

                        .filter(order => {
                   if (
  userRole !== 'dep-rep' &&
  departmentFilter !== "all" &&
order.department !== departmentFilter

) {
  return false;
}



                          // Store filter
                          if (storeFilter !== "all" && order.store !== storeFilter) {
                            return false;
                          }

                          // Search text filter
                          const dept = order.depatment || '';
                          const branch = order.branch || '';
                          const type = order.type || '';
                          const created = order.created || '';
                          const formattedDate = new Date(created).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          });
                          const orderId = String(order.id || '').toLowerCase();
                          const combined = `${orderId} ${dept} ${branch} ${type} ${formattedDate}`.toLowerCase();
                          return combined.includes(searchText);
                        })
                        .filter(order => {
                          // Completed filter (for 'received' tab)
                          if (activeTab !== "received") return true;

                          const isReceived = order.status?.toLowerCase() === "received";

                          if (completedFilter === "pc-pending")
                            return isReceived && !order.uploaded_pc;

                          if (completedFilter === "pc-uploaded")
                            return isReceived && order.uploaded_pc;

 if (completedFilter === "completed")
    return isReceived && order.uploaded_pc;
                          return true;

                        })
                        .sort((a, b) => {
                          const dateA = new Date(a.created);
                          const dateB = new Date(b.created);
                          if (['dispatch', 'received'].includes(activeTab)) return dateB - dateA;
                          return dateA - dateB;
                        });
                      // Pagination calculation
                      const currentPagination = pagination[activeTab];
                      const indexOfLastItem = currentPagination.page * currentPagination.perPage;
                      const indexOfFirstItem = indexOfLastItem - currentPagination.perPage;
                      const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

                      return currentOrders.map((order, index) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="border border-gray-300 px-4 py-2">{indexOfFirstItem + index + 1}.</td>
                          <td className="border border-gray-300 px-4 py-2">{order.id || 'N/A'}</td>

                          {userRole === 'rcs-admin' && (
                            <td className="border border-gray-300 px-4 py-2">{order.depatment || 'N/A'}</td>
                          )}
                          <td className="border border-gray-300 px-4 py-2">{order.type}</td>
                          <td className="border border-gray-300 px-4 py-2">{order.branch}</td>
                          <td className="border border-gray-300 px-4 py-2">{order.store || 'N/A'}</td>
                          <td className="border border-gray-300 px-4 py-2">{formatDate(order.created)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {order?.status && (
                    <span
  className={`px-3 py-1 rounded-full text-sm font-medium ${
    order.status === 'Dispatch'
      ? 'bg-green-100 text-green-700'
      : order.status === 'Approved'
        ? 'bg-blue-100 text-blue-700'
        : order.status === 'Received' && !order.uploaded_pc
          ? 'bg-yellow-100 text-yellow-700' // PC Pending
          : order.status === 'Received' && order.uploaded_pc
            ? 'bg-purple-100 text-purple-700' // Completed
            : 'bg-gray-100 text-gray-700'
  }`}
>
  {order.status === 'Approved'
    ? 'Received'
    : order.status === 'Dispatch'
      ? 'Despatched'
      : order.status === 'Received'
        ? !order.uploaded_pc
          ? 'PC Pending'
          : 'Invoived'
        : order.status}
</span>

                            )}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center relative overflow-visible">
                            <div className="flex justify-center gap-3">
                              {order.status === "Received" ? (
                                <>
                                  {completedFilter === "invoice-pending" && order.uploaded_pc && !order.uploaded_inv ? (
                                    <>
                                      <button
                                        onClick={() => handleViewDocument(order)}
                                        title="PC Uploaded"
                                        className="text-green-600 hover:text-green-800"
                                      >
                                        <CheckCircle className="w-5 h-5" />
                                      </button>
                                      {order.dc_receipt && (
                                        <button
                                          onClick={() =>
                                            window.open(
                                              `https://rcs-dms.onlinetn.com/public/pdf/${order.dc_receipt}`,
                                              "_blank"
                                            )
                                          }
                                          title="Delivery Challan"
                                          className="text-orange-600 hover:text-orange-800"
                                        >
                                          <FileText className="w-5 h-5" />
                                        </button>
                                      )}
                                    </>
                                  ) : order.uploaded_inv ? (
                                    <>
                                      <button
                                        onClick={() => handleViewDocument(order)}
                                        title="PC Uploaded"
                                        className="text-green-600 hover:text-green-800"
                                      >
                                        <CheckCircle className="w-5 h-5" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          window.open(
                                            `https://rcs-dms.onlinetn.com/public/${order.uploaded_inv}`,
                                            "_blank"
                                          )
                                        }
                                        title="Invoice Uploaded"
                                        className="text-yellow-600 hover:text-yellow-800"
                                      >
                                        <FileText className="w-5 h-5" />
                                      </button>
                                    </>
) : order.uploaded_pc ? (
  <>
    {/* View */}
    <button
      onClick={() => handleToggleExpand(order.id)}
      title="View"
      className="text-blue-600 hover:text-blue-800"
    >
      <Eye className="w-5 h-5" />
    </button>

    {/* Bills */}
    <button
      onClick={() => handleViewBilling(order.id)}
      title="Bills"
      className="text-purple-600 hover:text-purple-800"
    >
      <CreditCard className="w-5 h-5" />
    </button>
  </>
)
: order.pc_receipt ? (
                                    <>
                                      <button
                                        onClick={() => handleToggleExpand(order.id)}
                                        title="View"
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        <Eye className="w-5 h-5" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          window.open(
                                            `https://rcs-dms.onlinetn.com/public/pdf/${order.pc_receipt}`,
                                            "_blank"
                                          )
                                        }
                                        title="PC"
                                        className="text-green-600 hover:text-green-800"
                                      >
                                        <FileCheck className="w-5 h-5" />
                                      </button>
                                    </>
                                  ) : null}

                                  <button
                                    onClick={() => toggleDropdown(order.id)}
                                    title="More"
                                    className="text-gray-600 hover:text-gray-900"
                                  >
                                    <MoreVertical className="w-5 h-5" />
                                  </button>
                                </>
                              ) : order.status === "Dispatch" ? (
                                <>
                                  <button
                                    onClick={() => handleToggleExpand(order.id)}
                                    title="View"
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Eye className="w-5 h-5" />
                                  </button>

                                  {order.dc_receipt && (
                                    <button
                                      onClick={() =>
                                        window.open(
                                          `https://rcs-dms.onlinetn.com/public/pdf/${order.dc_receipt}`,
                                          "_blank"
                                        )
                                      }
                                      title="Delivery Challan"
                                      className="text-orange-600 hover:text-orange-800"
                                    >
                                      <FileText className="w-5 h-5" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => toggleDropdown(order.id)}
                                    title="More"
                                    className="text-gray-600 hover:text-gray-900"
                                  >
                                    <MoreVertical className="w-5 h-5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleToggleExpand(order.id)}
                                    title="View"
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Eye className="w-5 h-5" />
                                  </button>
                                  {order.order_list && (
                                    <button
                                      onClick={() => handleViewPdf(order)}
                                      title="Order List"
                                      className="text-green-600 hover:text-green-800"
                                    >
                                      <FileText className="w-5 h-5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                            {openDropdown === order.id && (
                              <div
                                ref={dropdownRef}
                                className={`absolute right-0 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 
                ${index === currentOrders.length - 1 ? "bottom-full mb-2" : "mt-2"}`}
                              >
                                <ul className="text-sm text-gray-700">
                                  {order.status === "Received" && (
                                    <>
                                      {order.order_list && (
                                        <li>
                                          <button
                                            onClick={() => handleViewPdf(order)}
                                            className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100"
                                          >
                                            Order List
                                          </button>
                                        </li>
                                      )}
                                      {order.dc_receipt && (
                                        <li>
                                          <button
                                            onClick={() =>
                                              window.open(
                                                `https://rcs-dms.onlinetn.com/public/pdf/${order.dc_receipt}`,
                                                "_blank"
                                              )
                                            }
                                            className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100"
                                          >
                                            DC
                                          </button>
                                        </li>
                                      )}
                                      {order.uploaded_pc && userRole === "department" && (
                                        <li>
                                          <button
                                            onClick={() => handleDeletePc(order)}
                                            className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
                                          >
                                            Delete PC
                                          </button>
                                        </li>
                                      )}
                                      {order.uploaded_inv && userRole === "pay-cre" && (
                                        <li>
                                          <button
                                            onClick={() => handlePaymentTransfer(order.id)}
                                            className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100"
                                          >
                                            Payment
                                          </button>
                                        </li>
                                      )}
                                      {order.uploaded_inv && userRole === "rcs-store" && (
                                        <li>
                                          <button
                                            onClick={() => handleRequestDelete(order)}
                                            className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
                                          >
                                            Request Delete
                                          </button>
                                        </li>
                                      )}
                                 {order.uploaded_inv && (
  <li>
    <button
      onClick={() => handleViewInvoices(order.id)}
      className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100"
    >
      Invoices
    </button>
  </li>
)}
{!['rcs-store', 'dep-rep'].includes(userRole) && (
  <li>
    <button
      onClick={() => handleViewBilling(order.id)}
      className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100"
    >
      Bills
    </button>
  </li>
)}

                                    </>
                                  )}

                                  {order.status === "Dispatch" && (
                                    <>
                                      {order.order_list && (
                                        <li>
                                          <button
                                            onClick={() => handleViewPdf(order)}
                                            className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100"
                                          >
                                            Order List
                                          </button>
                                        </li>
                                      )}
                                      {userRole === "rcs-store" && (
                                        <li>
                                          <button
                                            onClick={() => handleRequestDespatchCancel(order)}
                                            className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
                                          >
                                            Despatch Cancel
                                          </button>
                                        </li>
                                      )}
                                    </>
                                  )}
                                </ul>
                              </div>
                            )}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {(() => {
                  // 🔹 Add the same period filter check in pagination calculation
                  const filteredOrders = approvedOrders
                    .filter(order => (order.status || '').trim().toLowerCase() === activeTab)
                    .filter(order => {
                      // Department filter
                   if (
  userRole !== 'dep-rep' &&
  departmentFilter !== "all" &&
order.department !== departmentFilter
) {
  return false;
}


                      // Store filter
                      if (storeFilter !== "all" && order.store !== storeFilter) {
                        return false;
                      }
                      // Search text filter
                      const dept = order.depatment || '';
                      const branch = order.branch || '';
                      const type = order.type || '';
                      const created = order.created || '';
                      const formattedDate = new Date(created).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                      const orderId = String(order.id || '').toLowerCase();
                      const combined = `${orderId} ${dept} ${branch} ${type} ${formattedDate}`.toLowerCase();
                      return combined.includes(searchText);

                    })
                    .filter(order => {
                      if (activeTab !== "received") return true;

                      const isReceived = order.status?.toLowerCase() === "received";

                      if (completedFilter === "pc-pending")
                        return isReceived && !order.uploaded_pc;

               
                      if (completedFilter === "pc-uploaded")
                        return isReceived && order.uploaded_pc;

  if (completedFilter === "completed")
    return isReceived && order.uploaded_pc;

                      return true;
                    });
                  const currentPagination = pagination[activeTab];
                  const totalPages = Math.ceil(filteredOrders.length / currentPagination.perPage);
                  const indexOfLastItem = currentPagination.page * currentPagination.perPage;
                  const indexOfFirstItem = indexOfLastItem - currentPagination.perPage;

                  return (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4 px-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-700">Items per page:</label>
                        <select
                          value={currentPagination.perPage}
                          onChange={(e) => {
                            setPagination(prev => ({
                              ...prev,
                              [activeTab]: { page: 1, perPage: Number(e.target.value) }
                            }));
                          }}
                          className="border border-gray-300 rounded px-3 py-1 text-sm"
                        >
                          <option value={50}>50</option>
                          <option value={60}>60</option>
                          <option value={70}>70</option>
                          <option value={100}>100</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPagination(prev => ({
                            ...prev,
                            [activeTab]: { ...prev[activeTab], page: Math.max(prev[activeTab].page - 1, 1) }
                          }))}
                          disabled={currentPagination.page === 1}
                          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                        >
                          Previous
                        </button>

                        <span className="text-sm text-gray-700">
                          Page {currentPagination.page} of {totalPages || 1}
                        </span>

                        <button
                          onClick={() => setPagination(prev => ({
                            ...prev,
                            [activeTab]: { ...prev[activeTab], page: Math.min(prev[activeTab].page + 1, totalPages) }
                          }))}
                          disabled={currentPagination.page === totalPages || totalPages === 0}
                          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                        >
                          Next
                        </button>
                      </div>

                      <div className="text-sm text-gray-600">
                        Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Expanded Order Details View */}
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-semibold text-gray-800">Order Details  <span className="text-xl text-black-600"> #{expandedOrder}</span></h1>
              <button
                onClick={handleBackToListing}
                className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to List
              </button>
            </div>
            {detailsLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading order details...</p>
              </div>
            ) : orderDetails ? (
              <div className="space-y-4">
                {/* Items */}
                {orderDetails && orderDetails.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">  Items</h3>
                    {approvedOrders && expandedOrder && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-blue-100 p-4 mb-4 rounded border border-blue-300 text-sm text-blue-900">

                        <div>
                          <strong>Department:</strong> {approvedOrders.find(o => o.id === expandedOrder)?.depatment || 'N/A'}
                        </div>
                        <div>
                          <strong>Unit:</strong> {approvedOrders.find(o => o.id === expandedOrder)?.branch || 'N/A'}
                        </div>
                        <div>
                          <strong>Store:</strong> {approvedOrders.find(o => o.id === expandedOrder)?.store || 'N/A'}
                        </div>
                        <div>
                          <strong>Date of Indent:</strong> {formatDate(approvedOrders.find(o => o.id === expandedOrder)?.created)}
                        </div>
                        <div>
                          <strong>Order Number:</strong> {approvedOrders.find(o => o.id === expandedOrder)?.id || 'N/A'}
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full table-auto border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left">S.No</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Item Name</th>
                            <th className="border border-gray-300 px-4 py-2 text-center">Rate</th>
                            <th className="border border-gray-300 px-4 py-2 text-center">Ordered</th>
                            {['dispatch', 'received'].includes(
                              (approvedOrders.find(o => o.id === expandedOrder)?.status || '').trim().toLowerCase()
                            ) && (
                                <>
                                  <th className="border border-gray-300 px-4 py-2 text-center">Despatched</th>
                                  <th className="border border-gray-300 px-4 py-2 text-center">Amount excl GST</th>
                                  <th className="border border-gray-300 px-4 py-2 text-center">Gst Amount</th>
                                  <th className="border border-gray-300 px-4 py-2 text-center">Discount</th>
                                  <th className="border border-gray-300 px-4 py-2 text-center">Amount incl GST</th>
                                </>
                              )}
                            {(approvedOrders.find(o => o.id === expandedOrder)?.status || '').trim().toLowerCase() === 'received' && (
                              <>
                                <th className="border border-gray-300 px-4 py-2 text-center">Received Quantity</th>
                                <th className="border border-gray-300 px-4 py-2 text-center">Received Diff</th>
                              </>

                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {orderDetails
                            .filter(item => Number(item.qty) > 0) // 💡 Only include items with qty > 0
                            .map((item, itemIndex) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2">{itemIndex + 1}.</td>
                               <td className="border border-gray-300 px-4 py-2">
  <div className="flex items-center gap-1">
    <span className="font-medium">{item.name}</span>

    {item.unit && (
      <span className="text-gray-500 text-xs">({item.unit})</span>
    )}

    {item.brand && (
      <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-[1px] rounded">
        {item.brand}
      </span>
    )}
  </div>
</td>
                   {/* <td className="border border-gray-300 px-4 py-2 text-right text-sm">{item.rate_range}</td> */}
<td className="border border-gray-300 px-4 py-2 text-right text-sm">
  {(() => {
    if (!item.disp_packs) return item.rate_range;
    
    const packs = item.disp_packs.split('||');
    let rates = [];
    
    packs.forEach(pack => {
      const parts = pack.split('>>');
      const packSize = parseFloat(parts[1]) || 0;
      
      if (packSize > 0) {
        // Packed items: rate is at index 2
        const rate = parseFloat(parts[2]) || 0;
        if (rate > 0) {
          rates.push(`₹${rate}`);
        }
      } else if (packSize === 0) {
        // Loose items: rate is at index 3
        const rate = parseFloat(parts[3]) || 0;
        if (rate > 0) {
          rates.push(`₹${rate}/Kg`);
        }
      }
    });
    
    return rates.length > 0 ? rates.join(', ') : item.rate_range;
  })()}
</td>
                                <td className="border border-gray-300 px-4 py-2 text-right">
                                  {Number(item.qty).toFixed(3)}
                                </td>

                                {['dispatch', 'received'].includes(
                                  (approvedOrders.find(o => o.id === expandedOrder)?.status || '').trim().toLowerCase()
                                ) && (
                                    <>
                                      {/* <td className="border border-gray-300 px-4 py-2 text-right">
                                        {item.disp_qty ? `${Number(item.disp_qty).toFixed(3)}` : 'N/A'}
                                      </td> */}
<td className="border border-gray-300 px-4 py-2 text-right">
  {(() => {
    if (!item.disp_packs) return 'N/A';
    
    const packs = item.disp_packs.split('||');
    let display = [];
    
    packs.forEach(pack => {
      const parts = pack.split('>>');
      const packSize = parseFloat(parts[1]) || 0;
      
      if (packSize > 0) {
        // Packed items: brand>>packSize>>rate>>numPacks>>gst
        const numPacks = parseFloat(parts[3]) || 0;
        if (numPacks > 0) {
          display.push(`${numPacks} Packs`);
        }
      } else if (packSize === 0) {
        // Loose items: brand>>0>>qty>>rate>>gst
        const qty = parseFloat(parts[2]) || 0;
        if (qty > 0) {
          display.push(`${qty.toFixed(3)} Kg`);
        }
      }
    });
    
    return display.join(', ') || 'N/A';
  })()}
</td>
                                      <td className="border border-gray-300 px-4 py-2 text-right">
                                        ₹{(item.disp_qty ? item.disp_qty * item.rate : 0).toFixed(3)}
                                      </td>
                                      <td className="border border-gray-300 px-4 py-2 text-right">
                                        ₹{(item.disp_qty && item.gst
                                          ? ((item.disp_qty * Number(item.rate)) * (Number(item.gst) / 100)).toFixed(1)
                                          : '0.0')}
                                      </td>
                                      <td className="border border-gray-300 px-4 py-2 text-right">
                                        ₹{(item.disp_qty && item.discount
                                          ? ((Number(item.disp_qty) * Number(item.rate)) * (Number(item.discount) / 100)).toFixed(1)
                                          : '0.0')}
                                      </td>
                                      <td className="border border-gray-300 px-4 py-2 text-right">
                                        ₹{(item.disp_qty
                                          ? (
                                            (Number(item.disp_qty) * Number(item.rate)) +
                                            ((Number(item.disp_qty) * Number(item.rate)) * (Number(item.gst || 0) / 100)) -
                                            ((Number(item.disp_qty) * Number(item.rate)) * (Number(item.discount || 0) / 100))
                                          ).toFixed(1)
                                          : '0.0')}
                                      </td>
                                    </>

                                  )}
                                {(approvedOrders.find(o => o.id === expandedOrder)?.status || '').trim().toLowerCase() === 'received' && (
                                  <>
                                    <td className="border border-gray-300 px-2 py-2 text-right">
                                      {item.grn_qty ? `${item.grn_qty} ` : 'Returned / Not Received'}
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2 text-right">
                                      {item.grn_qty && item.disp_qty ? (
                                        <span
                                          className={
                                            Number(item.grn_qty) - Number(item.disp_qty) < 0
                                              ? "text-red-600 font-semibold"
                                              : "text-green-600 font-semibold"
                                          }
                                        >
                                          {(Number(item.grn_qty) - Number(item.disp_qty)).toFixed(3)}
                                        </span>
                                      ) : (
                                        '—'
                                      )}
                                    </td>

                                  </>

                                )}



                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 text-center text-gray-500">
                    <p>No items found for this order</p>
                  </div>
                )}
                {userRole !== 'department' &&
                  expandedOrder &&
                  !['dispatch', 'received'].includes(
                    (approvedOrders.find(o => o.id === expandedOrder)?.status || '').trim().toLowerCase()
                  ) && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={handleDispatchOrder}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-medium"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Proceed with Order
                      </button>
                    </div>
                  )}



              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No detailed information available</p>
              </div>
            )}
          </>
        )}
      </div>
      {showInvoicePopup && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
      <h2 className="text-xl font-semibold mb-4">Invoices</h2>

      {loadingInvoices ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : invoiceList.length === 0 ? (
        <p className="text-gray-600 text-center">No invoices found.</p>
      ) : (
        <ul className="space-y-2">
          {invoiceList.map((inv, i) => (
            <li
              key={i}
              className="flex justify-between items-center border p-2 rounded"
            >
              <span>Invoice #{inv.id}</span>

              <button
                onClick={() =>
                  window.open(
                    `https://rcs-dms.onlinetn.com/public/${inv.file}`,
                    "_blank"
                  )
                }
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="text-right mt-4">
        <button
          onClick={() => setShowInvoicePopup(false)}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      <DeletePc
        open={showDeletePcModal}
        onClose={() => setShowDeletePcModal(false)}
        onConfirm={handleConfirmPcDelete}
        pcDocument={selectedPcData?.pcDocument}
        remarks={selectedPcData?.remarks}
      />
      <InvoiceDelete
        show={showInvDelete}
        onClose={() => setShowInvDelete(false)}
        onConfirm={handleConfirmInvDelete}
        invoiceUrl={
          selectedOrderForInvDelete
            ? `https://rcs-dms.onlinetn.com/public/${selectedOrderForInvDelete.uploaded_inv}`
            : null
        }
      />
<RequestPopup
        open={showDespatchCancelPopup}
        onClose={() => {
          setShowDespatchCancelPopup(false);
          setSelectedOrderForDespatchCancel(null);
          setDespatchCancelItems([]);
        }}
        onConfirm={handleConfirmDespatchCancel}
        items={despatchCancelItems}
        loading={loadingDespatchItems}
        userRole={userRole}
        orderDate={selectedOrderForDespatchCancel?.created}
      />
{showBillingPopup && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-0 rounded-xl shadow-xl w-[650px] max-h-[85vh] overflow-hidden">

      {/* BLUE HEADER */}
      <div className="bg-blue-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold text-center">Billing Details</h2>
      </div>

      <div className="p-6 overflow-y-auto max-h-[70vh]">

        {loadingBilling ? (
          <p className="text-center text-gray-600 py-4">Loading...</p>
        ) : billingList.length === 0 ? (
          <p className="text-gray-600 text-center py-4">No billing data found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 rounded-lg">
              <thead className="bg-blue-50 text-blue-700 font-semibold">
                <tr>
                  <th className="border px-4 py-3 text-left">Invoice No</th>
                  <th className="border px-4 py-3 text-left">Account</th>
             <th className="border px-4 py-3 text-left">Amount</th>
<th className="border px-4 py-3 text-left">Status</th>  {/* NEW COLUMN */}
<th className="border px-4 py-3 text-center">File</th>

                </tr>
              </thead>

              <tbody>
                {billingList.map((bill, i) => (
              <tr key={i} className="hover:bg-blue-50">
  <td className="border px-4 py-2">{bill.invoice}</td>
  <td className="border px-4 py-2">{bill.acc}</td>
  <td className="border px-4 py-2 font-medium">₹{bill.amount}</td>

  {/* NEW STATUS COLUMN */}
 <td className="border px-4 py-2">
  <span
    className={`px-3 py-1 text-sm rounded-full font-medium ${
      bill.status === "Pending"
        ? "bg-red-100 text-red-600"
        : "bg-green-100 text-green-600"
    }`}
  >
    {bill.status === "Pending" ? "Not Paid" : "Paid"}
  </span>
</td>


  <td className="border px-4 py-2 text-center">
    <button
      onClick={() => {
        const fileUrl = `https://rcs-dms.onlinetn.com/public/pdf/${bill.invoice_file}`;
        window.open(fileUrl, "_blank");
      }}
      className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors"
      title="Invoice"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="#2563eb"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    </button>
  </td>
</tr>

                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER BUTTON */}
      <div className="flex justify-end p-4 border-t bg-gray-50">
        <button
          onClick={() => setShowBillingPopup(false)}
          className="px-5 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
};

export default IndentListing;
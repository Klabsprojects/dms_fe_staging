import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../services/api';
import { Eye, FileText, FileCheck, Clipboard, MoreVertical } from "lucide-react";
import RequestPopup from '../components/RequestPopup';// For Request Cancel popup

const IndentApproval = () => {
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // ——— REPLACED expandedOrder/expandedRowRef with selectedOrderId
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [pdfFileName, setPdfFileName] = useState({});
  const [viewType, setViewType] = useState('segment');
  const [orderRates, setOrderRates] = useState(null);
  // ✅ Initialize a stable object to hold refs
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRefs = useRef({});

  // Billing popup state
  const [showBillingPopup, setShowBillingPopup] = useState(false);
  const [billingData, setBillingData] = useState([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const toggleDropdown = (id) => {
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };
const [itemRemarks, setItemRemarks] = useState({});
const [pendingItems, setPendingItems] = useState([]);  // ← ADD THIS LINE

  // ✅ Safely handle clicks outside all dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Ensure dropdownRefs is always defined before checking
      if (!dropdownRefs?.current) return;

      const isClickInside = Object.values(dropdownRefs.current).some(
        (ref) => ref && ref.contains(event.target)
      );

      if (!isClickInside) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleViewBilling = async (orderId) => {
    setBillingLoading(true);
    setShowBillingPopup(true);
    setBillingData([]);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/bill/list/${orderId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        setBillingData(result.data || []);
      } else {
        setError(result.message || "Failed to fetch billing data");
      }
    } catch (err) {
      setError("Network error while fetching billing data");
    } finally {
      setBillingLoading(false);
    }
  };

  // For Request Cancel popup
  const [showRequestPopup, setShowRequestPopup] = useState(false);
  const [selectedIndentForCancel, setSelectedIndentForCancel] = useState(null);
  const [cancelItems, setCancelItems] = useState([]);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const fetchIndents = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/indent/list`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json();

        if (response.ok && !result.error) {
          setIndents(
            (result.data || []).map(indent => ({
              ...indent,
              indentType: indent.indent_type || 'open'
            }))
          );
        }
      } catch (err) {
        setError('Network error while fetching indents');
      } finally {
        setLoading(false);
      }
    };
    fetchIndents();
  }, []);

  // Add this after your other useEffects (around line 120)
useEffect(() => {
  console.log("=== DEBUG STATE ===");
  console.log("selectedOrderId:", selectedOrderId);
  console.log("orderDetails:", orderDetails);
  console.log("pendingItems:", pendingItems);
  console.log("itemsArray:", itemsArray);
  console.log("orderDetails.status:", orderDetails?.status);
}, [selectedOrderId, orderDetails, pendingItems]);
  // ——— fetch full detail for one indent
  const fetchOrderDetails = async (orderId) => {
    setDetailsLoading(true);
    setDetailsError('');
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
      console.log("Fetched order details:", result.data || result);

      if (response.ok && !result.error) {
        const data = result.data || result;

        if (Array.isArray(data)) {
          // Find this indent from the main list using the ID
          const indentMeta = indents.find(i => i.id === orderId);

          setOrderDetails({
            id: orderId,
            status: indentMeta?.status || 'pending',
            indentType: indentMeta?.indent_type || indentMeta?.indentType || '',
            items: data
          });
        } else {
          setOrderDetails(data);
        }
      }
    } catch (err) {
      setDetailsError('Network error while fetching order details');
    } finally {
      setDetailsLoading(false);
    }
  };

  // ——— new: show details (called on “View” button from list)
  const handleViewOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setActionSuccess('');
    setDetailsError('');
    fetchOrderRates(orderId); // ✅ new API call
    fetchOrderDetails(orderId); // do this last
  };

  // ——— new: back to list mode
  const handleBackToList = () => {
    setSelectedOrderId(null);
    setOrderDetails(null);
    setDetailsError('');
    setActionSuccess('');
  };
  const [showRateAlert, setShowRateAlert] = useState(false);
  const [zeroRateItems, setZeroRateItems] = useState([]);

  const handlePlaceOrder = (order) => {
    const allItems = Array.isArray(order.items) ? order.items : [];
    // ✅ all rates > 0 → proceed
    handleApprove(order.id);
  };

  // ——— approve/reject logic unchanged
const handleApprove = async (orderId) => {
  setActionLoading(true);
  setActionSuccess('');
  setError('');

  try {
    const token = localStorage.getItem('authToken');

    // Build payload from pending item details
    const payloadItems = pendingItems.map((item) => ({
      id: item.id,
      rate_range: item.rate_range,
      brand: item.brand,
      remarks: itemRemarks[item.id] || ""
    }));

    const response = await fetch(
      `https://rcs-dms.onlinetn.com/api/v1/indent/${orderId}/approve`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ items: payloadItems })
      }
    );

    const result = await response.json();

    if (response.ok && !result.error) {

      // Success message
      setActionSuccess("Order placed successfully!");

      // 🔥 REFRESH LIST after server updates PDF + status
      const refresh = await fetch(`${API_BASE_URL}/indent/list`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const listResult = await refresh.json();

      if (refresh.ok && !listResult.error) {
        // status auto updated from API
        setIndents(
          (listResult.data || []).map(indent => ({
            ...indent,
            indentType: indent.indent_type || "open"
          }))
        );
      }

      // Go back to list
      setSelectedOrderId(null);
      setOrderDetails(null);
      setPendingItems([]);

    } else {
      setError(result.message || "Failed to approve order");
    }

  } catch (err) {
    setError("Network error while approving");
  }

  setActionLoading(false);
  setTimeout(() => setActionSuccess(''), 3000);
};

const handleReject = async () => {
  if (!rejectReason.trim()) {
    setError('Please provide a reason for rejection');
    return;
  }
  setActionLoading(true);
  setActionSuccess('');
  setError('');
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(
      `${API_BASE_URL}/indent/${selectedOrderId}/reject`,  // ✅ Correct endpoint
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          remarks: rejectReason.trim()  // ✅ Correct payload
        })
      }
    );
    
    const result = await response.json();
    
    if (response.ok && !result.error) {
      setActionSuccess('Order rejected successfully!');
      
      // Refresh the list
      const refresh = await fetch(`${API_BASE_URL}/indent/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const listResult = await refresh.json();
      
      if (refresh.ok && !listResult.error) {
        setIndents(
          (listResult.data || []).map(indent => ({
            ...indent,
            indentType: indent.indent_type || 'open'
          }))
        );
      }
      
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedOrderId(null);
      setOrderDetails(null);
      
      setTimeout(() => setActionSuccess(''), 3000);
    } else {
      setError(result.message || 'Failed to reject order');
    }
  } catch (err) {
    setError('Network error while rejecting order');
  } finally {
    setActionLoading(false);
  }
};

  const handleViewPdf = (indent) => {
    const fileName = getPdfFileName(indent);
    if (fileName) {
      const pdfUrl = `https://rcs-dms.onlinetn.com/public/pdf/${fileName}`;
      window.open(pdfUrl, '_blank');
    }
  };

  const openRejectModal = (orderId) => {
    setSelectedOrderId(orderId);
    setShowRejectModal(true);
    setRejectReason('');
    setError('');
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectReason('');
    setSelectedOrderId(null);
    setError('');
  };

  // ——— remove “expand/collapse” logic from list
  // Instead use details view mode as above

  const calculateTotal = (indent) => {
    const segments = indent.segment || indent.segement;
    if (segments && Array.isArray(segments)) {
      return segments.reduce((sum, seg) => sum + (seg.persons || 0), 0);
    }
    return 0;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canTakeAction = (status) => {
    return (status || '').trim().toLowerCase() === 'pending';
  };

  const getPdfFileName = (indent) => {
    if (indent.pdf_url) return indent.pdf_url;
    if (pdfFileName[indent.id]) return pdfFileName[indent.id];
    return null;
  };

  const fetchAndUpdateSingleIndent = async (orderId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/indent/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (response.ok && !result.error) {
        const updatedIndent = (result.data || []).find(indent => indent.id === orderId);
        if (updatedIndent) {
          setIndents(prevIndents =>
            prevIndents.map(indent =>
              indent.id === orderId ? updatedIndent : indent
            )
          );
        }
      }
    } catch (err) { }
  };

  const itemsArray = (() => {
    if (orderDetails?.items && Array.isArray(orderDetails.items)) return orderDetails.items;
    if (Array.isArray(orderDetails)) return orderDetails;
    if (orderDetails?.data && Array.isArray(orderDetails.data)) return orderDetails.data;
    return [];
  })();

  const capitalize = (s) => s?.charAt(0).toUpperCase() + s?.slice(1);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const storeName = user?.others ? JSON.parse(user.others).store : null;

  const fetchOrderRates = async (orderId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/indent/${orderId}/rate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      console.log("Fetched order rates:", result);

      if (response.ok && !result.error) {
        setOrderRates(result.data || result);
      }
    } catch (err) {
      console.error("Error fetching order rates", err);
    }
  };

  const handleRequestCancel = async (indent) => {
    setSelectedIndentForCancel(indent);
    setCancelLoading(true);
    setShowRequestPopup(true);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/indent/${indent.id}/detail`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        // ✅ FIX HERE:
        const items = Array.isArray(result.data) ? result.data : (result.data?.items || []);
        setCancelItems(items);
      } else {
        setCancelItems([]);
        console.error(result.message || "Failed to fetch order details");
      }
    } catch (err) {
      console.error("Error fetching cancel details:", err);
      setCancelItems([]);
    } finally {
      setCancelLoading(false);
    }
  };
const handleConfirmCancel = async (remarks) => {
  if (!selectedIndentForCancel) return;
  setShowRequestPopup(false);

  try {
    const token = localStorage.getItem("authToken");
    
    // ✅ Use order-reversal endpoint for ind-apr
    const response = await fetch(
      `${API_BASE_URL}/indent/${selectedIndentForCancel.id}/order-reversal`,  // ✅ Correct
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ remarks }),
      }
    );

    const result = await response.json();

    if (response.ok && !result.error) {
      setActionSuccess("Order reversal completed successfully!");
      
      // Refresh list
      const refetch = await fetch(`${API_BASE_URL}/indent/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = await refetch.json();
      if (refetch.ok && !list.error) {
        setIndents(
          (list.data || []).map(indent => ({
            ...indent,
            indentType: indent.indent_type || "open",
          }))
        );
      }
    } else {
      setError(result.message || "Failed to submit reversal request");
    }
  } catch (err) {
    setError("Network error while submitting reversal request");
  }
};

  const fetchPendingIndentItems = async (indentId) => {
    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `https://rcs-dms.onlinetn.com/api/v1/indent/${indentId}/items`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!result.error) {
        setPendingItems(result.data);   // 🔥 Direct assign, NO ID matching
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };





  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 rounded-lg">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-xl font-semibold text-center mb-4 text-gray-800">Indent Approval</h1>
        <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
          {/* Buttons on the left */}
          <div className="flex gap-4">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${viewType === 'segment' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
              onClick={() => setViewType('segment')}
            >
              Segment Indent
              <span className="inline-block bg-yellow-200 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                {indents.filter(indent => Array.isArray(indent.segment) && indent.segment.length > 0 && indent.status?.toLowerCase() === 'pending').length}
              </span>
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${viewType === 'open' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
              onClick={() => setViewType('open')}
            >
              Open Indent
              <span className="inline-block bg-yellow-200 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                {indents.filter(indent => (!Array.isArray(indent.segment) || indent.segment.length === 0) && indent.status?.toLowerCase() === 'pending').length}
              </span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-xs text-gray-700">Purchase Confirmation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span>
              <span className="text-xs text-gray-700">Invoice</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm font-medium text-gray-700">
              {storeName && (
                <p className="text-gray-600">
                  Delivery Store: <span className="font-semibold text-gray-800">{storeName}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
        {actionSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
            {actionSuccess}
          </div>
        )}

        {
          // ——— !selectedOrderId: LIST MODE / selectedOrderId: DETAILS MODE
          !selectedOrderId ? (
            loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading indents...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">S.No</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Order ID</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                      {viewType === 'segment' && (
                        <th className="border border-gray-300 px-4 py-2 text-left">Days</th>
                      )}
                      {viewType === 'segment' && (
                        <th className="border border-gray-300 px-4 py-2 text-center">Residents</th>
                      )}
                      <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indents.length > 0 ? (
                      <>
                        {indents
                          .filter(indent => {
                            if (viewType === 'segment') return Array.isArray(indent.segment) && indent.segment.length > 0;
                            if (viewType === 'open') return !Array.isArray(indent.segment) || indent.segment.length === 0;
                            return false;
                          })
                          .sort((a, b) => {
                            const getPriority = (status) => {
                              const s = (status || '').toLowerCase();
                              if (s === 'pending') return 0;
                              if (s === 'approved') return 1;
                              if (s === 'dispatch') return 2;
                              if (s === 'received') return 3;
                              if (s === 'rejected') return 4;
                              return 5;
                            };
                            return getPriority(a.status) - getPriority(b.status);
                          })
                          .map((indent, index) => (
                            <tr key={`${indent.id}-${indent.status}-${indent.pdf_url || ''}`} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="border border-gray-300 px-4 py-2">{index + 1}.</td>
                              <td className="border border-gray-300 px-4 py-2">{indent.id}</td>
                              <td className="border border-gray-300 px-4 py-2">{formatDate(indent.date)}</td>
                              <td className="border border-gray-300 px-4 py-2">
                                {indent.indentType === 'grocery'
                                  ? 'Grocery'
                                  : indent.indentType === 'dailie'
                                    ? 'Veg/Meat/Dairy'
                                    : indent.indentType === 'open_indent'
                                      ? 'Open'
                                      : indent.indentType === 'medical_indent'
                                        ? 'Medical'
                                        : !indent.indentType
                                          ? 'Open'
                                          : capitalize(indent.indentType)}
                              </td>
                              {viewType === 'segment' && (
                                <td className="border border-gray-300 px-4 py-2">{indent.days}</td>
                              )}

                              {viewType === 'segment' && (
                                <td className="border border-gray-300 px-4 py-2 text-center">
                                  {Array.isArray(indent.segment)
                                    ? indent.segment.reduce((sum, seg) => sum + (parseFloat(seg.persons || 0)), 0)
                                    : 0}
                                </td>
                              )}
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${(indent.status || '').trim().toLowerCase() === 'approved'
                                  ? 'bg-green-100 text-green-700'
                                  : (indent.status || '').trim().toLowerCase() === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : (indent.status || '').trim().toLowerCase() === 'received'
                                      ? 'bg-blue-100 text-blue-700'
                                      : (indent.status || '').trim().toLowerCase() === 'dispatch'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                  {(() => {
                                    const status = (indent.status || '').trim().toLowerCase();
                                    if (status === 'approved') return 'Order Placed';
                                    if (status === 'rejected') return 'Rejected';
                                    if (status === 'received') return 'Order Completed';
                                    if (status === 'dispatch') return 'Despatched';
                                    return 'Pending';
                                  })()}
                                </span>
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center relative">
                                <div className="flex gap-3 justify-center items-center">

                                  {/* 👁️ View always */}
                                  <div className="relative group">
                                    <Eye
                                      className="w-5 h-5 text-blue-600 cursor-pointer hover:text-blue-700"
                                      onClick={() => {
                                        if ((indent.status || "").toLowerCase() === "pending") {
                                          fetchPendingIndentItems(indent.id);   // 👉 Call ONLY for pending
                                        }
                                        handleViewOrder(indent.id);             // Existing logic
                                      }}
                                    />

                                    <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 
        bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 
        group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                      View
                                    </span>
                                  </div>

                                  {/* ------------------- Conditional Buttons ------------------- */}
                                  {(() => {
                                    const status = indent.status?.toLowerCase();

                                    // 🔹 Order placed
                                    if (status === "approved") {
                                      return (
                                        <>
                                          {/* View Order List */}
                                          <FileText
                                            className="w-5 h-5 text-green-600 cursor-pointer hover:text-green-700"
                                            onClick={() => handleViewPdf(indent)}
                                          />

                                          {/* More Option */}
                                          <div className="relative"
                                            ref={(el) => (dropdownRefs.current[indent.id] = el)} >
                                            <MoreVertical
                                              className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-800"
                                              onClick={() => toggleDropdown(indent.id)}
                                            />
                                            {openDropdownId === indent.id && (
                                              <div className="absolute right-0 mt-2 bg-white shadow-lg border rounded-md py-1 w-44 z-10">
                                                <button
                                                  onClick={() => handleRequestCancel(indent)}
                                                  className="block w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-gray-100"
                                                >
                                                  Cancel Order
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      );
                                    }


                                    // 🔹 Despatched
                                    if (status === "dispatch") {
                                      return (
                                        <>
                                          {indent.dc_receipt && (
                                            <div className="relative group">
                                              <FileCheck
                                                className="w-5 h-5 text-purple-600 cursor-pointer hover:text-purple-700"
                                                onClick={() => {
                                                  let path = indent.dc_receipt?.trim() || "";

                                                  // ✅ Ensure it always goes to /public/pdf/
                                                  if (!path.startsWith("http")) {
                                                    // Add '/pdf/' only if not already included
                                                    if (!path.startsWith("pdf/")) path = `pdf/${path}`;
                                                    path = `https://rcs-dms.onlinetn.com/public/${path}`;
                                                  }

                                                  window.open(path, "_blank");
                                                }}
                                              />
                                              <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 
      bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 
      group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                DC Receipt
                                              </span>
                                            </div>
                                          )}

                                          {/* More Option */}
                                          <div className="relative"
                                            ref={(el) => (dropdownRefs.current[indent.id] = el)}>
                                            <MoreVertical
                                              className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-800"
                                              onClick={() => toggleDropdown(indent.id)}
                                            />
                                            {openDropdownId === indent.id && (
                                              <div className="absolute right-0 mt-2 bg-white shadow-lg border rounded-md py-1 w-32 z-10">
                                                <button
                                                  onClick={() => handleViewPdf(indent)}
                                                  className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                  Order List
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      );
                                    }

                                    // 🔹 Order Completed
                                    if (status === "received") {
                                      // Case 1: only PC uploaded
                                      if (indent.uploaded_pc && !indent.uploaded_inv) {
                                        return (
                                          <>
                                            <FileCheck
                                              className="w-5 h-5 text-green-600 cursor-pointer hover:text-green-700"
                                              onClick={() =>
                                                window.open(`https://rcs-dms.onlinetn.com/public/${indent.uploaded_pc}`, "_blank")
                                              }
                                            />
                                            <div className="relative"
                                              ref={(el) => (dropdownRefs.current[indent.id] = el)}>
                                              <MoreVertical
                                                className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-800"
                                                onClick={() => toggleDropdown(indent.id)}
                                              />
                                              {openDropdownId === indent.id && (
                                                <div className="absolute right-0 mt-2 bg-white shadow-lg border rounded-md py-1 w-32 z-10">
                                                  <button
                                                    onClick={() => handleViewPdf(indent)}
                                                    className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                                                  >
                                                    Order List
                                                  </button>
                                                  <button
                                                    onClick={() => handleViewBilling(indent.id)}
                                                    className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                                                  >
                                                    Bill
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </>
                                        );
                                      }

                                      // Case 2: Invoice uploaded
                                      if (indent.uploaded_inv) {
                                        return (
                                          <>
                                            <Clipboard
                                              className="w-5 h-5 text-yellow-600 cursor-pointer hover:text-yellow-700"
                                              onClick={() =>
                                                window.open(`https://rcs-dms.onlinetn.com/public/${indent.uploaded_inv}`, "_blank")
                                              }
                                            />
                                            <div className="relative"
                                              ref={(el) => (dropdownRefs.current[indent.id] = el)}>
                                              <MoreVertical
                                                className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-800"
                                                onClick={() => toggleDropdown(indent.id)}
                                              />
                                              {openDropdownId === indent.id && (
                                                <div className="absolute right-0 mt-2 bg-white shadow-lg border rounded-md py-1 w-36 z-10">
                                                  <button
                                                    onClick={() => handleViewPdf(indent)}
                                                    className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                                                  >
                                                    Order List
                                                  </button>
                                                  {indent.uploaded_pc && (
                                                    <button
                                                      onClick={() =>
                                                        window.open(`https://rcs-dms.onlinetn.com/public/${indent.uploaded_pc}`, "_blank")
                                                      }
                                                      className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                      PC
                                                    </button>
                                                  )}
                                                  <button
                                                    onClick={() => handleViewBilling(indent.id)}
                                                    className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                                                  >
                                                    Bill
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </>
                                        );
                                      }

                                      // Default: view + order list + billing
                                      return (
                                        <>
                                          <FileText
                                            className="w-5 h-5 text-green-600 cursor-pointer hover:text-green-700"
                                            onClick={() => handleViewPdf(indent)}
                                          />
                                          <div className="relative" ref={(el) => (dropdownRefs.current[indent.id] = el)}>
                                            <MoreVertical
                                              className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-800"
                                              onClick={() => toggleDropdown(indent.id)}
                                            />
                                            {openDropdownId === indent.id && (
                                              <div className="absolute right-0 mt-2 bg-white shadow-lg border rounded-md py-1 w-32 z-10">
                                                <button
                                                  onClick={() => handleViewBilling(indent.id)}
                                                  className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                  Bills
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      );
                                    }

                                    // 🔹 Pending → only View
                                    return null;
                                  })()}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </>
                    ) : (
                      <tr>
                        <td colSpan="8" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                          No indents found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            // ——— DETAILS MODE
            <div>
              <button className="mb-4 px-4 py-2 rounded bg-gray-200" onClick={handleBackToList}>
                ← Back to List
              </button>
              {detailsError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {detailsError}
                </div>
              )}
              {detailsLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-2 text-gray-600 text-sm">Loading order details...</p>
                </div>
              ) : orderDetails ? (
                <div className="space-y-4">

                  {itemsArray.length > 0 ? (
                    <div className="bg-white rounded-lg p-5 border border-gray-200 w-full">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Items</h3>
                      <div className="overflow-x-auto">
                        {orderDetails.status?.toLowerCase() === "pending" ? (
                          <table className="w-full table-auto border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border px-4 py-2">S.No</th>
                                <th className="border px-4 py-2">Item</th>
                                <th className="border px-4 py-2 text-center">Rate Range</th>
                                <th className="border px-4 py-2 text-center">Stock</th>
                                <th className="border px-4 py-2 text-center">GST %</th>
                                <th className="border px-4 py-2 text-center">Ordered Qty</th>
                                <th className="border px-4 py-2 text-center">Remarks</th>
                              </tr>
                            </thead>

                            <tbody>
                              {pendingItems.map((p, index) => (
                                <tr key={p.id} className="hover:bg-gray-50">

                                  <td className="border px-4 py-2">{index + 1}</td>

                                  {/* Item Name From Original Details */}
                                  <td className="border px-4 py-2">
                                    <div className="flex items-center gap-2">

                                      {/* Item Name */}
                                      <span className="font-medium">
                                        {itemsArray[index]?.name || "-"}
                                      </span>

                                      {/* Unit */}
                                      {itemsArray[index]?.unit && (
                                        <span className="text-gray-600 text-sm">
                                          ({itemsArray[index].unit})
                                        </span>
                                      )}

                                      {/* Brand (Green Label) */}
                                      {p.brand && (
                                        <span className="bg-green-200 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">
                                          {p.brand}
                                        </span>
                                      )}

                                    </div>
                                  </td>


                                  {/* DIRECT FROM BACKEND */}
                                  <td className="border px-4 py-2 text-center">
                                    {p.rate_range}
                                  </td>

                                  <td className="border px-4 py-2 text-center">
                                    {p.stock}
                                  </td>
                                  <td className="border px-4 py-2 text-center">
  {itemsArray[index]?.gst ?? "-"}
</td>

                                  <td className="border px-4 py-2 text-center">
                                    {Number(p.qty).toFixed(3)}
                                  </td>
<td className="border px-4 py-2 text-center">
  <input
    type="text"
    value={itemRemarks[p.id] || ""}
    onChange={(e) =>
      setItemRemarks(prev => ({ ...prev, [p.id]: e.target.value }))
    }
    className="w-full px-2 py-1 border rounded text-sm"
    placeholder="Enter remarks"
  />
</td>

                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (

                          <>
                            <table className="w-full table-auto border-collapse border border-gray-300 w-full">
                             <thead>
  <tr className="bg-gray-100">
    <th className="border px-2 py-2">S.No</th>
    <th className="border px-2 py-2">Item</th>
    <th className="border px-2 py-2 text-center">Rate Range</th>
    <th className="border px-2 py-2 text-center">GST %</th>
    <th className="border px-2 py-2 text-center">Ordered Qty</th>
    <th className="border px-2 py-2 text-center">Remarks</th>
  </tr>
</thead>

                        <tbody>
  {itemsArray.map((item, index) => (
    <tr key={item.id} className="hover:bg-gray-50">
      
      <td className="border px-2 py-2">{index + 1}</td>

      {/* NAME + UNIT + BRAND */}
   <td className="border px-2 py-2">
  <span className="font-semibold">{item.name}</span>

  {item.unit && (
    <span className="ml-2 text-gray-600">({item.unit})</span>
  )}

  {item.brand && (
    <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-semibold">
      {item.brand}
    </span>
  )}
</td>


      {/* RATE RANGE */}
      <td className="border px-2 py-2 text-center">
        {item.rate_range || "-"}
      </td>

      {/* GST */}
      <td className="border px-2 py-2 text-center">
        {item.gst ?? "-"}
      </td>

      {/* ORDERED QTY */}
      <td className="border px-2 py-2 text-center">
        {Number(item.qty).toFixed(3)}
      </td>

      {/* REMARKS */}
      <td className="border px-2 py-2 text-center">
        {item.remarks || "-"}
      </td>

    </tr>
  ))}
</tbody>


                            </table></>
                        )}

                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-4 border border-gray-200 text-center text-gray-500">
                      <p>No items found for this order</p>
                    </div>
                  )}
                  {canTakeAction(orderDetails.status) ? (
                    <div className="flex justify-center gap-4 mt-6">
                      <button
                        onClick={() => handlePlaceOrder(orderDetails)}
                        disabled={actionLoading}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Place Order
                      </button>
                      <button
                        onClick={() => openRejectModal(orderDetails.id)}
                        disabled={actionLoading}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No detailed information available</p>
                </div>
              )}
            </div>
          )
        }

        {/* Reject Reason Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Reject Order</h2>
              <p className="text-gray-600 mb-4">Please provide a reason for rejecting this order:</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows="4"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeRejectModal}
                  disabled={actionLoading}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : null}
                  Reject Order
                </button>
              </div>
            </div>
          </div>
        )}
        {showRateAlert && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-7 w-full max-w-md mx-4 border border-red-100 animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-red-600 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.73-3L13.73 4a2 2 0 00-3.46 0L3.27 16a2 2 0 001.73 3h.07z"
                  />
                </svg>
                <h2 className="text-lg sm:text-xl font-semibold text-red-700">
                  Rate Value Alert
                </h2>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                The following items have a <span className="font-semibold text-red-600">rate value of 0</span>.
                Please contact your <span className="font-semibold">Store Admin</span> before placing the order.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-5 max-h-48 overflow-y-auto">
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {zeroRateItems.map((item, idx) => (
                    <li key={idx}>
                      <span className="font-medium text-gray-900">{item.name}</span>
                      {item.unit && <span className="text-gray-500 ml-1">({item.unit})</span>}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowRateAlert(false)}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium shadow hover:bg-red-700 active:scale-[0.98] transition-all"
                >
                  Ok
                </button>
              </div>
            </div>
          </div>
        )}

{showRequestPopup && (
          <RequestPopup
            open={showRequestPopup}
            onClose={() => setShowRequestPopup(false)}
            onConfirm={handleConfirmCancel}
            items={cancelItems}
            loading={cancelLoading}
            userRole="ind-apr"
            orderDate={selectedIndentForCancel?.date}
            storeName={storeName}
          />
        )}
        {/* Billing Details Popup */}
        {showBillingPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-3xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
              <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
                <h2 className="text-xl font-semibold">Billing Details</h2>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {billingLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading billing data...</p>
                  </div>
                ) : billingData.length > 0 ? (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Invoice No</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Account</th>
                        <th className="border border-gray-300 px-4 py-2 text-right font-semibold text-gray-700">Amount</th>
                        <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700">Status</th>
                        <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700">File</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingData.map((bill, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{bill.invoice || 'N/A'}</td>
                          <td className="border border-gray-300 px-4 py-2">{bill.acc || 'N/A'}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                            ₹{parseFloat(bill.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${bill.status?.toLowerCase() === 'pending'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                              }`}>
                              {bill.status?.toLowerCase() === 'pending' ? 'Not Paid' : 'Paid'}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {bill.invoice_file ? (
                              <button
                                onClick={() => window.open(`https://rcs-dms.onlinetn.com/public/pdf/${bill.invoice_file}`, '_blank')}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center text-gray-500 py-8">No billing data available</p>
                )}
              </div>

              <div className="border-t px-6 py-4 flex justify-end">
                <button
                  onClick={() => setShowBillingPopup(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndentApproval;

import React, { useEffect, useState, useRef } from 'react';
import { API_BASE_URL } from '../services/api';
import { Eye, FileText, Upload, FileCheck, MoreVertical, Info  } from 'lucide-react';
import DeletePc from '../components/DeletePc';
import RequestPopup from '../components/RequestPopup';

const GrnPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderItems, setSelectedOrderItems] = useState([]);
  const [receivedQuantities, setReceivedQuantities] = useState({});
  const [viewLoading, setViewLoading] = useState(false);
  const [viewedOrderId, setViewedOrderId] = useState(null);
  const [grnMode, setGrnMode] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectIndex, setRejectIndex] = useState(null);
  const [rejectQty, setRejectQty] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedOrderStatus, setSelectedOrderStatus] = useState('');
  const [acceptIndex, setAcceptIndex] = useState(null);
  const [acceptQty, setAcceptQty] = useState('');
  const [actionMode, setActionMode] = useState({ index: null, type: null });
  const [reasonText, setReasonText] = useState({});
  const [showGrnStatus, setShowGrnStatus] = useState(false);
  const [receivedStatus, setReceivedStatus] = useState({});
  const [returnReasons, setReturnReasons] = useState({});
  const [returnMode, setReturnMode] = useState({});
  const [remarks, setRemarks] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadLoading, setUploadLoading] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [deleteOrderPc, setDeleteOrderPc] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); // default 10
  const [showCancelGrnModal, setShowCancelGrnModal] = useState(false);
  const [cancelGrnOrderId, setCancelGrnOrderId] = useState(null);
  const [cancelGrnItems, setCancelGrnItems] = useState([]);
  const [billingPopup, setBillingPopup] = useState(false);
  const [billingList, setBillingList] = useState([]);
  const [currentPackItemIndex, setCurrentPackItemIndex] = useState(null);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [showPacksPopup, setShowPacksPopup] = useState(false);
const [selectedPacksData, setSelectedPacksData] = useState(null);
const [selectedItemName, setSelectedItemName] = useState('');
const [showSummaryPopup, setShowSummaryPopup] = useState(false);
const [summaryData, setSummaryData] = useState(null);
const [grnRemarks, setGrnRemarks] = useState('');
const [editablePacksData, setEditablePacksData] = useState(null);
  const [loadingCancelItems, setLoadingCancelItems] = useState(false);
  const [receivedPacks, setReceivedPacks] = useState({});
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null); // close it
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleBilling = async (order) => {
    const id = order.id; // ✔ use order.id

    if (!id) {
      console.error("Order ID missing!");
      return;
    }

    setBillingPopup(true);
    setLoadingBilling(true);

    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `https://rcs-dms.onlinetn.com/api/v1/bill/list/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!result.error) {
        setBillingList(result.data || []);
      } else {
        setBillingList([]);
      }
    } catch (err) {
      console.error("Billing API error:", err);
      setBillingList([]);
    }

    setLoadingBilling(false);
  };


  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://rcs-dms.onlinetn.com/api/v1//indent/approved/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (Array.isArray(result.data)) {
        setOrders(result.data);

        const existingFiles = {};
        result.data.forEach(order => {
          if (order.uploaded_pc) {
            const fileName = order.uploaded_pc.split('-').pop().replace(/\.[^/.]+$/, '');
            existingFiles[order.id] = fileName;
          }
        });
        setUploadedFiles(existingFiles);
      } else {
        console.warn('Unexpected response structure:', result);
      }
    } catch (error) {
      console.error('Error fetching approved indents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const isWithin24Hours = (timestamp) => {
    if (!timestamp) return false;
    const grnDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - grnDate) / (1000 * 60 * 60);
    return diffInHours <= 24;
  };


  const handleUploadDoc = async (orderId, file) => {
    if (!file) {
      setSuccessMessage('Please select a file to upload.');
      return;
    }

    // Set loading state for this specific order
    setUploadLoading(prev => ({ ...prev, [orderId]: true }));

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/indent/${orderId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage('Document uploaded successfully!');

        // Update uploaded files state
        await fetchOrders(); // Refresh orders to get latest uploaded_pc

        console.log('Upload successful:', result);
      } else {
        const errorResult = await response.json();
        console.error('Upload failed:', errorResult);
        setSuccessMessage('Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during upload:', error);
      setSuccessMessage('An error occurred while uploading the document.');
    } finally {
      // Clear loading state
      setUploadLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  const userRole = localStorage.getItem("userRole");


  const handleViewOrder = async (orderId, orderStatus) => {
    setViewLoading(true);
    setViewedOrderId(orderId);
    setGrnMode(false);
    setSelectedOrderStatus(orderStatus);
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
      if (Array.isArray(result.data)) {
        setSelectedOrderItems(result.data);
        setReceivedQuantities({});
      } else {
        console.warn('Unexpected indent details structure:', result);
        setSelectedOrderItems([]);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setViewLoading(false);
    }
  };

  const handleBack = () => {
    setViewedOrderId(null);
    setSelectedOrderItems([]);
    setGrnMode(false);
  };

  const handleProceedGRN = () => {
    const initialReceived = {};
    const initialStatus = {};

    selectedOrderItems.forEach((item, index) => {
      initialReceived[index] = item.dispatch || '';
      initialStatus[index] = false;
    });

    setReceivedQuantities(initialReceived);
    setReceivedStatus(initialStatus);
    setShowGrnStatus(true);
    setGrnMode(true);
  };

  const handleChangeReceived = (index, value) => {
    setReceivedQuantities((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  // Replace your existing handleSubmitGRN function with this updated version:

const handleSubmitGRN = () => {
  const order = orders.find(o => o.id === viewedOrderId);
  
  const totalReceivedQty = selectedOrderItems
    .filter((item, index) => receivedStatus[index] === 'approve')
    .reduce((sum, item, index) => sum + parseFloat(receivedQuantities[index] || 0), 0);

  const itemCount = selectedOrderItems.filter((item, index) => receivedStatus[index]).length;

  setSummaryData({
    orderDate: order?.created,
    orderNumber: viewedOrderId,
    itemCount: itemCount,
    totalReceivedQty: totalReceivedQty.toFixed(3)
  });

  setShowSummaryPopup(true);
};

const handleConfirmGRN = async () => {
  if (submitting) return;
  setSubmitting(true);

  const today = new Date().toISOString().split('T')[0];
  const itemsPayload = selectedOrderItems.map((item, index) => {
    const status = receivedStatus[index];
    const isReturn = status === 'reject';
    const isReceived = status !== 'not_received';
    const payload = {
      id: item.id,
      received: isReceived ? "yes" : "no",
    };

    if (isReceived) {
      if (!isReturn) {
        payload.qty = Number(receivedQuantities[index] || 0);
        
        // Add received_packs if user edited pack details
        if (receivedPacks[index]) {
          payload.received_packs = receivedPacks[index];
        }
        
        // Calculate and add received_amt
        const amount = calculateAmount(item, index);
        payload.received_amt = Number(amount.toFixed(2));
      }
      payload.return = isReturn ? "yes" : "no";
      const remarkText = isReturn ? returnReasons[index] : remarks[index];
      if (remarkText?.trim()) payload.remarks = remarkText.trim();
    } else {
      const statusNote = returnReasons[index] || '';
      const additionalRemarks = remarks[index] || '';
      payload.remarks = `${statusNote} ${additionalRemarks}`.trim();
    }

    return payload;
  });

  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/indent/${viewedOrderId}/grn`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        received: today,
        items: itemsPayload,
      }),
    });

    if (response.ok) {
      setSuccessMessage('GRN submitted successfully!');
      setShowSummaryPopup(false);
      // setTimeout(() => window.location.reload(), 1500);
    } else {
      const errorResult = await response.json();
      console.error('GRN submission failed:', errorResult);
      setSuccessMessage('GRN submission failed. Please check your input.');
    }
  } catch (error) {
    console.error('Error during GRN submission:', error);
    setSuccessMessage('An error occurred while submitting GRN.');
  } finally {
    setSubmitting(false);
  }
};
  const handleRejectItem = (index) => {
    setRejectIndex(index);
    setAcceptIndex(null);
    setRejectQty('');
    setRejectReason('');
  };

  const confirmReject = () => {
    if (!rejectQty || !rejectReason.trim()) {
      setSuccessMessage('Please enter both quantity and reason.');
      return;
    }

    setReceivedQuantities((prev) => ({
      ...prev,
      [rejectIndex]: Number(rejectQty),
    }));

    console.log(`Item #${rejectIndex + 1} rejected. Qty: ${rejectQty}, Reason: ${rejectReason}`);
    setShowRejectModal(false);
  };

  const handleAcceptItem = (index) => {
    const dispatchedValue = selectedOrderItems[index].dispatch || '';
    setAcceptQty(dispatchedValue);
    setAcceptIndex(index);
    setRejectIndex(null);
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  const visibleItems = selectedOrderItems.filter(item => parseFloat(item.qty || 0) > 0);
  const isStatusSelectedForAll = visibleItems.length > 0 &&
    visibleItems.every((_, index) =>
      ['approve', 'reject', 'not_received'].includes(receivedStatus[index])
    );
  const handleViewPdf = (order) => {
    if (order.pdf_url) {
      const pdfUrl = `https://rcs-dms.onlinetn.com/public/pdf/${order.pdf_url}`;
      window.open(pdfUrl, '_blank');
    }
  };

  const handleReturnItem = (index) => {
    const item = selectedOrderItems[index];
    alert(`Return initiated for ${item.name}`);
    // implement actual return logic here
  };

  const isAnyActionTriggered = Object.values(receivedStatus).some(status =>
    ['approve', 'reject', 'not_received'].includes(status)
  );


  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (orderId) => {
    setOpenDropdown(openDropdown === orderId ? null : orderId);
  };
  // Updated function to open delete modal instead of direct API call
  const handleRequestDelete = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    setDeleteOrderId(orderId);
    setDeleteOrderPc(order?.uploaded_pc || '');
    setShowDeleteModal(true);
    setOpenDropdown(null); // Close the dropdown
  };
const handleRequestGrnCancel = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    setCancelGrnOrderId(orderId);
    setShowCancelGrnModal(true);
    setLoadingCancelItems(true);
    setOpenDropdown(null);
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
      if (result.data && Array.isArray(result.data)) {
        setCancelGrnItems(result.data);
      }
    } catch (error) {
      console.error('Error fetching order items:', error);
      setSuccessMessage('Failed to load order items.');
    } finally {
      setLoadingCancelItems(false);
    }
  };
const handleConfirmCancelGrn = async (remarks) => {
  try {
    const token = localStorage.getItem('authToken');
const response = await fetch(`${API_BASE_URL}/indent/${cancelGrnOrderId}/grn-rev-req`, { // ✅ No leading /
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        remarks: remarks
      }),
    });

    if (response.ok) {
      setSuccessMessage('GRN reversal request submitted successfully!');
      fetchOrders();
    } else {
      const errorResult = await response.json();
      console.error('GRN reversal request failed:', errorResult);
      setSuccessMessage('GRN reversal request failed. Please try again.');
    }
  } catch (error) {
    console.error('Error during GRN reversal request:', error);
    setSuccessMessage('An error occurred while requesting GRN reversal.');
  } finally {
    handleCloseCancelGrnModal();
  }
};

  const handleCloseCancelGrnModal = () => {
    setShowCancelGrnModal(false);
    setCancelGrnOrderId(null);
    setCancelGrnItems([]);
  };
  // Function to handle delete confirmation from modal
  const handleConfirmDelete = async (remarks) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/notifications/indent/pc-del`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          indent: deleteOrderId,
          remarks: remarks
        }),
      });

      if (response.ok) {
        setSuccessMessage('Delete request submitted successfully!');
        fetchOrders(); // Refresh orders
      } else {
        const errorResult = await response.json();
        console.error('Delete request failed:', errorResult);
        setSuccessMessage('Delete request failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during delete request:', error);
      setSuccessMessage('An error occurred while requesting deletion.');
    } finally {
      setShowDeleteModal(false);
      setDeleteOrderId(null);
      setDeleteOrderPc('');
    }
  };
  // Function to handle modal close
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteOrderId(null);
    setDeleteOrderPc('');
  };
  // Pagination calculation
  const indexOfLastOrder = currentPage * rowsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - rowsPerPage;

  const currentOrders = [...orders]
    .sort((a, b) => {
      const statusPriority = (status) => (status?.toLowerCase() === "dispatch" ? 0 : 1);
      const p1 = statusPriority(a.status);
      const p2 = statusPriority(b.status);
      if (p1 !== p2) return p1 - p2;

      return new Date(b.created) - new Date(a.created);
    })
    .slice(indexOfFirstOrder, indexOfLastOrder);
  const [submitting, setSubmitting] = useState(false);
const parsePacksData = (disp_packs) => {
  if (!disp_packs) return [];
  
  const packsArray = disp_packs.split('||');
  return packsArray.map(pack => {
    const [brand, packSize, rate, quantity, extra] = pack.split('>>');
    return {
      brand: brand?.trim(),
      packSize: parseFloat(packSize),
      rate: parseFloat(rate),
      quantity: parseInt(quantity),
      extra: extra
    };
  });
};

const getTotalPacks = (disp_packs) => {
  if (!disp_packs) return 0;
  const parsed = parsePacksData(disp_packs);
  return parsed.reduce((sum, pack) => sum + (pack.quantity || 0), 0);
};
const calculateAmount = (item, index) => {
  const receivedQty = parseFloat(receivedQuantities[index]) || 0;
  
  if (receivedQty === 0) return 0;
  
  // If item doesn't have disp_packs, use direct rate
  if (!item.disp_packs) {
    const rate = parseFloat(item.rate) || 0;
    return receivedQty * rate;
  }
  
  // If item has disp_packs
  const parsedPacks = parsePacksData(item.disp_packs);
  
  // Check if user edited pack details
  if (receivedPacks[index]) {
    // Use edited pack data
    const editedPacks = receivedPacks[index].split('||');
    let totalAmount = 0;
    
    editedPacks.forEach(pack => {
      const [brand, packSize, qty, rate] = pack.split('>>');
      const size = parseFloat(packSize);
      const quantity = parseFloat(qty);
      const rateValue = parseFloat(rate);
      
      if (size === 0) {
        // Loose Qty: rate is per Kg, qty is the Kg amount
        totalAmount += quantity * rateValue;
      } else {
        // Regular packs: rate is per pack, quantity is number of packs
        totalAmount += rateValue * quantity;
      }
    });
    
    return totalAmount;
  }
  
  // Use original dispatch pack data
  let totalAmount = 0;
  
  parsedPacks.forEach(pack => {
    if (pack.packSize === 0) {
      // Loose Qty: pack.rate is the Kg amount, pack.quantity is rate per Kg
      totalAmount += pack.rate * pack.quantity;
    } else {
      // Regular packs: rate per pack × number of packs
      totalAmount += pack.rate * pack.quantity;
    }
  });
  
  return totalAmount;
};
  return (
    <div className="p-6 bg-white shadow-md rounded-md">
      {successMessage && (
        <div className="mb-3 px-4 py-2 bg-green-100 text-green-800 rounded text-sm font-medium">
          {successMessage}
        </div>
      )}

      {!viewedOrderId ? (
        <>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Orders List</h1>

          {loading ? (
            <p className="text-gray-500">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-500">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="border px-4 py-2">S.No</th>
                    <th className="border px-4 py-2">Order ID</th>
                    <th className="border px-4 py-2">Type</th>
                    <th className="border px-4 py-2">Unit</th>
                    <th className="border px-4 py-2">Date</th>
                    <th className="border px-4 py-2">Status</th>
                    <th className="border px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.map((order, index) => (
                    <tr key={order.id} className="hover:bg-gray-50 items" >
                      <td className="border px-4 py-2">{indexOfFirstOrder + index + 1}.</td>
                      <td className="border px-4 py-2">{order.id}</td>

                      <td className="border px-4 py-2">{order.type}</td>
                      <td className="border px-4 py-2">{order.branch}</td>
                      <td className="border px-4 py-2">{formatDate(order.created)}</td>
                      <td className="border px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-sm font-medium ${order.status === 'Dispatch'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'Approved'
                              ? 'bg-blue-100 text-blue-700'
                              : order.status === 'Received'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                          {order.status === 'Approved'
                            ? 'Order Placed'
                            : order.status === 'Dispatch'
                              ? 'Order Despatched'
                              : order.status === 'Received'
                                ? 'Order Completed'
                                : order.status}
                        </span>
                      </td>
                      <td className="border px-2 py-2 relative">
                        <div className="flex items-center gap-2">
                          {/* Approved -> show Order List */}
                          {order.status === "Approved" && (
                            <>
                              {/* View */}
                              <button
                                onClick={() => handleViewOrder(order.id, order.status)}
                                className="text-blue-600 hover:text-blue-800 p-2 rounded"
                                title="View Order Details"
                              >
                                <Eye size={20} />
                              </button>

                              {/* Order List */}
                              {order.order_list && (
                                <button
                                  onClick={() =>
                                    window.open(`https://rcs-dms.onlinetn.com/public/pdf/${order.order_list}`, "_blank")
                                  }
                                  className="text-gray-600 hover:text-gray-800 p-2 rounded"
                                  title="Order List"
                                >
                                  <FileText size={20} />
                                </button>
                              )}
                            </>
                          )}

                          {/* Dispatch -> show DC + More(order list) */}
                          {order.status === "Dispatch" && (
                            <>
                              {/* View */}
                              <button
                                onClick={() => handleViewOrder(order.id, order.status)}
                                className="text-blue-600 hover:text-blue-800 p-2 rounded"
                                title="View Order Details"
                              >
                                <Eye size={20} />
                              </button>

                              {/* DC */}
                              {order.dc_receipt && (
                                <button
                                  onClick={() =>
                                    window.open(`https://rcs-dms.onlinetn.com/public/pdf/${order.dc_receipt}`, "_blank")
                                  }
                                  className="text-orange-600 hover:text-orange-800 p-2 rounded"
                                  title="Delivery Challan"
                                >
                                  <FileText size={20} />
                                </button>
                              )}

                              {/* More Options → Order List */}
                              {order.order_list && (
                                <div className="relative">
                                  <button
                                    onClick={() => toggleDropdown(order.id)}
                                    className="p-2 text-gray-600 hover:text-gray-800 rounded"
                                  >
                                    <MoreVertical size={20} />
                                  </button>

                                  {openDropdown === order.id && (
                                    <div
                                      ref={dropdownRef}
                                      className={`absolute right-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 
    ${index === currentOrders.length - 1 ? "bottom-full mb-2" : "mt-2"}`}
                                    >

                                      <ul className="py-1 text-sm text-gray-700">
                                        <li>
                                          <button
                                            onClick={() =>
                                              window.open(`https://rcs-dms.onlinetn.com/public/pdf/${order.order_list}`, "_blank")
                                            }
                                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                          >
                                            Order List
                                          </button>
                                        </li>
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}

                          {/* Received -> show PC + Upload/Uploaded, and in More DC + Order List */}
                     {/* Received -> Upload/Uploaded PC + View Order (standalone), PC inside More Options */}
{order.status === "Received" && (
  <>
    {/* Upload / Uploaded PC - Standalone */}
    {!uploadedFiles[order.id] ? (
      <label
        title="Upload Signed Purchase Confirmation"
        className={`inline-block cursor-pointer p-2 rounded ${uploadLoading[order.id] ? "text-gray-400 cursor-wait" : "text-green-600 hover:text-green-800"}`}
      >
        <Upload size={20} />
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          disabled={uploadLoading[order.id]}
          onChange={(e) => handleUploadDoc(order.id, e.target.files[0])}
        />
      </label>
    ) : (
      <button
        onClick={() => window.open(`https://rcs-dms.onlinetn.com/public/${order.uploaded_pc}`)}
        title="View Uploaded Purchase Confirmation"
        className="text-green-600 hover:text-green-800 p-2 rounded"
      >
        <FileCheck size={20} />
      </button>
    )}

    {/* View Order - Standalone */}
    <button
      onClick={() => handleViewOrder(order.id, order.status)}
      className="text-blue-600 hover:text-blue-800 p-2 rounded"
      title="View Order Details"
    >
      <Eye size={20} />
    </button>

    {/* More Options → PC + DC + Order List + Bills + Request Delete/GRN Cancel */}
    <div className="relative">
      <button
        onClick={() => toggleDropdown(order.id)}
        className="p-2 text-gray-600 hover:text-gray-800 rounded"
      >
        <MoreVertical size={20} />
      </button>

      {openDropdown === order.id && (
        <div
          ref={dropdownRef}
          className={`absolute right-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 
${index === currentOrders.length - 1 ? "bottom-full mb-2" : "mt-2"}`}
        >
          <ul className="py-1 text-sm text-gray-700">
            {/* PC (Purchase Confirmation) - Now inside dropdown */}
            {order.pdf_url && (
              <li>
                <button
                  onClick={() => handleViewPdf(order)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Purchase Confirmation
                </button>
              </li>
            )}
            
            {order.dc_receipt && (
              <li>
                <button
                  onClick={() =>
                    window.open(`https://rcs-dms.onlinetn.com/public/pdf/${order.dc_receipt}`, "_blank")
                  }
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Delivery Challan
                </button>
              </li>
            )}
            
            {order.order_list && (
              <li>
                <button
                  onClick={() =>
                    window.open(`https://rcs-dms.onlinetn.com/public/pdf/${order.order_list}`, "_blank")
                  }
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Order List
                </button>
              </li>
            )}
            
            <li>
              <button
                onClick={() => handleBilling(order)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Bills
              </button>
            </li>

            {uploadedFiles[order.id] && (
              <li>
                <button
                  onClick={() => handleRequestDelete(order.id)}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                >
                  Request Delete
                </button>
              </li>
            )}
            
        {/* Show Request GRN Cancel ALWAYS (before and after PC upload) for supply role */}
            {JSON.parse(localStorage.getItem('user'))?.role?.toLowerCase() === 'supply' && (
              <li>
                <button
                  onClick={() => handleRequestGrnCancel(order.id)}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                >
                  Request Grn Cancel
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  </>
)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-4">
                {/* Rows per page selector */}
                <div>
                  <label className="mr-2">Rows per page:</label>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1); // reset to first page
                    }}
                    className="border rounded px-2 py-1"
                  >
                    {[10, 30, 50, 60].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                {/* Page navigation */}
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span>
                    Page {currentPage} of {Math.ceil(orders.length / rowsPerPage)}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage(prev =>
                        Math.min(prev + 1, Math.ceil(orders.length / rowsPerPage))
                      )
                    }
                    disabled={currentPage === Math.ceil(orders.length / rowsPerPage)}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>

            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Order #{viewedOrderId} Items</h2>
            </div>
            <div className="flex items-center justify-end gap-6">
              {/* Status Labels Row */}
              <div className="flex items-center gap-3">
                {/* Green: Received & Approved */}
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700">Received & Approved</span>
                </div>

                {/* Orange: Received & Returned */}
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-gray-700">Received & Returned</span>
                </div>

                {/* Red: Not Received */}
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-700">Not Received</span>
                </div>
              </div>

              {/* Back Button */}
              <button
                onClick={handleBack}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Back to Orders
              </button>
            </div>

          </div>

          {viewLoading ? (
            <p className="text-gray-500">Loading items...</p>
          ) : selectedOrderItems.length === 0 ? (
            <p className="text-gray-500">No items found for this order.</p>
          ) : (
            <>
              <div className="overflow-x-auto mb-8">
                <table className="table-auto border-collapse border border-gray-300 w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-2 py-2 text-center w-[50px]">S.No</th>
                      <th
                        className={`border border-gray-300 px-2 py-2 text-left whitespace-nowrap ${isAnyActionTriggered ? 'max-w-[160px]' : 'min-w-[220px]'
                          }`}
                      >
                        Name
                      </th>

                      <th className="border border-gray-300 px-2 py-2 text-center w-[120px]">Order</th>
                      {(selectedOrderStatus === 'Dispatch' || selectedOrderStatus === 'Received') && (
                        <th className="border border-gray-300 px-2 py-2 text-center w-[140px]">Despatch</th>
                      )}
                      {(selectedOrderStatus === 'Dispatch' || selectedOrderStatus === 'Received') && (
                        <>
                          <th className="border border-gray-300 px-2 py-2 text-center w-[140px]">Dispatch Diff </th>
                        </>
                      )}

                      {selectedOrderStatus.toLowerCase() === 'received' && (
                        <>
                          <th className="border border-gray-300 px-2 py-2 text-center w-[140px]">Received </th>
                          <th className="border border-gray-300 px-2 py-2 text-center w-[140px]">Recieved Diff</th>
                          <th className="border border-gray-300 px-2 py-2 text-center w-[140px]">Return (24 Hrs)</th>
                        </>
                      )}


                      {grnMode && showGrnStatus && (
                        <>
                          <th className="border border-gray-300 px-2 py-2 text-center w-[160px] whitespace-nowrap">Received Confirmation</th>
                              <th className="border border-gray-300 px-2 py-2 text-center w-[120px]">Amount</th>
                          <th className="border border-gray-300 px-2 py-2 text-center w-[80px] whitespace-nowrap">Action</th>

                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrderItems
                      .filter(item => parseFloat(item.qty || 0) > 0)
                      .map((item, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-2 py-2 text-center">{index + 1}</td>
                          <td className="border border-gray-300 px-2 py-2 text-left break-words">
                            <span className="text-sm text-gray-800">
                              {item.name || 'N/A'}{" "}
                              {item.unit && (
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
                                  {item.unit}
                                </span>
                              )}
                            </span>
                          </td>

                          <td className="border border-gray-300 px-2 py-2 text-right">
                            {parseFloat(item.qty || 0).toFixed(3)}
                          </td>
                          {(selectedOrderStatus === 'Dispatch' || selectedOrderStatus === 'Received') && (
                            <td className="border border-gray-300 px-2 py-2 text-right">
                              {parseFloat(item.disp_qty || 0).toFixed(3)}
                            </td>
                          )}
                          {(selectedOrderStatus === 'Dispatch' || selectedOrderStatus === 'Received') && (
                            <>
                              <td className="border border-gray-300 px-2 py-2 text-right">
                                {(parseFloat(item.disp_qty || 0) - parseFloat(item.qty || 0)).toFixed(3)}

                              </td>
                            </>
                          )}

                          {selectedOrderStatus.toLowerCase() === 'received' && (
                            <>
                              <td className="border border-gray-300 px-2 py-2 text-right">
                                {item.grn_qty
                                  ? `${item.grn_qty} ${item.unit || ''}`
                                  : 'Returned / Not Received'}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-right">
                                {item.grn_qty && item.disp_qty
                                  ? `${(parseFloat(item.grn_qty) - parseFloat(item.disp_qty)).toFixed(2)} ${item.unit || ''}`
                                  : '-'}
                              </td>


                              <td className="border border-gray-300 px-2 py-2 text-center">
                                {item.grn_submitted_at && isWithin24Hours(item.grn_submitted_at) ? (
                                  <button
                                    onClick={() => handleReturnItem(index)}
                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                  >
                                    Return
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-sm">Not Available</span>
                                )}
                              </td>
                            </>

                          )}



                          {grnMode && showGrnStatus && (
                            <>
                              {/* CONFIRMATION COLUMN */}
                              <td className="border border-gray-300 px-2 py-2">
    
{receivedStatus[index] === 'approve' && (
  <div className="flex items-center gap-2">
    {(() => {
      const packSize = item.packs && item.disp_qty
        ? parseFloat(item.disp_qty) / parseInt(item.packs)
        : 0.1;

      return (
        <>
          {/* Show input field for items WITHOUT disp_packs OR read-only for items WITH disp_packs */}
          {!item.disp_packs ? (
            <input
              type="number"
              step={packSize}
              min={0}
              max={item.disp_qty}
              className="border border-gray-300 rounded px-1 py-2 text-sm w-[80px] text-right"
              value={
                receivedQuantities[index] !== undefined && receivedQuantities[index] !== ''
                  ? receivedQuantities[index]
                  : item.disp_qty !== undefined
                    ? item.disp_qty
                    : ''
              }
              onChange={(e) => {
                let value = parseFloat(e.target.value);
                if (value > item.disp_qty) value = item.disp_qty;
                
                if (packSize > 0.1) {
                  const remainder = value % packSize;
                  if (remainder !== 0) {
                    value = Math.round(value / packSize) * packSize;
                  }
                } else {
                  value = Math.round(value * 10) / 10;
                }

                setReceivedQuantities((prev) => ({
                  ...prev,
                  [index]: value
                }));
              }}
              placeholder="Qty"
            />
          ) : (
            <div className="border border-gray-300 bg-gray-50 rounded px-2 py-2 text-sm w-[80px] text-right font-medium text-gray-700">
              {receivedQuantities[index] !== undefined && receivedQuantities[index] !== ''
                ? receivedQuantities[index]
                : item.disp_qty !== undefined
                  ? item.disp_qty
                  : '0'}
            </div>
          )}

          <span className="text-xs text-gray-600">{item.unit || ''}</span>

          {/* Info Icon for items WITH disp_packs */}
          {item.disp_packs && (
            <button
              onClick={() => {
                const parsedData = parsePacksData(item.disp_packs);
                setSelectedPacksData(parsedData);
                setEditablePacksData(parsedData);
                setSelectedItemName(item.name);
                setCurrentPackItemIndex(index);
                setShowPacksPopup(true);
              }}
              className="text-blue-600 hover:text-blue-800 p-1 rounded"
              title="View Pack Details"
            >
              <Info size={16} />
            </button>
          )}
        </>
      );
    })()}
  </div>
)}


                                {receivedStatus[index] === 'reject' && (
                                  <input
                                    type="text"
                                    className="border border-red-300 rounded px-1 py-2 text-sm w-full"
                                    value={returnReasons[index] || ''}
                                    onChange={(e) =>
                                      setReturnReasons((prev) => ({
                                        ...prev,
                                        [index]: e.target.value
                                      }))
                                    }
                                    placeholder="Reason for return"
                                  />
                                )}


                                {receivedStatus[index] === 'not_received' && (
                                  <input
                                    type="text"
                                    className="border border-gray-300 rounded px-1 py-2 text-sm w-full"
                                    value={remarks[index] || ''}
                                    onChange={(e) =>
                                      setRemarks((prev) => ({
                                        ...prev,
                                        [index]: e.target.value
                                      }))
                                    }
                                    placeholder="Remarks"
                                  />
                                )}
                              </td>
    {/* AMOUNT COLUMN - ADD THIS */}
 {/* AMOUNT COLUMN */}
<td className="border border-gray-300 px-2 py-2 text-right">
  {receivedStatus[index] === 'approve' ? (
    (() => {
      const amount = calculateAmount(item, index);
      return (
        <span className="font-semibold text-gray-800">
          {amount > 0 ? (
            `₹${amount.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`
          ) : (
            <span className="text-red-500">Rate missing</span>
          )}
        </span>
      );
    })()
  ) : (
    <span className="text-gray-400">-</span>
  )}
</td>
                              {/* STATUS COLUMN */}
                              <td className="border border-gray-300 px-2 py-2 text-center align-middle">
                                <div className="flex items-center justify-center gap-2 ">
                                  {/* Approve */}
                                  <div className="flex flex-col items-center">
                                    <button
                                      onClick={() => {
                                        // Set status to 'approve'
                                        setReceivedStatus((prev) => ({
                                          ...prev,
                                          [index]: 'approve'
                                        }));

                                        // Pre-fill quantity only if not already filled
                                        setReceivedQuantities((prev) => {
                                          if (prev[index] !== undefined && prev[index] !== '') {
                                            return prev;
                                          }
                                          return {
                                            ...prev,
                                            [index]: item.disp_qty || ''
                                          };
                                        });
                                      }}
                                      className={`w-10 h-8 rounded-md flex items-center justify-center transition ${!receivedStatus[index] || receivedStatus[index] === 'approve'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-300 text-gray-500'
                                        }`}
                                      title="Approve"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                      >
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                      </svg>
                                    </button>

                                  </div>

                                  {/* Reject */}
                                  <div className="flex flex-col items-center">
                                    <button
                                      onClick={() =>
                                        setReceivedStatus((prev) => ({
                                          ...prev,
                                          [index]: 'reject'
                                        }))
                                      }
                                      className={`w-10 h-8 rounded-md flex items-center justify-center transition ${!receivedStatus[index] || receivedStatus[index] === 'reject'
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-300 text-gray-500'
                                        }`}
                                      title="Return"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                      >
                                        <path d="M10 9V5l-7 7 7 7v-4h4.5c2.5 0 4.5 2 4.5 4.5S17 24 14.5 24H14v2h.5C18.1 26 21 23.1 21 19.5S18.1 13 14.5 13H10z" />
                                      </svg>
                                    </button>
                                  </div>

                                  {/* Not Received */}
                                  <div className="flex flex-col items-center">
                                    <button
                                      onClick={() =>
                                        setReceivedStatus((prev) => ({
                                          ...prev,
                                          [index]: 'not_received'
                                        }))
                                      }
                                      className={`w-10 h-8 rounded-md flex items-center justify-center transition ${!receivedStatus[index] || receivedStatus[index] === 'not_received'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-300 text-gray-500'
                                        }`}
                                      title="Not Received"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                      >
                                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.66 14.95L7.05 7.34a8 8 0 0110.61 10.61zM6.34 9.05l10.61 10.61a8 8 0 01-10.61-10.61z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </td>


                            </>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {!grnMode && selectedOrderStatus === 'Dispatch' ? (

                <div className="flex justify-center">
                  <button
                    onClick={handleProceedGRN}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                  >
                    Proceed with GRN
                  </button>
                </div>
              ) : grnMode ? (
                <div className="flex justify-center">
                  <button
                    onClick={handleSubmitGRN}
                    disabled={!isStatusSelectedForAll || submitting}
                    className={`px-6 py-3 rounded-lg text-white transition ${isStatusSelectedForAll && !submitting
                        ? 'bg-blue-700 hover:bg-blue-800'
                        : 'bg-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {submitting ? 'Submitting...' : 'Submit GRN'}
                  </button>

                </div>
              ) : null}
            </>
          )}
        </>
      )}

      {/* Delete PC Modal */}
      <DeletePc
        open={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        pcDocument={deleteOrderPc}
        remarks=""
      />
      {/* Cancel GRN Modal */}
<RequestPopup
  open={showCancelGrnModal}
  onClose={handleCloseCancelGrnModal}
  onConfirm={handleConfirmCancelGrn}
  items={cancelGrnItems}
  loading={loadingCancelItems}
  userRole={userRole}
  orderDate={orders.find(o => o.id === cancelGrnOrderId)?.created}
  storeName={orders.find(o => o.id === cancelGrnOrderId)?.branch}
/>
      {billingPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-0 rounded-xl shadow-xl w-[750px] max-h-[85vh] overflow-hidden">

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
                        <th className="border px-4 py-3 text-left">Invoice</th>
                        <th className="border px-4 py-3 text-left">Account</th>
                        <th className="border px-4 py-3 text-right">Amount</th>
                        <th className="border px-4 py-3 text-center">Status</th>
                        <th className="border px-4 py-3 text-center">File</th>
                      </tr>
                    </thead>

                    <tbody>
                      {billingList.map((bill, i) => (
                        <tr key={i} className="hover:bg-blue-50">
                          <td className="border px-4 py-2">{bill.invoice}</td>
                          <td className="border px-4 py-2">{bill.acc}</td>
                          <td className="border px-4 py-2 font-medium text-right">
                            ₹{parseFloat(bill.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="border px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${bill.status?.toLowerCase() === 'pending'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                              }`}>
                              {bill.status?.toLowerCase() === 'pending' ? 'Not Paid' : 'Paid'}
                            </span>
                          </td>
                          <td className="border px-4 py-2 text-center">
                            <button
                              onClick={() =>
                                window.open(
                                  `https://rcs-dms.onlinetn.com/public/pdf/${bill.invoice_file}`,
                                  "_blank"
                                )
                              }
                              className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 p-2 rounded"
                              title="View File"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 12h6m-6 4h6"
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

            <div className="flex justify-end p-4 border-t bg-gray-50">
              <button
                onClick={() => setBillingPopup(false)}
                className="px-5 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

{/* Packs Details Popup */}
{showPacksPopup && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white rounded-xl shadow-xl w-[900px] max-h-[80vh] overflow-hidden">
      
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold">Pack Details</h2>
        <p className="text-sm text-blue-100 mt-1">{selectedItemName}</p>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto max-h-[60vh]">
        <table className="min-w-full border border-gray-300 rounded-lg">
          <thead className="bg-blue-50 text-blue-700 font-semibold">
            <tr>
              <th className="border px-4 py-3 text-left w-[50%]">Brand</th>
              <th className="border px-4 py-3 text-right w-[15%]">Rate</th>
              <th className="border px-4 py-3 text-right w-[20%]">Received</th>
              <th className="border px-4 py-3 text-right w-[15%]">Total Qty</th>
            </tr>
          </thead>
          <tbody>
            {editablePacksData && editablePacksData.map((pack, idx) => (
              <tr key={idx} className="hover:bg-blue-50">
                <td className="border px-4 py-2">
                  {pack.packSize === 0 ? (
                    'Loose Qty'
                  ) : (
                    <>
                      {pack.brand}
                      <span className="ml-2 inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded">
                        {pack.packSize < 1 
                          ? `${(pack.packSize * 1000).toFixed(0)}g` 
                          : `${pack.packSize}Kg`}
                      </span>
                    </>
                  )}
                </td>
                <td className="border px-4 py-2 text-right">
                  {pack.packSize === 0 
                    ? `₹${pack.quantity}/Kg`
                    : `₹${pack.rate}`}
                </td>
                <td className="border px-4 py-2">
                  <div className="flex items-center gap-2">
                    {pack.packSize === 0 ? (
                      <>
                        <input
                          type="number"
                          step="0.001"
                          value={pack.rate}
                          onChange={(e) => {
                            const updated = [...editablePacksData];
                            updated[idx].rate = parseFloat(e.target.value) || 0;
                            setEditablePacksData(updated);
                          }}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-right font-medium focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600 font-medium whitespace-nowrap">Kg</span>
                      </>
                    ) : (
                      <>
                        <input
                          type="number"
                          value={pack.quantity}
                          onChange={(e) => {
                            const updated = [...editablePacksData];
                            updated[idx].quantity = parseInt(e.target.value) || 0;
                            setEditablePacksData(updated);
                          }}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-right font-medium focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600 font-medium whitespace-nowrap">Packs</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="border px-4 py-2 text-right font-semibold">
                  {pack.packSize === 0 
                    ? `${pack.rate} Kg` 
                    : `${(pack.packSize * pack.quantity).toFixed(3)} Kg`}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan="3" className="border px-4 py-2 text-right font-bold">Total:</td>
              <td className="border px-4 py-2 text-right font-bold">
                {editablePacksData?.reduce((sum, p) => 
                  sum + (p.packSize === 0 ? p.rate : p.packSize * p.quantity), 0
                ).toFixed(3)} Kg
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Remarks Field */}
        <div className="mt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Remarks
          </label>
          <textarea
            value={remarks[currentPackItemIndex] || ''}
            onChange={(e) =>
              setRemarks((prev) => ({
                ...prev,
                [currentPackItemIndex]: e.target.value
              }))
            }
            placeholder="Enter remarks for this item..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows="3"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end p-4 border-t bg-gray-50">
        <button
          onClick={() => {
            // Calculate total quantity from edited packs
            const totalQty = editablePacksData?.reduce((sum, pack) => 
              sum + (pack.packSize === 0 ? pack.rate : pack.packSize * pack.quantity), 0
            ) || 0;
            
            // Find the current item index in selectedOrderItems
            const itemIndex = selectedOrderItems.findIndex(item => item.name === selectedItemName);
            
            // Update the received quantity for this item
            if (itemIndex !== -1) {
              setReceivedQuantities((prev) => ({
                ...prev,
                [itemIndex]: totalQty.toFixed(3)
              }));

              // Store the received packs data in the required format
              const packsString = editablePacksData.map(pack => {
                if (pack.packSize === 0) {
                  // Loose quantity format: brand>>0>>qty>>rate>>gst
                  return `${pack.brand}>>0>>${pack.rate}>>${pack.quantity}>>0`;
                } else {
                  // Regular pack format: brand>>packSize>>rate>>quantity>>gst
                  return `${pack.brand}>>${pack.packSize}>>${pack.rate}>>${pack.quantity}>>0`;
                }
              }).join('||');
              
              setReceivedPacks((prev) => ({
                ...prev,
                [itemIndex]: packsString
              }));
            }
            
            // Close popup and reset states
            setShowPacksPopup(false);
            setSelectedPacksData(null);
            setEditablePacksData(null);
            setSelectedItemName('');
          }}
          className="px-5 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
{/* GRN Summary Popup */}
{showSummaryPopup && summaryData && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white rounded-xl shadow-xl w-[600px] overflow-hidden">
      
      {/* Header */}
      <div className="bg-green-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold">GRN Dispatch Summary</h2>
        <p className="text-sm text-green-100 mt-1">Please review before final submission</p>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Order Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="text-lg font-bold text-gray-800">#{summaryData.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="text-lg font-bold text-gray-800">{formatDate(summaryData.orderDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-lg font-bold text-gray-800">{summaryData.itemCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Received Quantity</p>
              <p className="text-lg font-bold text-green-600">{summaryData.totalReceivedQty}</p>
            </div>
          </div>
        </div>

        {/* Remarks Field */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Remarks
          </label>
          <textarea
            value={grnRemarks}
            onChange={(e) => setGrnRemarks(e.target.value)}
            placeholder="Enter any additional remarks for this GRN..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            rows="4"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
        <button
          onClick={() => {
            setShowSummaryPopup(false);
            setSummaryData(null);
            setGrnRemarks('');
          }}
          className="px-5 py-2 bg-gray-500 text-white rounded-md font-semibold hover:bg-gray-600"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirmGRN}
          disabled={submitting}
          className={`px-5 py-2 rounded-md font-semibold ${
            submitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          {submitting ? 'Submitting...' : 'Confirm & Submit GRN'}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default GrnPage;
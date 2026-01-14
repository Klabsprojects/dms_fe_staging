import React, { useRef, useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';
import { DateRange } from 'react-date-range';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { Plus, Minus } from "lucide-react"
import RejectedIndent from './RejectedIndent';
import { useNavigate, useLocation } from 'react-router-dom';

const IndentCreation = () => {
  // Existing states
  const [segments, setSegments] = useState([]);
  const [segmentOptions, setSegmentOptions] = useState([]);
  const [inventoryData, setInventoryData] = useState(null);
  const [indentForDays, setIndentForDays] = useState('');
  const [recentOrders, setRecentOrders] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [indentDetails, setIndentDetails] = useState([]);
  const [showIndentDetails, setShowIndentDetails] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [brandList, setBrandList] = useState([]);
  const [orderDays, setOrderDays] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [savedSegments, setSavedSegments] = useState([]);
  const [savedDays, setSavedDays] = useState(0);
  const [indents, setIndents] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  // Add these new states for reorder functionality
  const [showReorderEdit, setShowReorderEdit] = useState(false);
  const [reorderEditItems, setReorderEditItems] = useState([]);
  const [detailsError, setDetailsError] = useState('');
  const [showExpandedView, setShowExpandedView] = useState(false);
  const [storeDetails, setStoreDetails] = useState(null);
  const [storeLoading, setStoreLoading] = useState(false);
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const [leftHeight, setLeftHeight] = useState(0);
  const pickerRef = useRef(null);
  const dateDropdownRef = useRef(null);
  const [segmentRows, setSegmentRows] = useState([{ id: Date.now(), segmentId: "" }]);
  const [editableDate, setEditableDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  // New states for date restriction
  const [dateRestrictionError, setDateRestrictionError] = useState('');
  const [isDateCheckLoading, setIsDateCheckLoading] = useState(false);
  // New states for Open Indent
  // "grocery" = Grocery Segment, "dailie" = Veg/Meat/Dairy, "open" = Open Indent
  const [indentType, setIndentType] = useState('grocery');
  const [groceryItems, setGroceryItems] = useState([]);
  const [groceryItemsLoading, setGroceryItemsLoading] = useState(false);
const [openIndentItems, setOpenIndentItems] = useState([
    { itemId: '', name: '', quantity: '', unit: 'Kg' }
]);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [orderSummaryData, setOrderSummaryData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brandOptions, setBrandOptions] = useState([]);
const [showRejectedIndent, setShowRejectedIndent] = useState(false);
const [selectedRejectedIndent, setSelectedRejectedIndent] = useState(null);
const navigate = useNavigate(); // Already exists
const location = useLocation(); // Add this
const fetchBrandList = async () => {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${API_BASE_URL}/brand/list`, {
      headers: { Authorization: token }
    });
    const data = await res.json();
    if (!data.error) setBrandOptions(data.data);
  } catch (err) {
    console.error("Error fetching brand list:", err);
  }
};


  // Function to check if indent already exists for the selected date and type
  const normalizeType = (t) => {
    if (!t) return '';
    const lower = t.toLowerCase();
    if (lower === 'veg/meat/dairy') return 'dailie';
    return lower;
  };

  // ✅ Renamed from normalizeType to mapIndentType
  const mapIndentType = (type) => {
    switch (type?.toLowerCase()) {
      case 'grocery':
        return 'grocery';
      case 'dailie':
        return 'dailie';
      case 'open':          // UI value
      case 'open_indent':   // API value
        return 'open_indent';
      default:
        return type?.toLowerCase();
    }
  };
  // Temporary dummy function to disable date restrictions
  const checkIndentExistsForDate = async (date, type, showLoading = true) => {
    if (showLoading) setIsDateCheckLoading(true);
    // Always return false to disable all date restrictions
    if (showLoading) setIsDateCheckLoading(false);
    return false;
  };

  // Handle date change with validation
  const handleDateChange = async (newDate) => {
    setEditableDate(newDate);
    setDateRestrictionError('');

    // Check if indent of same type already exists for this date
    const exists = await checkIndentExistsForDate(newDate, indentType);

    if (exists) {
      const typeText = indentType === 'grocery'
        ? 'Grocery Segment'
        : indentType === 'dailie'
          ? 'Veg/Meat/Dairy Segment'
          : 'Open';

      setDateRestrictionError(`${typeText} indent already exists for ${new Date(newDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
        }. Please select a different date.`);
    }
  };
const handleBrandChange = (index, value) => {
  const updated = [...openIndentItems];
  updated[index].brandId = value;
  setOpenIndentItems(updated);
};
  // Handle indent type change with validation
  const handleIndentTypeChange = async (newType) => {
    setIndentType(newType);
    setDateRestrictionError('');

    if (newType === 'medical') {
      // Clear previous grocery/dailie rows instantly
      setSegments([{ segmentId: '', category: '', itemId: '', quantity: '' }]);
    } else {
      // Clear previous medical rows instantly
      setSegments([{ segmentId: '', category: '', diet: '', nos: '' }]);
    }

    // 🔹 Check if indent of new type already exists for current date
    const exists = await checkIndentExistsForDate(editableDate, newType);

    if (exists) {
      const typeText =
        newType === 'grocery'
          ? 'Grocery Segment'
          : newType === 'dailie'
            ? 'Veg/Meat/Dairy Segment'
            : newType === 'open'
              ? 'Open Indent'
              : newType === 'medical'
                ? 'Medical Indent'
                : 'Medical';

      setDateRestrictionError(`${typeText} indent already exists for ${new Date(editableDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })}. Please select a different date.`);
    }
  };


  const fetchGroceryItems = async () => {
    try {
      setGroceryItemsLoading(true);
      const token = localStorage.getItem('authToken');

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch(`${API_BASE_URL}/segment/items`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      const orderId = result.id || result.data?.id;
      if (orderId) {
        fetchOrderDetails(orderId);
        setShowIndentDetails(false);
        setShowExpandedView(true);
      }


      if (result.error === false) {
        setGroceryItems(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching grocery items:', error);
    } finally {
      setGroceryItemsLoading(false);
    }
  };

  // Open indent item handlers
  const handleOpenIndentItemChange = (index, field, value) => {
    const updated = [...openIndentItems];
    updated[index][field] = value;

    // If changing item, update name and unit
    if (field === 'itemId') {
      const selectedItem = groceryItems.find(item => item.id.toString() === value);
      if (selectedItem) {
        updated[index].name = selectedItem.name;
        updated[index].unit = selectedItem.indent;
        const reorderMatch = reorderItems.find(re => re.id.toString() === value);
        updated[index].reorderQty = reorderMatch ? reorderMatch.qty : 0;
      }
      else {
        updated[index].name = '';
        updated[index].unit = 'Kg';
      }
    }
if (field === "brandId") {
  updated[index].brandId = value;
}


    setOpenIndentItems(updated);
  };

  const addOpenIndentItem = () => {
    setOpenIndentItems([...openIndentItems, { itemId: '', name: '', quantity: '', unit: 'Kg' }]);
  };
  // Handler for reorder item changes
  const handleReorderItemChange = (index, field, value) => {
    const updated = [...reorderEditItems];
    updated[index][field] = value;
    setReorderEditItems(updated);
  };
  // Handle order button click for reorder items
  const handleReorderOrderClick = () => {
    if (!showReorderEdit) {
      // Enable edit mode and populate editable items
      const editableItems = reorderItems.map(item => ({
        ...item,
        editableQty: item.qty
      }));
      setReorderEditItems(editableItems);
      setShowReorderEdit(true);
    } else {
      // Disable edit mode
      setShowReorderEdit(false);
      setReorderEditItems([]);
    }
  };
  const removeOpenIndentItem = (index) => {
    if (openIndentItems.length > 1) {
      const updated = openIndentItems.filter((_, i) => i !== index);
      setOpenIndentItems(updated);
    }
  };

  const fetchSegments = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/segment`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        // setSegmentOptions(result.data || []);
        const options = result.data || [];
        setSegmentOptions(options);
        setSegments(
          options.map(option => ({
            segmentId: option.id.toString(),
            category: option.category,
            diet: option.diet || '',
            nos: ''
          }))
        );

      }
    } catch (err) {
      console.error('Error fetching segments:', err);
    }
  };

  useEffect(() => {
    if (indentType !== 'medical') {
      fetchSegments();
    }

  }, [indentType]);

  const fetchMedicalSegments = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://rcs-dms.onlinetn.com/api/v1//master/eater-type`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        const options = result.data || [];
        setSegmentOptions(options);
        setSegments(
          options.map(option => ({
            segmentId: option.id.toString(),
            category: option.name || '',
            item: '',
            reorderQty: ''
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching medical segments:', err);
    }
  };

  useEffect(() => {
    fetchGroceryItems();
    fetchReorderItems();
    fetchInventory();
    fetchStoreDetails(); // Add this line
    fetchBrandList();

  }, []);
  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/master/inventory`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        setInventoryData(result);

        if (result.data && result.data.length > 0) {
          const deptData = result.data[0]; // assuming single department like in your JSON

          // 🔁 Dynamically set days based on indentType
          if (indentType === 'grocery') {
            setIndentForDays(deptData.groceryIndent?.toString() || '1');
          } else if (indentType === 'dailie') {
            setIndentForDays(deptData.vegMeatDairyIndent?.toString() || '1');
          } else {
            setIndentForDays(deptData.order?.toString() || '1'); // fallback for open
          }
        }
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };
  useEffect(() => {
    if (!inventoryData || !inventoryData.data || inventoryData.data.length === 0) return;

    const dept = inventoryData.data[0]; // assuming single dept as per response

    if (indentType === 'grocery') {
      setIndentForDays(dept.groceryIndent?.toString() || '1');
    } else if (indentType === 'dailie') {
      setIndentForDays(dept.vegMeatDairyIndent?.toString() || '1');
    } else {
      setIndentForDays(dept.order?.toString() || '1'); // for open indent
    }
  }, [indentType, inventoryData]);

  useEffect(() => {
    const fetchIndents = async () => {
      setListLoading(true);
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
          setIndents(result.data || []);
        }
      } catch (err) {
        setListError('Network error while fetching indents');
        console.error('Error fetching indents:', err);
      } finally {
        setListLoading(false);
      }
    };

    fetchIndents();
  }, []);

  // Add this new useEffect to check initial date after indents are loaded
  useEffect(() => {
    if (indents.length > 0) {
      // Check initial date and type when indents are loaded
      const checkInitialDate = async () => {
        const exists = await checkIndentExistsForDate(editableDate, indentType, false);
        if (exists) {
          const typeText = indentType === 'grocery'
            ? 'Grocery Segment'
            : indentType === 'dailie'
              ? 'Veg/Meat/Dairy Segment'
              : 'Open';

          setDateRestrictionError(`${typeText} indent already exists for ${new Date(editableDate).toLocaleDateString()}. Please select a different date or indent type.`);
        }
      };
      checkInitialDate();
    }
  }, [indents]);

  useEffect(() => {
    const generateRecentOrders = () => {
      const orders = [];
      const today = new Date();

      for (let i = 1; i <= 8; i++) {
        const orderDate = new Date(today);
        orderDate.setDate(today.getDate() - i);

        const segmentData = segmentOptions.slice(0, 4).map(option => ({
          segment: `${option.category} - ${option.diet || 'N/A'}`,
          nos: Math.floor(Math.random() * 50) + 20
        }));

        const total = segmentData.reduce((sum, item) => sum + item.nos, 0);

        orders.push({
          date: orderDate,
          total: total,
          segments: segmentData
        });
      }

      return orders;
    };

    if (segmentOptions.length > 0) {
      setRecentOrders(generateRecentOrders());
    }
  }, [segmentOptions]);

  // Existing functions (keeping all existing functionality)
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

      if (response.ok && !result.error) {
        const selectedIndent = indents.find(i => i.id === orderId) || {};

        setOrderDetails({
          items: result.data,
          status: selectedIndent.status,     // ✅ from list
          remarks: selectedIndent.remarks,   // ✅ from list
          date: selectedIndent.date,         // ✅ from list (if needed)
          from_date: selectedIndent.from_date,
          to_date: selectedIndent.to_date,
          indent_type: selectedIndent.indent_type,
        });
        setUserInfo(result.user || null);
        setOrderDays(result.days || null);
      }
    } catch (err) {
      setDetailsError('Network error while fetching order details');
      console.error('Error fetching order details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };


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

  const [formMode, setFormMode] = useState('create'); // or 'view'
  const handleCreateIndent = () => {
    setShowExpandedView(false);
    setExpandedOrder(null);
    setOrderDetails(null);
    setShowIndentDetails(false);
    setFormMode('create');

    setIndentType('grocery');

    const today = new Date();
    const fromDate = today.toISOString().split('T')[0];

    // Reset grocery range to today
    setGroceryRange([{
      startDate: today,
      endDate: today,
      key: 'selection'
    }]);

    // Find this user's department from inventory data
    const user = JSON.parse(localStorage.getItem('userInfo'));
    const deptName = user?.detail?.department;
    const matchedDept = inventoryData?.data?.find(dep => dep.name === deptName);

    let noOfDays = 1;
    if (indentType === 'grocery') {
      noOfDays = matchedDept?.groceryIndent || 1;
    } else if (indentType === 'dailie') {
      noOfDays = matchedDept?.vegMeatDairyIndent || 1;
    } else {
      noOfDays = matchedDept?.order || 1;
    }

    const toDateObj = new Date(today);
    toDateObj.setDate(toDateObj.getDate() + (parseInt(noOfDays) - 1));
    const toDate = toDateObj.toISOString().split('T')[0];

    setEditableDate(fromDate);
    setIndentForDays(noOfDays.toString());

    setGroceryRange([{
      startDate: today,
      endDate: toDateObj,
      key: 'selection'
    }]);

    setSegments(
      segmentOptions.map(option => ({
        segmentId: option.id.toString(),
        category: option.category,
        diet: option.diet || '',
        nos: ''
      }))
    );
  };


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
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'pending':
        return 'bg-yellow-400';
      case 'approved':
        return 'bg-green-400';
      case 'rejected':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  const handleSegmentChange = (index, selectedSegmentId) => {
    const selectedSegment = segmentOptions.find(option => option.id.toString() === selectedSegmentId);
    const updated = [...segments];

    if (selectedSegment) {
      updated[index] = {
        ...updated[index],
        segmentId: selectedSegmentId,
        category: selectedSegment.category,
        diet: selectedSegment.diet || ''
      };
    } else {
      updated[index] = {
        ...updated[index],
        segmentId: '',
        category: '',
        diet: ''
      };
    }

    setSegments(updated);
  };

// Handle navigation from rejected indent notification
useEffect(() => {
  const navigationState = location.state;
  
  if (navigationState?.showRejectedIndent && navigationState?.rejectedIndentId) {
    // Wait for indents to be loaded
    if (indents.length === 0) return;
    
    // Find the rejected indent by ID
    const rejectedIndent = indents.find(
      indent => indent.id.toString() === navigationState.rejectedIndentId.toString()
    );
    
    if (rejectedIndent && rejectedIndent.status?.toLowerCase() === 'rejected') {
      setSelectedRejectedIndent(rejectedIndent);
      setShowRejectedIndent(true);
      setShowExpandedView(false);
      setShowIndentDetails(false);
      setFormMode('view'); // ✅ Added this line
    } else {
      console.warn('Rejected indent not found or not in rejected status:', navigationState.rejectedIndentId);
    }
    
    // Clear the navigation state to prevent re-triggering
    window.history.replaceState({}, document.title);
  }
}, [location.state, indents]);

  const handleNosChange = (index, newNos) => {
    const updated = [...segments];
    updated[index].nos = newNos;
    setSegments(updated);
  };

  const addRow = () => {
    setSegments([...segments, { segmentId: '', category: '', diet: '', nos: '' }]);
  };

  const removeRow = (index) => {
    if (segments.length > 1) {
      const updated = segments.filter((_, i) => i !== index);
      setSegments(updated);
    }
  };

  const handleEditableOrderChange = (index, newValue, type = 'indent') => {
    if (type === 'indent') {
      const updated = [...indentDetails];
      updated[index].editableOrder = newValue;
      setIndentDetails(updated);
    } else if (type === 'reorder') {
      const updated = [...reorderItems];
      updated[index].editableOrder = newValue;
      setReorderItems(updated);
    }
  };


  const processIndentDetails = (data) => {
    return data.map(item => {
      const stock = parseFloat(item.stock) || 0;
      const buffer = parseFloat(item.buffer) || 0;
      const required = parseFloat(item.required) || 0;

      const exDf = stock - buffer;
      const order = required - exDf;

      // Different calculation for Veg/Meat/Dairy (dailie)
      let editableOrderValue;
      if (indentType === 'dailie') {
        // For Veg/Meat/Dairy: required - stock + reorder
        // Get reorder value from reorderItems array for dailie segment
        const reorderMatch = reorderItems.find(re => re.id === item.id);
        const dailieReorderQty = reorderMatch ? parseFloat(reorderMatch.qty) || 0 : 0;
        const dailieOrder = required - stock + dailieReorderQty;
        editableOrderValue = Math.max(dailieOrder, 0).toFixed(3);
      } else {
        // For Grocery: original calculation
        editableOrderValue = ((order > 0 ? order : 0) + (parseFloat(item.reorderQty) || 0)).toFixed(3);
      }

      return {
        ...item,
        exDf: exDf.toFixed(3),
        order: order.toFixed(3),
        editableOrder: editableOrderValue,
      };
    });
  };

  // Modified handleSave to handle both indent types
  const handleSave = async () => {
    console.log('🔥 indentType before save:', indentType);

    if (!isStoreMapped()) {
      alert('The RCS Store is not mapped. Kindly talk to RCS official to map store to your unit.');
      return;
    }

    const exists = await checkIndentExistsForDate(editableDate, indentType, false);
    if (exists) {
      const typeText = indentType === 'grocery'
        ? 'Grocery Segment'
        : indentType === 'dailie'
          ? 'Veg/Meat/Dairy Segment'
          : indentType === 'medical'
            ? 'Medical Indent'
            : 'Open';

      alert(`${typeText} indent already exists for ${new Date(editableDate).toLocaleDateString()}. Please select a different date.`);
      return;
    }

    // 🩺 MEDICAL INDENT FLOW
    if (indentType === 'medical') {
      const validRows = segments.filter(s =>
        s.segmentId && s.category && s.itemId && s.quantity && parseFloat(s.quantity) > 0
      );

      if (validRows.length === 0) {
        alert('Please add at least one item with valid data');
        return;
      }

      setLoading(true);

      try {
        const token = localStorage.getItem('authToken');

        const payload = {
          date: editableDate,
          indent_type: 'medical_indent',
          items: validRows.map(row => ({
            segment_id: row.segmentId,
            category: row.category,
            id: parseInt(row.itemId),
            qty: parseFloat(row.quantity).toFixed(3)
          }))
        };

        console.log('📦 Final payload for medical indent:', payload);

        const totalItems = validRows.length;
        const totalPacks = validRows.reduce((sum, row) => sum + parseFloat(row.quantity), 0);

        setPendingOrderPayload(payload);
        setPendingOrderToken(token);

        setOrderSummaryData({
          orderId: editableDate,
          date: new Date(editableDate).toLocaleDateString(),
          segmentNames: validRows.map(row => row.category),
          totalItems,
          totalPacks,
          indentType: 'medical_indent'
        });

        setShowOrderSummary(true);
      } catch (err) {
        console.error('Error preparing medical indent summary:', err);
        alert('Error preparing medical indent summary');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 🛒 GROCERY FLOW
    if (indentType === 'grocery') {
      const validSegmentRows = segmentRows.filter(row => row.segmentId && row.nos);

      if (validSegmentRows.length === 0) {
        alert('Please add at least one segment with valid data');
        return;
      }

      setLoading(true);
      setOrderError && setOrderError('');

      try {
        const token = localStorage.getItem('authToken');

        const payload = {
          from: format(groceryRange[0].startDate, 'yyyy-MM-dd'),
          to: format(groceryRange[0].endDate, 'yyyy-MM-dd'),
          indentType: 'grocery',
          segment: validSegmentRows.map(row => ({
            id: parseInt(row.segmentId),
            persons: parseInt(row.nos)
          }))
        };

        console.log('📦 Grocery payload being sent:', payload);

        const response = await fetch(`${API_BASE_URL}/indent/items`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && !result.error) {
          const processedDetails = processIndentDetails(result.data || []);
          const mergedIndentDetails = processedDetails.map(detail => {
            const reorderMatch = reorderItems.find(re => re.id === detail.id);
            return {
              ...detail,
              reorderQty: reorderMatch ? reorderMatch.qty : 0
            };
          });

          setIndentDetails(mergedIndentDetails);
          if (result.user) setUserInfo(result.user);

          setSavedSegments(validSegmentRows.map(row => ({
            id: parseInt(row.segmentId),
            persons: parseInt(row.nos)
          })));

          setSavedDays(
            Math.ceil(
              (new Date(groceryRange[0].endDate) - new Date(groceryRange[0].startDate))
              / (1000 * 60 * 60 * 24)
            ) + 1
          );

          setShowIndentDetails(true);
        } else {
          alert(result.message || 'Failed to fetch indent details');
        }
      } catch (err) {
        console.error('Error saving grocery indent:', err);
        alert(err.message || 'Network error while saving grocery indent');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 🥩 VEG / MEAT / DAIRY FLOW (dailie)
    if (indentType === 'dailie') {
      const validSegmentRows = segmentRows.filter(row => row.segmentId && row.nos);

      if (validSegmentRows.length === 0) {
        alert('Please add at least one segment with valid data');
        return;
      }

      setLoading(true);
      setOrderError && setOrderError('');

      try {
        const token = localStorage.getItem('authToken');

        const payload = {
          days: indentForDate,   // ✅ array of selected dates
          indentType: 'veg/meat/dairy',
          segment: validSegmentRows.map(row => ({
            id: parseInt(row.segmentId),
            persons: parseInt(row.nos)
          }))
        };

        console.log('📦 Dailie payload being sent:', payload);

        const response = await fetch(`${API_BASE_URL}/indent/items`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && !result.error) {
          const processedDetails = processIndentDetails(result.data || []);
          const mergedIndentDetails = processedDetails.map(detail => {
            const reorderMatch = reorderItems.find(re => re.id === detail.id);
            return {
              ...detail,
              reorderQty: reorderMatch ? reorderMatch.qty : 0
            };
          });

          setIndentDetails(mergedIndentDetails);
          if (result.user) setUserInfo(result.user);

          setSavedSegments(validSegmentRows.map(row => ({
            id: parseInt(row.segmentId),
            persons: parseInt(row.nos)
          })));

          setSavedDays(indentForDate.length);

          setShowIndentDetails(true);
        } else {
          alert(result.message || 'Failed to fetch indent details');
        }
      } catch (err) {
        console.error('Error saving dailie indent:', err);
        alert(err.message || 'Network error while saving dailie indent');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 📦 OPEN INDENT FLOW
    const validItems = openIndentItems.filter(item => item.itemId && item.quantity);

    if (validItems.length === 0) {
      alert('Please add at least one item with valid data');
      return;
    }

    if (validItems.some(item => isNaN(parseFloat(item.quantity)) || parseFloat(item.quantity) <= 0)) {
      alert('Please enter valid quantities (numbers greater than 0)');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');

const items = validItems.map(item => ({
  id: parseInt(item.itemId),
  qty: parseFloat(item.quantity).toFixed(3)
}));

      const totalItems = validItems.length;
      const totalPacks = validItems.reduce((sum, item) => sum + parseFloat(item.quantity), 0);

      setPendingOrderPayload({
        date: editableDate,
        indent_type: 'open_indent',
        items
      });
      setPendingOrderToken(token);

      setOrderSummaryData({
        orderId: editableDate,
        date: new Date(editableDate).toLocaleDateString(),
        segmentNames: [],
        totalItems,
        totalPacks,
        indentType: 'open_indent'
      });

      setShowOrderSummary(true);
    } catch (err) {
      alert('Error preparing open indent summary');
      console.error('Error in open indent flow:', err);
    } finally {
      setLoading(false);
    }
  };

  const [showZeroOrderConfirm, setShowZeroOrderConfirm] = useState(false);
  const [cachedOrderPayload, setCachedOrderPayload] = useState(null);
  const [finalDays, setFinalDays] = useState(null);


  // Add these states at top of your component
  const [pendingOrderPayload, setPendingOrderPayload] = useState(null);
  const [pendingOrderToken, setPendingOrderToken] = useState(null);

  // Add a confirm submit function
  const confirmSubmitOrder = async () => {
    if (isSubmitting) return; // Prevent multiple clicks

    try {
      setIsSubmitting(true); // Disable button

      if (pendingOrderToken && pendingOrderPayload) {
        console.log("📦 FINAL SUBMIT PAYLOAD:", JSON.stringify(pendingOrderPayload, null, 2));

        if (pendingOrderPayload.indent_type === 'medical_indent') {
          await submitMedicalIndentRequest(pendingOrderToken, pendingOrderPayload);
        } else {
          await submitOrderRequest(pendingOrderToken, pendingOrderPayload);
        }

        setFinalDays(null);
        setShowOrderSummary(false);
      }
    } catch (err) {
      console.error('💥 Error submitting order:', err);
      setOrderError(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false); // Re-enable button
    }
  };
  const handleSubmitOrder = async () => {
    console.log('🚀 SUBMIT ORDER STARTED');
    setOrderLoading(true);

    if (!isStoreMapped()) {
      alert('The RCS Store is not mapped. Kindly talk to RCS official to map store to your unit.');
      setOrderLoading(false);
      return;
    }

    setOrderError('');
    setOrderSuccess(false);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found. Please login again.');

      const indentItems = indentDetails
        .filter(item => item.editableOrder !== '' && item.editableOrder !== null && item.editableOrder !== undefined)
        .map(item => ({
          id: item.id,
          name: item.name,
          required: parseFloat(item.required).toFixed(3),
          order: parseFloat(item.editableOrder).toFixed(3)
        }));

      const reorderOrderItems = reorderItems
        .filter(item => item.editableOrder !== undefined && item.editableOrder !== '' && parseFloat(item.editableOrder) > 0)
        .map(item => ({
          id: item.id,
          name: item.name,
          required: parseFloat(item.qty).toFixed(3),
          qty: parseFloat(item.editableOrder).toFixed(3),
        }));

      if (indentDetails.length === 0) {
        setOrderError('No items found to submit');
        setOrderLoading(false);
        return;
      }

      const cleanedIndentType = (indentType || '').toLowerCase().replace(/\s+/g, '_');
      const orderPayload = {
        ...(cleanedIndentType === 'dailie'
          ? { orderDate: indentForDate, days: indentForDate.length }
          : cleanedIndentType === 'grocery'
            ? {
              from_date: format(groceryRange[0].startDate, 'yyyy-MM-dd'),
              to_date: format(groceryRange[0].endDate, 'yyyy-MM-dd'),
              days: groceryRange[0].startDate && groceryRange[0].endDate
                ? Math.ceil((new Date(groceryRange[0].endDate) - new Date(groceryRange[0].startDate)) / (1000 * 60 * 60 * 24)) + 1
                : null
            }
            : { days: savedDays }),
        date: editableDate,
        indent_type: cleanedIndentType,
        segment: savedSegments,
        items: indentItems
          .filter(item => parseFloat(item.order) > 0)
          .map(item => ({
            id: item.id,
            required: item.required,
            qty: item.order
          }))
      };

      if (reorderOrderItems.length > 0) {
        orderPayload.reorderItems = reorderOrderItems;
      }

      // 🔹 Zero order check
      const hasZero = indentItems.some(item => parseFloat(item.order) === 0);

      // 🔹 Build summary data
      // 🔹 Build summary data
      const totalItems = indentItems.length + reorderOrderItems.length;
      const totalPacks = [...indentItems, ...reorderOrderItems].reduce(
        (sum, i) => sum + parseFloat(i.order || i.qty), 0
      );

      // Calculate total residents from saved segments
      const totalResidents = savedSegments.reduce((sum, seg) => sum + (seg.persons || 0), 0);

      setPendingOrderPayload(orderPayload);
      setPendingOrderToken(token);
      setOrderSummaryData({
        orderId: editableDate,
        date: new Date(editableDate).toLocaleDateString(),
        segmentNames: savedSegments.map(seg => seg.name || seg.id),
        totalItems,
        totalPacks,
        totalResidents, // Add this line
        note: hasZero
          ? '⚠️ Some items have an order quantity of 0. Please review before proceeding.'
          : ''
      });

      // ✅ Show single summary popup in all cases
      setShowOrderSummary(true);
      setOrderLoading(false);

    } catch (err) {
      console.error('💥 FATAL ERROR:', err);
      setOrderError(`Error: ${err.message}`);
      setOrderLoading(false);
    }
  };

  const submitOrderRequest = async (token, orderPayload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/indent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload)
      });

      const responseText = await response.text();
      const result = JSON.parse(responseText);

      if (response.ok && !result.error) {
        setOrderSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1000); // reload after 1 seconds
      }
      else {
        console.error('❌ API Error:', result);
        setOrderError(result.message || `Server error: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Submission failed:', err);
      setOrderError(`Submission failed: ${err.message}`);
    } finally {
      setOrderLoading(false);
    }
  };

  const submitMedicalIndentRequest = async (token, orderPayload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/indent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        setOrderSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1000); // reload after 1 seconds
      } else {
        console.error('❌ API Error:', result);
        alert(result.message || 'Failed to save medical indent');
      }
    } catch (err) {
      console.error('❌ Medical indent submission failed:', err);
      alert(err.message || 'Network error while saving medical indent');
    } finally {
      setOrderLoading(false);
    }
  };


  const fetchIndents = async () => {
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
        setIndents(result.data || []);
      }
    } catch (err) {
      console.error('Error refreshing indents:', err);
    }
  };

  const formatOrderDate = (date) => {
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedOrder(null);
  };

  const currentTotal = segments.reduce((sum, item) => sum + (parseInt(item.nos) || 0), 0);


  const [reorderItems, setReorderItems] = useState([]);
  const [reorderLoading, setReorderLoading] = useState(false);


  const fetchReorderItems = async () => {
    try {
      setReorderLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/indent/reorder`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (response.ok && !result.error) {
        setReorderItems(
          (result.data || []).map(item => ({
            ...item,
            editableOrder: item.qty?.toString() || '0.000', // Safe initial editable value
          }))
        );

      }
    } catch (err) {
      console.error('Error fetching reorder items:', err);
    } finally {
      setReorderLoading(false);
    }
  };

  const handleResetReorderEditableOrder = () => {
    const updated = reorderItems.map(item => ({
      ...item,
      editableOrder: '0.000',
    }));
    setReorderItems(updated);
  };
  const handleCategoryChange = (index, value) => {
    const updated = [...openIndentItems];
    updated[index].category = value;
    setOpenIndentItems(updated);
  };


  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // returns YYYY-MM-DD
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userInfo')); // or whatever you store
    setUserInfo(user);
  }, []);

  const isStoreMapped = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      console.log('👀 Store Check - user:', user);

      const others = typeof user?.others === 'string'
        ? JSON.parse(user.others)
        : user.others;

      console.log('🔍 Parsed Others:', others);

      return !!(others?.store?.trim());
    } catch (e) {
      console.error('❌ Store check error:', e);
      return false;
    }
  };

  const [formData, setFormData] = useState({
    order_date: getTodayDateString(),
    indent_for: '',
    indent_type: '',
    remarks: '',
  });
  const [indentForDate, setIndentForDate] = useState(() => {
    const d = new Date(formData.order_date);
    d.setDate(d.getDate() + 1);
    return [d.toISOString().split('T')[0]];
  });




  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const cleanedIndentType = (indentType || '').toLowerCase().replace(/\s+/g, '_');
  const isMealCategory = cleanedIndentType === 'dailie';

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const storeName = user?.others ? JSON.parse(user.others).store : null;


  useEffect(() => {
    const syncHeights = () => {
      if (leftRef.current) {
        setLeftHeight(leftRef.current.offsetHeight);
      }
    };

    syncHeights(); // run initially
    window.addEventListener('resize', syncHeights); // update on resize

    return () => {
      window.removeEventListener('resize', syncHeights);
    };
  }, [indentDetails, segments]); // or any state that triggers height change
  const [groceryRange, setGroceryRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }
  ]);

  const [showRangePicker, setShowRangePicker] = useState(false);

  useEffect(() => {
    if (!editableDate || !indentForDays) return;

    // Only set initial range if groceryRange is not already set by user
    if (groceryRange[0].startDate.toDateString() === groceryRange[0].endDate.toDateString()) {
      const fromDate = new Date(editableDate);
      const days = parseInt(indentForDays);

      if (isNaN(days) || days <= 0) return;

      const toDate = new Date(fromDate);
      toDate.setDate(fromDate.getDate() + (days - 1));

      setGroceryRange([{
        startDate: fromDate,
        endDate: toDate,
        key: 'selection'
      }]);
    }
  }, [editableDate, indentForDays]);

  const [showDateDropdown, setShowDateDropdown] = useState(false);

  useEffect(() => {
    if (indentType === 'medical') {
      const token = localStorage.getItem('authToken');

      const eaterApi = fetch('https://rcs-dms.onlinetn.com/api/v1//master/eater-type', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.json());

      const segmentApi = fetch('https://rcs-dms.onlinetn.com/api/v1//segment', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.json());

      Promise.all([eaterApi, segmentApi])
        .then(([eaterData, segmentData]) => {
          if (!eaterData.error && Array.isArray(eaterData.data) &&
            !segmentData.error && Array.isArray(segmentData.data)) {

            // Create a lowercase set of all category names from segment API
            const segmentCategories = new Set(
              segmentData.data
                .map(seg => seg.category?.toLowerCase().trim())
                .filter(Boolean)
            );

            // Filter eater-type combinations that are NOT in segment API
            const expandedOptions = [];
            eaterData.data.forEach(segment => {
              if (segment.sub && segment.sub.length > 0) {
                segment.sub.forEach(subType => {
                  const comboName = `${segment.name} - ${subType}`.trim();
                  if (!segmentCategories.has(comboName.toLowerCase())) {
                    expandedOptions.push({
                      id: `${segment.id}-${subType}`,
                      name: comboName
                    });
                  }
                });
              } else {
                const comboName = segment.name.trim();
                if (!segmentCategories.has(comboName.toLowerCase())) {
                  expandedOptions.push({
                    id: `${segment.id}`,
                    name: comboName
                  });
                }
              }
            });

            setSegmentOptions(expandedOptions);
            setSegments([{ segmentId: '', category: '', itemId: '', quantity: '' }]);
          }
        })
        .catch(err => console.error('Error fetching medical segments:', err));
    }
  }, [indentType]);

  const fetchStoreDetails = async () => {
    try {
      setStoreLoading(true);
      const token = localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const storeName = user?.others ? JSON.parse(user.others).store : null;

      if (!storeName) {
        setStoreLoading(false);
        return;
      }

      const response = await fetch(`https://rcs-dms.onlinetn.com/api/v1//user/store/${storeName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        setStoreDetails(result.data);
      }
    } catch (err) {
      console.error('Error fetching store details:', err);
    } finally {
      setStoreLoading(false);
    }
  };

  const [segmentList, setSegmentList] = useState([]);

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("https://rcs-dms.onlinetn.com/api/v1//segment", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const result = await response.json();
        if (response.ok && result?.data) {
          setSegmentList(result.data);
        }
      } catch (err) {
        console.error("Error fetching segments:", err);
      }
    };
    fetchSegments();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowRangePicker(false);
      }
    };

    if (showRangePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRangePicker]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setShowDateDropdown(false);
      }
    };

    if (showDateDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDateDropdown]);


  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 bg-gray-50 rounded-lg h-screen flex flex-col">
<div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch h-full">
  <div className={`w-full ${(!showIndentDetails && !showExpandedView && !showRejectedIndent) ? 'lg:w-3/4' : 'lg:w-full'}`} ref={leftRef}>

          <div className="bg-white shadow rounded-lg p-4 h-full">
{!showIndentDetails && !showExpandedView && !showRejectedIndent ? (
              <>
                <h1 className="text-lg sm:text-xl font-semibold text-center mb-4 text-gray-800">Indent Creation</h1>
                {/* Date Restriction Error Message */}
                {dateRestrictionError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    {dateRestrictionError}
                  </div>
                )}

                {/* Indent Type Selection */}
                <div className="mb-4 flex justify-center">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="grocery"
                        checked={indentType === 'grocery'}
                        onChange={() => handleIndentTypeChange('grocery')}
                        className="h-4 w-4"
                        disabled={isDateCheckLoading}
                      />
                      <span className="text-sm font-medium">Grocery Segment Indent</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="dailie"
                        checked={indentType === 'dailie'}
                        onChange={() => handleIndentTypeChange('dailie')}
                        className="h-4 w-4"
                        disabled={isDateCheckLoading}
                      />
                      <span className="text-sm font-medium">Veg, Meat, Dairy Segment Indent</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="open"
                        checked={indentType === 'open'}
                        onChange={() => handleIndentTypeChange('open')}
                        className="h-4 w-4"
                        disabled={isDateCheckLoading}
                      />
                      <span className="text-sm font-medium">Open Indent</span>
                    </label>

                  </div>
                </div>
                <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">Order Date:</span>
                      <span className="text-sm rounded-md px-1 py-1 text-gray-700">
                        {format(new Date(editableDate), 'dd-MMM-yyyy')}
                      </span>
                    </div>
                    {indentType !== 'open' && indentType !== 'medical' && (
                      indentType === 'dailie' ? (
                        <div className="flex items-center gap-4 flex-wrap">
                          <label className="font-semibold">Indent For:</label>

                          {/* Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowDateDropdown(!showDateDropdown)}
                              className="px-2 py-1 border border-gray-300 rounded-md bg-white text-sm w-[12rem] text-left"
                            >
                              {indentForDate.length === 0 ? 'Select Dates' : `${indentForDate.length} dates selected`}
                            </button>

                            {showDateDropdown && (
                              <div
                                ref={dateDropdownRef}
                                className="absolute z-10 mt-2 border border-gray-300 rounded-md bg-white shadow-sm p-2 w-[14rem]">
                                {[...Array(parseInt(indentForDays) || 1).keys()].map(offset => {
                                  const date = new Date(formData.order_date);
                                  date.setDate(date.getDate() + offset);

                                  const iso = date.toISOString().split('T')[0];
                                  const day = date.getDate();
                                  const month = date.toLocaleString('default', { month: 'short' });
                                  const weekday = date.toLocaleString('default', { weekday: 'short' });
                                  const label = `${day}${getOrdinal(day)} ${month}, ${weekday}`;
                                  const isSelected = indentForDate.includes(iso);

                                  return (
                                    <label key={iso} className="block text-sm cursor-pointer">
                                      <input
                                        type="checkbox"
                                        value={iso}
                                        checked={isSelected}
                                        onChange={(e) => {
                                          const selected = [...indentForDate];
                                          if (e.target.checked) {
                                            selected.push(iso);
                                          } else {
                                            const index = selected.indexOf(iso);
                                            if (index !== -1) selected.splice(index, 1);
                                          }
                                          setIndentForDate(selected);
                                        }}
                                        className="mr-2"
                                      />
                                      {label}
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>


                          {/* Selected dates display */}
                          {indentForDate.length > 0 && (
                            <div className="flex flex-wrap gap-2 text-sm text-gray-800">
                              {indentForDate.map((dateStr) => {
                                const date = new Date(dateStr);
                                const day = String(date.getDate()).padStart(2, '0'); // ensures 01, 02, etc.
                                const month = date.toLocaleString('default', { month: 'short' });

                                const label = `${day} ${month}`;

                                return (
                                  <span
                                    key={dateStr}
                                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md border border-blue-300"
                                  >
                                    {label}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                        </div>

                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Indent For:</span>
                          <div className="relative flex items-center gap-4 flex-wrap">


                            {/* Clickable text span that opens the calendar */}
                            <span
                              onClick={() => setShowRangePicker(!showRangePicker)}
                              className="text-sm text-gray-700 cursor-pointer hover:underline"
                            >
                              <strong>{format(groceryRange[0].startDate, 'dd-MMM-yyyy')}</strong> to <strong>{format(groceryRange[0].endDate, 'dd-MMM-yyyy')}</strong>
                            </span>
                            <p className="text-sm text-gray-600">
                              Days: <span className="font-semibold text-gray-800">{indentForDays}</span>
                            </p>


                            {/* Date Picker */}
                            {/* Date Picker */}
                            {showRangePicker && (
                              <div
                                ref={pickerRef}
                                className="absolute left-0 top-full mt-2 z-50 shadow-lg border rounded-md bg-white"
                              >
                                <DateRange
                                  ranges={groceryRange}
                                  onChange={(item) => {
                                    setGroceryRange([item.selection]);

                                    const from = item.selection.startDate;
                                    const to = item.selection.endDate;
                                    const diffDays = Math.max(
                                      1,
                                      Math.round((to - from) / (1000 * 60 * 60 * 24)) + 1
                                    );
                                    setIndentForDays(diffDays.toString());
                                    // ❌ Don’t update editableDate — Order Date stays today
                                  }}
                                  moveRangeOnFirstSelection={false}
                                  showSelectionPreview={true}
                                  months={
                                    // ✅ If next 10 days crosses into next month → show 2 months
                                    (() => {
                                      const today = new Date();
                                      const maxDate = new Date(today);
                                      maxDate.setDate(today.getDate() + 10);
                                      return today.getMonth() !== maxDate.getMonth() ? 2 : 1;
                                    })()
                                  }
                                  direction="horizontal"
                                  locale={enUS}
                                  minDate={new Date()} // 🚫 No past dates
                                  maxDate={new Date(new Date().setDate(new Date().getDate() + 10))} // ⏳ Only next 10 days
                                />
                                {/* ✅ Confirm button */}
                                <div className="flex justify-end p-2 border-t">
                                  <button
                                    onClick={() => setShowRangePicker(false)}
                                    className="px-3 py-1 bg-sky-600 text-white rounded-md hover:bg-sky-700 text-sm"
                                  >
                                    Select
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>

                        </div>
                      )
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm font-medium text-gray-700">
                    {(indentType === 'grocery' || indentType === 'dailie') && (
                      <p>Total: {currentTotal}</p>
                    )}
                  </div>

                </div>
                <div className="flex-grow overflow-auto">
                  {indentType === 'medical' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto border-collapse border border-gray-300 min-w-full">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">S.No</th>
                            <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Segments</th>
                            <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Category</th>
                            <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Item</th>
                            <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Quantity</th>
                            <th className="border border-gray-300 px-2 sm:px-4 py-2 text-center text-xs sm:text-sm">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {segments.map((seg, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="border border-gray-300 px-2 sm:px-4 py-2 text-sm">{idx + 1}.</td>

                              {/* Segments Dropdown */}
                              <td className="border border-gray-300 px-2 sm:px-4 py-2">
                                <select
                                  value={seg.segmentId || ''}
                                  onChange={(e) => handleSegmentChange(idx, e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                >
                                  <option value="">Select Segment</option>
                                  {segmentOptions.map((opt) => {
                                    // Find all items in the same category
                                    const sameCategoryItems = segmentOptions.filter(o => o.category === opt.category);
                                    const hasMultipleDiets = new Set(sameCategoryItems.map(o => o.diet?.toLowerCase())).size > 1;

                                    // If only one diet, hide the diet name
                                    const displayName = hasMultipleDiets
                                      ? `${opt.category} ${opt.diet ? `- ${opt.diet}` : ''}`
                                      : opt.category;

                                    return (
                                      <option key={opt.id} value={opt.id}>
                                        {displayName}
                                      </option>
                                    );
                                  })}

                                </select>
                              </td>

                              {/* Category Dropdown */}
                              <td className="border border-gray-300 px-2 sm:px-4 py-2">
                                <select
                                  value={seg.category || ''}
                                  onChange={(e) => {
                                    const updated = [...segments];
                                    updated[idx].category = e.target.value;
                                    setSegments(updated);
                                  }}
                                  className="w-full border rounded px-1 py-1 text-sm"
                                >
                                  <option value="">Select Category</option>
                                  <option value="food">Grocery</option>
                                  <option value="dailie">Veg/Meat/Dairy</option>
                                  <option value="housekeeping">Housekeeping</option>
                                </select>
                              </td>

                              {/* Item Dropdown - behaves like Open Indent */}
                              <td className="border border-gray-300 px-2 sm:px-4 py-2">
                                <select
                                  className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm"
                                  value={seg.itemId || ''}
                                  onChange={(e) => {
                                    const updated = [...segments];
                                    updated[idx].itemId = e.target.value;
                                    setSegments(updated);
                                  }}
                                >
                                  <option value="">Select Item</option>
                                  {groceryItems
                                    .filter(
                                      (groceryItem) =>
                                        !seg.category ||
                                        groceryItem.category?.toLowerCase() === seg.category?.toLowerCase()
                                    )
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((groceryItem) => (
                                      <option key={groceryItem.id} value={groceryItem.id}>
                                        {groceryItem.name}
                                      </option>
                                    ))}
                                </select>
                              </td>

                              {/* Quantity Input */}
                              <td className="border border-gray-300 px-2 sm:px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    step="0.001"
                                    className="w-20 sm:w-24 px-1 sm:px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm"
                                    value={seg.quantity || ''}
                                    onChange={(e) => {
                                      const updated = [...segments];
                                      updated[idx].quantity = e.target.value;
                                      setSegments(updated);
                                    }}
                                    placeholder="0.000"
                                  />
                                  <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                                    {seg.unit || ''}
                                  </span>
                                </div>
                              </td>

                              {/* Action */}
                              <td className="border border-gray-300 px-2 sm:px-4 py-2 text-center">
                                {idx === segments.length - 1 ? (
                                  <button
                                    onClick={addRow}
                                    className="text-green-600 hover:text-green-800 font-bold text-lg"
                                    title="Add Row"
                                  >
                                    +
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => removeRow(idx)}
                                    className="text-red-600 hover:text-red-800 font-bold text-lg"
                                    title="Remove Row"
                                  >
                                    ×
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )

                    : (indentType === 'grocery' || indentType === 'dailie')
                      ? (
                        // Existing segment-based table with responsive design
                        <div className="overflow-x-auto">
                          <table className="w-full table-auto border-collapse border border-gray-300 min-w-full">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">S.No</th>
                                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Resident Segment</th>
                                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Nos</th>
                                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-center text-xs sm:text-sm">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {segmentRows.map((row, index) => (
                                <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-150">
                                  <td className="border border-gray-300 px-2 sm:px-4 py-2 text-sm">{index + 1}.</td>
                                  <td className="border border-gray-300 px-2 sm:px-4 py-2">
                                    <select
                                      className="w-full border rounded px-2 py-1 text-sm"
                                      value={row.segmentId}
                                      onChange={(e) => {
                                        const updated = [...segmentRows];
                                        updated[index].segmentId = e.target.value;
                                        setSegmentRows(updated);
                                      }}
                                    >
                                      <option value="">-- Select Segment --</option>
                                      {segmentOptions.map((opt) => {
                                        // Find all items in the same category
                                        const sameCategoryItems = segmentOptions.filter(o => o.category === opt.category);
                                        const hasMultipleDiets = new Set(sameCategoryItems.map(o => o.diet?.toLowerCase())).size > 1;

                                        // If only one diet, hide the diet name
                                        const displayName = hasMultipleDiets
                                          ? `${opt.category} ${opt.diet ? `- ${opt.diet}` : ''}`
                                          : opt.category;

                                        return (
                                          <option key={opt.id} value={opt.id}>
                                            {displayName}
                                          </option>
                                        );
                                      })}

                                    </select>
                                  </td>
                                  <td className="border border-gray-300 px-2 sm:px-4 py-2">
                                    <input
                                      type="number"
                                      className="w-16 sm:w-24 px-1 sm:px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                      value={row.nos || ""}
                                      onChange={(e) => {
                                        const updated = [...segmentRows];
                                        updated[index].nos = e.target.value;
                                        setSegmentRows(updated);
                                      }}
                                      placeholder="0"
                                    />
                                  </td>
                                  <td className="border border-gray-300 px-2 sm:px-4 py-2 text-center">
                                    {index === segmentRows.length - 1 ? (
                                      <Plus
                                        size={18}
                                        className="text-blue-600 cursor-pointer hover:text-blue-800 inline-block"
                                        onClick={() =>
                                          setSegmentRows([...segmentRows, { id: Date.now(), segmentId: "", nos: "" }])
                                        }
                                      />
                                    ) : (
                                      <Minus
                                        size={18}
                                        className="text-red-600 cursor-pointer hover:text-red-800 inline-block"
                                        onClick={() => {
                                          const updated = [...segmentRows];
                                          updated.splice(index, 1);
                                          setSegmentRows(updated);
                                        }}
                                      />
                                    )}
                                  </td>

                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                      ) : (
                        // New open indent table with responsive design
                        <div>
                          {groceryItemsLoading ? (
                            <div className="text-center py-4">
                              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                              <p className="mt-2 text-sm text-gray-600">Loading items...</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full table-auto border-collapse border border-gray-300 min-w-full">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">S.No</th>
                                    <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Category</th>
                                    <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Item</th>
                                    <th className="border border-gray-300 px-2 sm:px-4 py-2 text-right text-xs sm:text-sm">Reorder Qty</th>
                                    <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Quantity</th>
                                    {openIndentItems.some(item => item.itemId) && (
                                      <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Stock</th>
                                    )}
                                    <th className="border border-gray-300 px-2 sm:px-4 py-2 text-center text-xs sm:text-sm">Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {openIndentItems.map((item, index) => {
                                    const selectedItem = groceryItems
                                      .filter(g => g.category === item.category)
                                      .find(g => g.id.toString() === item.itemId);
                                    return (
                                      <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="border border-gray-300 px-2 sm:px-4 py-2 text-sm">{index + 1}.</td>
                                        <td className="border border-gray-300 px-2 sm:px-4 py-2 text-left">
                                          <select
                                            value={item.category || ''}
                                            onChange={(e) => handleCategoryChange(index, e.target.value)}
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                          >
                                            <option value="">Select Category</option>
                                            <option value="food">Grocery</option>
                                            <option value="dailie">Veg/Meat/Dairy</option>
                                            <option value="housekeeping">Housekeeping</option>
                                          </select>
                                        </td>
                                        <td className="border border-gray-300 px-2 sm:px-4 py-2">
                                          <select
                                            className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm"
                                            value={item.itemId}
                                            onChange={(e) => handleOpenIndentItemChange(index, 'itemId', e.target.value)}
                                          >
                                            <option value="">Select Item</option>
                                            {groceryItems
                                              .filter(
                                                (groceryItem) =>
                                                  !item.category ||
                                                  groceryItem.category?.toLowerCase() === item.category?.toLowerCase()
                                              )
                                              .sort((a, b) => {
                                                const priorityItems = ["chicken", "mutton", "milk"];
                                                const nameA = a.name.toLowerCase();
                                                const nameB = b.name.toLowerCase();

                                                const priorityA = priorityItems.indexOf(nameA);
                                                const priorityB = priorityItems.indexOf(nameB);

                                                if (priorityA !== -1 && priorityB !== -1) {
                                                  return priorityA - priorityB; // both are priority items
                                                } else if (priorityA !== -1) {
                                                  return -1; // a is priority
                                                } else if (priorityB !== -1) {
                                                  return 1; // b is priority
                                                }

                                                return nameA.localeCompare(nameB); // fallback alphabetical
                                              })

                                              .map((groceryItem) => (
                                                <option key={groceryItem.id} value={groceryItem.id}>
                                                  {groceryItem.name}
                                                </option>
                                              ))}
                                          </select>
                                        </td>
                                        <td className="border border-gray-300 px-2 sm:px-4 py-2 text-right text-xs sm:text-sm">
                                          {parseFloat(item.reorderQty || 0).toFixed(3)}
                                        </td>
                                        <td className="border border-gray-300 px-2 sm:px-4 py-2">
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="number"
                                              step="0.001"
                                              className="w-20 sm:w-24 px-1 sm:px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm"
                                              value={item.quantity || ''}
                                              onChange={(e) => handleOpenIndentItemChange(index, 'quantity', e.target.value)}
                                              placeholder="0.000"
                                            />
                                            <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                                              {item.unit === 'Kg' ? 'Kg' :
                                                item.unit === 'Liter' ? 'Liter' :
                                                  item.unit === 'Pcs' ? 'Pcs' :
                                                    item.unit}
                                            </span>
                                          </div>
                                        </td>
                                        {item.itemId && (
                                          <td className="border border-gray-300 px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800">
                                            {selectedItem?.stock !== undefined ? selectedItem.stock : '0'}
                                          </td>
                                        )}
                                        <td className="border border-gray-300 px-2 sm:px-4 py-2 text-center">
                                          {index === openIndentItems.length - 1 ? (
                                            <button
                                              onClick={addOpenIndentItem}
                                              className="text-green-600 hover:text-green-800 font-bold text-lg"
                                              title="Add Item"
                                            >
                                              +
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => removeOpenIndentItem(index)}
                                              className="text-red-600 hover:text-red-800 font-bold text-lg"
                                              title="Remove Item"
                                            >
                                              ×
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                </div>



                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={loading || !!dateRestrictionError || isDateCheckLoading}
                    className="px-3 sm:px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition disabled:opacity-50 text-sm sm:text-base"
                  >
                    {loading
                      ? 'Saving...'
                      : indentType === 'medical'
                        ? 'Submit Medical Indent'
                        : indentType === 'open'
                          ? 'Submit Open Indents'
                          : 'Proceed'}

                  </button>
                </div>
              </>
              ) : showRejectedIndent ? (
  <RejectedIndent 
    indent={selectedRejectedIndent}
    onBack={() => {
      setShowRejectedIndent(false);
      setSelectedRejectedIndent(null);
    }}
    onSubmitSuccess={() => {
      setShowRejectedIndent(false);
      setSelectedRejectedIndent(null);
      window.location.reload();
    }}
  />
            ) : showExpandedView ? (
              <>
                {/* Expanded Order Details View */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Order Details</h1>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCreateIndent}
                      className="px-3 sm:px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition flex items-center gap-2 text-sm sm:text-base"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Create Indent
                    </button>
                    <button
                      onClick={() => {
                        setShowExpandedView(false);
                        setExpandedOrder(null);
                        setOrderDetails(null);
                      }}
                      className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition text-sm sm:text-base"
                    >
                      ← Back
                    </button>

                  </div>
                </div>

                {detailsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading order details...</p>
                  </div>
                ) : orderDetails ? (
                  <div className="space-y-4">
                    {userInfo?.detail && (
                      <div className="w-full bg-blue-50 border border-blue-200 rounded-md p-3 sm:p-4">
                        <h3 className="text-sm font-semibold text-blue-800 mb-2">Indent Source</h3>
                        <div className="text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2">
                          <div><span className="font-medium">ID:</span> {userInfo.id}</div>
                          <div><span className="font-medium">Unit:</span> {userInfo.detail.branch}</div>
                          <div><span className="font-medium">Location:</span> {userInfo.detail.location}</div>
                          <div><span className="font-medium">Store:</span> {userInfo.detail.store}</div>
                          <div><span className="font-medium">District:</span> {userInfo.detail.district}</div>
                        </div>


                      </div>
                    )}
                    {/* ⬇️ ADD BANNER HERE */}
                    {orderDetails.status?.toLowerCase() === 'rejected' && (
                      <div className="p-3 mb-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
                        <strong>Rejected:</strong> {orderDetails.remarks || "No remarks provided"}
                      </div>
                    )}
                    {/* Items */}
                    {orderDetails.items && orderDetails.items.length > 0 ? (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">Itemssss</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full table-auto border-collapse border border-gray-300 min-w-max">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">S.No</th>
                                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Item Name</th>
                                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-center text-xs sm:text-sm">Required</th>
                                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-center text-xs sm:text-sm">Stock</th>
                                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-center text-xs sm:text-sm">Buffer</th>
                                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-center text-xs sm:text-sm">Order</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orderDetails.items.map((item, itemIndex) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="border border-gray-300 px-2 sm:px-4 py-2 text-xs sm:text-sm">
                                    {itemIndex + 1}.
                                  </td>
                                  <td className="border border-gray-300 px-2 sm:px-3 py-2 font-medium text-xs sm:text-sm">
                                    {item.name}
                                    {item.unit && (
                                      <span className="ml-2 inline-block bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                        {item.unit}
                                      </span>
                                    )}
                                  </td>

                                  <td className="border border-gray-300 px-2 sm:px-4 py-2 text-right text-xs sm:text-sm">
                                    {item.required !== undefined ? parseFloat(item.required).toFixed(3) : '–'}
                                  </td>
                                  <td className="border border-gray-300 px-2 sm:px-4 py-2 text-right text-xs sm:text-sm">
                                    {item.stock !== undefined ? parseFloat(item.stock).toFixed(3) : '–'}
                                  </td>
                                  <td className="border border-gray-300 px-2 sm:px-4 py-2 text-right text-xs sm:text-sm">
                                    {item.buffer !== undefined ? parseFloat(item.buffer).toFixed(3) : '–'}
                                  </td>
                                  <td className="border border-gray-300 px-2 sm:px-4 py-2 text-right text-xs sm:text-sm">
                                    {item.qty !== undefined ? parseFloat(item.qty).toFixed(3) : '–'}
                                  </td>
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
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No detailed information available</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Indent Details (after save) */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Indent Details</h1>
                  <button
                    onClick={handleCreateIndent}
                    className="px-3 sm:px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition flex items-center gap-2 text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Indent
                  </button>
                </div>
                {/* Order Success Message */}
                {orderSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
                    Order submitted successfully!
                  </div>
                )}

                {/* User Information Section */}
                {userInfo && userInfo.detail && (
                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-6 border border-blue-200">
                    <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-2">User Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">ID:</span>
                        <span className="ml-2 text-gray-600">{userInfo.id}</span>
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">Location:</span>
                        <span className="ml-2 text-gray-600">{userInfo.detail.location}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Store:</span>
                        <span className="ml-2 text-gray-600">{userInfo.detail.store}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Contact:</span>
                        <span className="ml-2 text-gray-600">{userInfo.detail.contact}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <table className="w-full table-auto border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 sm:px-3 py-2 text-left text-xs sm:text-sm">S.No</th>
                        <th className="border border-gray-300 px-2 sm:px-3 py-2 text-left text-xs sm:text-sm">Item Name</th>
                        <th className="border border-gray-300 px-2 sm:px-3 py-2 text-center text-xs sm:text-sm">Required</th>
                        <th className="border border-gray-300 px-2 sm:px-3 py-2 text-center text-xs sm:text-sm">Stock</th>
                        {!isMealCategory && <th className="border border-gray-300 px-2 sm:px-3 py-2 text-center text-xs sm:text-sm">Buffer</th>}
                        {!isMealCategory && <th className="border border-gray-300 px-2 sm:px-3 py-2 text-center text-xs sm:text-sm">Ex/Df</th>}
                        <th className="border border-gray-300 px-2 sm:px-3 py-2 text-center text-xs sm:text-sm">Reorder</th>
                        <th className="border border-gray-300 px-2 sm:px-3 py-2 text-center text-xs sm:text-sm">Order</th>
                        {!isMealCategory && (
                          <th className="border border-gray-300 px-2 sm:px-3 py-2 text-center text-xs sm:text-sm">Order (Edit)</th>
                        )}

                      </tr>
                    </thead>
                    <tbody>
                      {indentDetails.map((item, index) => (
                        <tr key={index} className="hover:bg-white transition-colors duration-150">
                          <td className="border border-gray-300 px-2 sm:px-3 py-2 text-xs sm:text-sm">{index + 1}.</td>
                          <td className="border border-gray-300 px-2 sm:px-3 py-2 font-medium text-xs sm:text-sm">
                            {item.name}
                            {item.unit && (
                              <span className="ml-2 inline-block bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                {item.unit}
                              </span>
                            )}
                          </td>


                          <td className="border border-gray-300 px-2 sm:px-3 py-2 text-right text-xs sm:text-sm">
                            {item.required !== undefined ? parseFloat(item.required).toFixed(3) : '–'}
                          </td>
                          <td className="border border-gray-300 px-2 sm:px-3 py-2 text-right text-xs sm:text-sm">
                            {item.stock !== undefined ? parseFloat(item.stock).toFixed(3) : '–'}
                          </td>
                          {!isMealCategory && (
                            <td className="border border-gray-300 px-2 sm:px-3 py-2 text-right text-xs sm:text-sm">
                              {item.buffer !== undefined ? parseFloat(item.buffer).toFixed(3) : '–'}
                            </td>
                          )}

                          {!isMealCategory && (
                            <td className="border border-gray-300 px-2 sm:px-3 py-2 text-right font-medium text-xs sm:text-sm">
                              <span className={parseFloat(item.exDf) >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {item.exDf !== undefined ? parseFloat(item.exDf).toFixed(3) : '–'}
                              </span>
                            </td>
                          )}

                          {/* <td className="border border-gray-300 px-2 sm:px-3 py-2 text-right text-xs sm:text-sm">
                            {item.order !== undefined ? parseFloat(item.order).toFixed(2) : '–'} {item.unit}
                          </td> */}
                          <td className="border border-gray-300 px-2 sm:px-3 py-2 text-right text-xs sm:text-sm">
                            {reorderItems.some(re => re.id === item.id)
                              ? `${parseFloat(item.reorderQty || 0).toFixed(3)}`
                              : '0.00'}

                          </td>

                          <td className="border border-gray-300 px-2 sm:px-3 py-2 text-center text-xs sm:text-sm">
                            {isMealCategory ? (
                              <input
                                type="number"
                                step="0.001"
                                value={
                                  item.editableOrder !== undefined && item.editableOrder !== ''
                                    ? item.editableOrder
                                    : (
                                      (parseFloat(item.required) || 0) -
                                      (parseFloat(item.stock) || 0) +
                                      (parseFloat(item.reorderQty) || 0)
                                    ).toFixed(3)
                                }
                                onChange={(e) => {
                                  const newValue = parseFloat(e.target.value);
                                  const calculatedOrder = (parseFloat(item.required) || 0) - (parseFloat(item.stock) || 0) + (parseFloat(item.reorderQty) || 0);

                                  if (newValue > calculatedOrder) {
                                    alert('The quantity entered is more than the calculated order quantity');
                                    return;
                                  }

                                  handleEditableOrderChange(index, e.target.value);
                                }}
                                className="w-16 sm:w-20 px-1 sm:px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-center text-xs sm:text-sm"
                              />
                            ) : (
                              item.order !== undefined
                                ? `${Math.max(parseFloat(item.order), 0).toFixed(3)} `
                                : '–'
                            )}
                          </td>
                          {!isMealCategory && (
                            <td className="border border-gray-300 px-2 sm:px-3 py-2 text-center">
                              <input
                                type="number"
                                step="0.001"
                                value={
                                  item.editableOrder === ""
                                    ? "" // allow the field to stay empty when user clears it
                                    : parseFloat(item.editableOrder) < 0
                                      ? "0"
                                      : item.editableOrder !== undefined
                                        ? item.editableOrder
                                        : (
                                          (parseFloat(item.order) || 0) +
                                          (parseFloat(item.reorderQty) || 0)
                                        ).toFixed(3)
                                }

                                onChange={(e) => {
                                  const newValue = parseFloat(e.target.value);
                                  const defaultValue = (
                                    (parseFloat(item.order) || 0) +
                                    (parseFloat(item.reorderQty) || 0)
                                  );

                                  if (newValue > defaultValue) {
                                    alert('The quantity entered is more than the allowed order quantity');
                                    return;
                                  }

                                  handleEditableOrderChange(index, e.target.value);
                                }}

                                className="w-20 sm:w-24 px-1 sm:px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-center text-xs sm:text-sm"
                              />
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>

                {/* Submit Order Button */}
                <div className="mt-6 flex justify-end">


                  <button
                    onClick={handleSubmitOrder}
                    disabled={orderLoading || orderSuccess}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm sm:text-base"
                  >
                    {orderLoading ? (
                      <>
                        <div className="w-4 sm:w-5 h-4 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting Order...</span>
                      </>
                    ) : orderSuccess ? (
                      <>
                        <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Order Submitted</span>
                      </>
                    ) : (

                      <>
                        <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span>Submit Order</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

    {/* Right Side - Indents List (responsive width) */}
{!showIndentDetails && !showExpandedView && !showRejectedIndent && (
          <div className="w-full lg:w-1/4">
            <div
              ref={rightRef}
              className="bg-white shadow rounded-lg p-4 overflow-y-auto"
              style={{ height: leftHeight ? `${leftHeight}px` : 'auto' }}
            >
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">
                Previous Indents
              </h2>
              <p className="text-sm text-gray-500 mb-3">Click indent to see details.</p>

              {listLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
                </div>
              ) : indents.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <p className="text-sm text-gray-600">No indent records found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                    {indents
                      .slice() // copy the array
                      .sort((a, b) => new Date(b.created) - new Date(a.created)) // sort newest first
                      .map((indent, index) => (
                        <div
                          key={indent.id}
                          onClick={() => handleToggleExpand(indent.id)}
                          className={`cursor-pointer border-b border-gray-200 last:border-b-0 py-2 sm:py-3 px-2 rounded-md transition-colors duration-150 ${expandedOrder === indent.id && showExpandedView
                            ? 'bg-blue-100 border-blue-300'
                            : 'hover:bg-white'
                            }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs sm:text-sm font-medium text-gray-900">
                                  {formatDate(indent.date)} • {indent.indent_type
                                    ? indent.indent_type === 'grocery'
                                      ? 'Grocery'
                                      : indent.indent_type === 'dailie'
                                        ? 'Veg/Meat/Dairy'
                                        : indent.indent_type === 'open_indent'
                                          ? 'Open Indent'
                                          : indent.indent_type === 'medical_indent'
                                            ? 'Medical'
                                            : capitalize(indent.indent_type)
                                    : 'Open'}
                                </span>

<span
  onClick={(e) => {
    if (indent.status?.toLowerCase() === 'rejected') {
      e.stopPropagation(); // Prevent row click
      setSelectedRejectedIndent(indent);
      setShowRejectedIndent(true);
      setShowExpandedView(false);
      setExpandedOrder(null);
    }
  }}
  className={`px-2 py-1 rounded text-xs font-semibold ${
    indent.status?.toLowerCase() === 'rejected'
      ? 'bg-red-100 text-red-700 cursor-pointer hover:bg-red-200'
      : indent.status?.toLowerCase() === 'approved'
        ? 'bg-green-100 text-green-700'
        : indent.status?.toLowerCase() === 'received'
          ? 'bg-purple-100 text-purple-700'
          : indent.status?.toLowerCase() === 'dispatch' || indent.status?.toLowerCase() === 'deptached'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-yellow-100 text-yellow-700'
  }`}
>
  {indent.status?.toLowerCase() === 'approved'
    ? 'Order Placed'
    : indent.status?.toLowerCase() === 'rejected'
      ? 'Rejected'
      : indent.status?.toLowerCase() === 'received'
        ? 'Completed'
        : indent.status?.toLowerCase() === 'dispatch' || indent.status?.toLowerCase() === 'deptached'
          ? 'Dispatched'
          : 'Pending'}
</span>
                              </div>
                              <div className="flex justify-between items-center text-xs text-gray-600">
                                <span>Days: {indent.days}</span>
                                <span className="font-semibold text-gray-900">
                                  Total: {calculateTotal(indent)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order Details Popup - Responsive */}
      {showPopup && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Order Details: {formatOrderDate(selectedOrder.date)}</h3>
              <button onClick={closePopup} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse mb-4 min-w-max">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Prisoner Segment</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 text-right text-xs sm:text-sm">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.segments.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 text-xs sm:text-sm">{item.segment}</td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 text-right text-xs sm:text-sm">{item.nos}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-medium">
                    <td className="border border-gray-300 px-2 sm:px-4 py-2 text-xs sm:text-sm">Total</td>
                    <td className="border border-gray-300 px-2 sm:px-4 py-2 text-right text-xs sm:text-sm">{selectedOrder.total}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <button onClick={closePopup} className="px-3 sm:px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition text-sm sm:text-base">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showZeroOrderConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <p className="text-sm sm:text-base text-gray-800 mb-4">
              Some items in your indent have an order quantity of <strong>0</strong> and will not be included in the final order.<br />
              Do you still want to proceed with submitting the indent?
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                onClick={() => setShowZeroOrderConfirm(false)}
              >
                No, Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={() => {
                  setShowZeroOrderConfirm(false);
                  if (cachedOrderPayload) {
                    submitOrderRequest(cachedOrderPayload.token, cachedOrderPayload.payload);
                  }
                }}
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}
      {showOrderSummary && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Order Summary
                </h2>
                <button
                  onClick={() => setShowOrderSummary(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-2">
              {/* Note Section */}
              {orderSummaryData?.note && (
                <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">Important Note</p>
                      <p className="text-sm text-red-700 mt-1">{orderSummaryData.note}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Details Grid */}

              <div className="grid grid-cols-1 gap-2">
                {/* Store Details Section */}
                {storeDetails && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center mb-2">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Store Details</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Store Name:</span>
                        <span className="ml-1 text-gray-900">{storeDetails.name || '-'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">District:</span>
                        <span className="ml-1 text-gray-900">{storeDetails.district || '-'}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-stretch p-3 bg-gray-50 rounded-lg">
                  {/* Order Date */}
                  <div className="flex items-center w-1/2 pr-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m1 5v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6m8-2V7a1 1 0 00-1-1H9a1 1 0 00-1 1v2m8 0V7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-semibold text-gray-900">
                        {orderSummaryData?.date
                          ? new Date(orderSummaryData.date).toLocaleDateString('en-IN')
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {/* Indent Type */}
                  <div className="flex items-center w-1/2 pl-4 border-l border-gray-200">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Indent Type</p>
                      <p className="font-semibold text-gray-900">
                        {pendingOrderPayload?.indent_type === 'grocery'
                          ? 'Grocery'
                          : pendingOrderPayload?.indent_type === 'dailie'
                            ? 'Veg / Meat / Dairy'
                            : pendingOrderPayload?.indent_type === 'open_indent'
                              ? 'Open Indent'
                              : pendingOrderPayload?.indent_type}
                      </p>
                    </div>
                  </div>
                </div>


                {(pendingOrderPayload?.indent_type === 'grocery' || pendingOrderPayload?.indent_type === 'dailie') && (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>

                    <div className="flex-grow">
                      <p className="text-sm text-gray-600">Segments</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {orderSummaryData?.segmentNames.map((segmentId, index) => {
                          const segmentName = segmentList.find(seg => seg.id === segmentId)?.category || segmentId;
                          return (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {segmentName}
                            </span>
                          );
                        })}

                      </div>
                    </div>
                  </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-orange-600">Total Items</p>
                        <p className="text-2xl font-bold text-orange-900">
                          {pendingOrderPayload?.indent_type === 'open_indent'
                            ? (orderSummaryData?.totalItems ?? 0)
                            : indentDetails.filter(item => parseFloat(item.editableOrder) > 0).length}
                        </p>


                      </div>
                    </div>
                  </div>

                  {(pendingOrderPayload?.indent_type === 'grocery' || pendingOrderPayload?.indent_type === 'dailie') && (
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-600">Total Residents</p>
                          <p className="text-2xl font-bold text-blue-900">{orderSummaryData?.totalResidents}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>


            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
              <button
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-gray-200"
                onClick={() => setShowOrderSummary(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={confirmSubmitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  );
};

export default IndentCreation;
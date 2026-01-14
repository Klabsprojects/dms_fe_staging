
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FileSpreadsheet } from "lucide-react";


const AttendanceCreation = () => {
  const [segments, setSegments] = useState([
    { segmentId: '', category: '', diet: '', nos: '' }
  ]);
  const normalizeSessionKey = (session) => {
  if (!session) return "";
  if (session.toLowerCase() === "evening snacks") return "evening snacks"; 
  return session.toLowerCase(); // morning, midday, evening
};


  // Extra items state
  const [extraItems, setExtraItems] = useState([
    { category: '', item: '', quantity: '' }
  ]);
  const [itemsOptions, setItemsOptions] = useState([]); // store fetched items
  const [orderSummaryData, setOrderSummaryData] = useState(null);



  const [segmentOptions, setSegmentOptions] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [showAttendanceDetails, setShowAttendanceDetails] = useState(false);

  const [attendance, setAttendance] = useState({});
  const [showOrderSummary, setShowOrderSummary] = useState(false);


  // New states for preview
  const [previewData, setPreviewData] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const [selectedSession, setSelectedSession] = useState('Morning');

  const [existingSessions, setExistingSessions] = useState([]);


  const [editableDate, setEditableDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const errorRef = React.useRef(null);


  // Fetch segment options from API
  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/segment`, {
          method: 'GET',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (response.ok && !result.error && result.data?.length) {
          setSegmentOptions(result.data || []);

          // Initialize all 6 segments with 0 count
          setSegments([{ segmentId: '', category: '', diet: '', nos: '' }]);

        }
      } catch (err) {
        setError('Network error while fetching segments');
        console.error('Error fetching segments:', err);
      }
    };

    fetchSegments();
  }, []);


  // Fixed fetchAttendancePreview function
  const fetchAttendancePreview = async () => {
    try {
      setPreviewLoading(true);
      setPreviewError('');

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/attendance`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('API Response:', result); // Keep this for debugging

      // FIX: Check if we have data, regardless of error flag
      if (response.ok && result.data && result.data.length > 0) {
        const transformedData = [];

        result.data.forEach(attendance => {
          // Calculate total count for each attendance record
          const totalCount = Object.values(attendance.attendance || {})
            .reduce((sum, count) => sum + (parseInt(count) || 0), 0);

          transformedData.push({
            id: attendance.id,
            date: attendance.att_date,
            session: attendance.session || '',
            attendance: attendance.attendance,
            items: attendance.items || {},
            extra_items: attendance.extra_items || {},
            segments: attendance.segments || {},
            totalCount: totalCount
          });

        });

        // Sort by date (most recent first)
        transformedData.sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log('Transformed Data:', transformedData); // Keep this for debugging
        setPreviewData(transformedData);

        // Clear any previous errors
        setPreviewError('');
      } else {
        // Only set error if we truly have no data
        if (!result.data || result.data.length === 0) {
          setPreviewError('No attendance data found');
        } else {
          setPreviewError(result.message || 'Error loading attendance data');
        }
        setPreviewData([]);
      }
    } catch (err) {
      setPreviewError('Network error while fetching attendance preview');
      setPreviewData([]);
      console.error('Error fetching attendance preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Update available sessions when date changes
  useEffect(() => {
    if (previewData.length > 0) {
      const sessionsForDate = previewData
        .filter(record => record.date.split('T')[0] === editableDate)
        .map(record => record.session)
        .filter(session => session); // remove empty sessions

      setExistingSessions(sessionsForDate);
    } else {
      setExistingSessions([]);
    }
  }, [editableDate, previewData]);

  // Fetch preview after segments are loaded
  useEffect(() => {
    fetchAttendancePreview();
  }, []);

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

  // ✅ Modified handleSave
  const handleSave = async () => {
    // Check if attendance already exists for this date and session
    const isDuplicate = previewData.some(
      record => record.date.split('T')[0] === editableDate && record.session === selectedSession
    );

    if (isDuplicate) {
      setError(`Attendance for ${selectedSession} session on ${editableDate} already exists. Please select a different session.`);
      return false;
    }

    // Check if all sessions are already used for this date
    const allSessions = ['Morning', 'Midday', 'Evening', 'Evening Snacks'];
    const usedSessionsForDate = previewData
      .filter(record => record.date.split('T')[0] === editableDate)
      .map(record => record.session);

    if (usedSessionsForDate.length >= allSessions.length) {
      setError(`All sessions (Morning, Midday, Evening) have been created for ${editableDate}. Cannot create more attendance for this date.`);
      return false;
    }

    const selected = new Date(editableDate);
    selected.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Build payload for new API
    const segmentPayload = segments.map(seg => ({
      id: seg.segmentId,
    persons: parseFloat(seg.nos) || 0
    }));

    // Validation: At least one segment > 0
    const totalResidents = segmentPayload.reduce((sum, s) => sum + s.persons, 0);
    if (totalResidents <= 0) {
      setError("At least one segment must have attendance Value.");
      return false;
    }

    const payload = {
      date: editableDate,
      session: selectedSession,
      segment: segmentPayload
    };

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("https://rcs-dms.onlinetn.com/api/v1//indent/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to save attendance.");
        return false;
      }

      // Save both attendance + extra items + API response for summary popup
      setOrderSummaryData({
        date: editableDate,
        session: selectedSession,
        totalResidents,
        items: extraItems.filter(item => item.item && item.quantity),
        apiResponse: data
      });

      return true;
    } catch (err) {
      setError("Something went wrong while saving attendance.");
      return false;
    }
  };
  const handleOpenSummary = async () => {
    const saved = await handleSave();
    if (saved) {
      setShowOrderSummary(true);
    }
  };

const loadAttendanceById = (record) => {
  console.log('Loading attendance for record:', record); // Debug log

  const attendanceMap = record.attendance || {};

  // Only load segments that have attendance data (value > 0)
  const updatedSegments = Object.entries(attendanceMap)
    .filter(([segId, count]) => count > 0) // Only include segments with count > 0
    .map(([segId, count]) => {
      const segment = segmentOptions.find(seg => seg.id.toString() === segId);
      return {
        segmentId: segId,
        category: segment?.category || '',
        diet: segment?.diet || '',
        nos: count.toString(),
      };
    });

  // If no segments found, show at least one empty row
  setSegments(updatedSegments.length > 0 ? updatedSegments : [{ segmentId: '', category: '', diet: '', nos: '' }]);
  
  setEditableDate(record.date.split('T')[0]);
  setSelectedSession(record.session); // Also load the session
  setError('');

  console.log('Updated segments:', updatedSegments); // Debug log
};
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);

    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });

    // Add suffix (st, nd, rd, th)
    const getSuffix = (d) => {
      if (d > 3 && d < 21) return "th"; // 4th–20th
      switch (d % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    };

    return `${day}${getSuffix(day)} ${month}`;
  };

  const currentTotal = segments.reduce((sum, item) => sum + (parseInt(item.nos) || 0), 0);

  const isDateAlreadyUsed = previewData.some(
    (record) => record.date.split('T')[0] === editableDate
  );

  // Fetch items for Extra Items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${API_BASE_URL}/segment/items`, {
          method: "GET",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        });
        const result = await response.json();

        if (response.ok && !result.error && result.data?.length) {
          setItemsOptions(result.data);
        }
      } catch (err) {
        console.error("Error fetching items:", err);
      }
    };

    fetchItems();
  }, []);

  const handleExtraChange = (index, field, value) => {
    const updated = [...extraItems];
    updated[index][field] = value;

    // Reset item when category changes
    if (field === "category") {
      updated[index].item = "";
    }

    setExtraItems(updated);
  };

  const addExtraRow = () => {
    setExtraItems([...extraItems, { category: "", item: "", quantity: "" }]);
  };

  const removeExtraRow = (index) => {
    const updated = extraItems.filter((_, i) => i !== index);
    setExtraItems(updated);
  };

  const handleSaveAndOpenSummary = async () => {
    const saved = await handleSave();   // keep your existing save
    if (saved) {
      await getDietRollSummary();           // call diet-roll API instead of orderSummaryData
    }
  };

const handleConfirmSave = async () => {
  try {
    setLoading(true);

    // Build attendance object (always required)
    const attendanceObj = {};
    segments.forEach(segment => {
      if (segment.segmentId) {
     attendanceObj[segment.segmentId.toString()] = parseFloat(segment.nos) || 0;
      }
    });

    // Normalized session key (works for Morning, Midday, Evening, Evening Snacks)
    const mealKey = normalizeSessionKey(selectedSession);

    // ✅ Always fetch diet-roll first if missing
    if (!orderSummaryData?.dietRollResponse) {
      const token = localStorage.getItem("authToken");
      const sessionSlug = selectedSession.toLowerCase();

      const response = await fetch(
        `https://rcs-dms.onlinetn.com/api/v1//segment/diet-roll/${editableDate}/${sessionSlug}`,
        {
          method: "POST",
          headers: {
            "Authorization": token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ attendance: attendanceObj })
        }
      );

      const data = await response.json();
      if (response.ok) {
        orderSummaryData.dietRollResponse = data.data; // inject diet-roll result
      } else {
        setError(data.message || "Failed to fetch diet roll");
        setLoading(false);
        return;
      }
    }

    // Build diet plan items object
    const dietItemsObj = {};
    if (orderSummaryData.dietRollResponse) {
      Object.values(orderSummaryData.dietRollResponse).forEach(segmentData => {
        Object.values(segmentData[mealKey] || {}).forEach(item => {
          if (item.id && Number(item.qty) > 0) {
            const itemId = item.id.toString();
            const quantity = Number(item.qty);
            dietItemsObj[itemId] = (dietItemsObj[itemId] || 0) + quantity;
          }
        });
      });
    }

    // Build extra items object
    const extraItemsObj = {};
    extraItems.forEach(item => {
      if (item.item && item.quantity) {
  extraItemsObj[item.item.toString()] = parseFloat(item.quantity) || 0;
      }
    });

    // Build segments object
    const segmentsObj = {};
    if (orderSummaryData.dietRollResponse) {
      Object.values(orderSummaryData.dietRollResponse).forEach(segmentData => {
        const segId = segmentData.segment.id.toString();
        segmentsObj[segId] = {};
        Object.values(segmentData[mealKey] || {}).forEach(item => {
          if (item.id && Number(item.qty) > 0) {
            segmentsObj[segId][item.id.toString()] = Number(item.qty);
          }
        });
      });
    }

    // ✅ Final payload
    const payload = {
      att_date: orderSummaryData.date,
      session: selectedSession,
      attendance: attendanceObj,
      items: dietItemsObj,
      extra_items: extraItemsObj,
      segments: segmentsObj
    };

    console.log("Final Payload:", payload);

    const token = localStorage.getItem("authToken");
    const response = await fetch("https://rcs-dms.onlinetn.com/api/v1//attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
if (response.ok) {
  setShowOrderSummary(false);
  setError('');
  fetchAttendancePreview();
  
  // Clear extra items
  setExtraItems([{ category: '', item: '', quantity: '' }]);

  // Reset segments to fresh empty state
  setSegments([{ segmentId: '', category: '', diet: '', nos: '' }]);
  
  // Clear order summary data
  setOrderSummaryData(null);
  
  // Reset to today's date
  const today = new Date();
  setEditableDate(today.toISOString().split('T')[0]);
  
  // Reset to first available session
  setSelectedSession('Morning');
  
} else {
  setError(result.message || "Failed to save attendance");
}
  } catch (err) {
    setError("Network error while saving attendance");
    console.error("Error saving attendance:", err);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });

      // Clear after 3 seconds
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const [showItemsPopup, setShowItemsPopup] = useState(false);
  const [selectedAttendanceItems, setSelectedAttendanceItems] = useState(null);


  // 2. ADD THIS FUNCTION (add after handleConfirmSave function around line 280):
  // Handle view items using existing data
  const handleViewItems = (record) => {
    const totalCount = Object.values(record.attendance || {}).reduce(
      (sum, count) => sum + (parseInt(count) || 0),
      0
    );
    setSelectedAttendanceItems({
      id: record.id,
      att_date: record.date,
      session: record.session || "",   // ✅ add this
      attendance: record.attendance || {},   // 🔥 add this line
      items: record.items || {},
      extra_items: record.extra_items || {},
      segments: record.segments || {},
      totalCount // ✅ add this
    });
    setShowItemsPopup(true);
  };



  // Reset session if current selection is not available
  useEffect(() => {
    // Only change session if the current one is already used for this date
    if (existingSessions.includes(selectedSession)) {
      const availableSessions = ['Morning', 'Midday', 'Evening']
        .filter(session => !existingSessions.includes(session));

      if (availableSessions.length > 0) {
        setSelectedSession(availableSessions[0]);
      }
    }
  }, [existingSessions]); // Remove selectedSession from dependency array

  const [dietRollData, setDietRollData] = useState(null);
  // Replace the fetchDietRoll function (around line 400) with this:
  const fetchDietRoll = async () => {
    try {
      setLoading(true);

      // Build attendance object from segments
      const attendanceObj = {};
      segments.forEach(segment => {
        if (segment.segmentId && parseInt(segment.nos) > 0) {
          attendanceObj[segment.segmentId.toString()] = parseInt(segment.nos);
        }
      });

      // Validate that we have attendance data
      if (Object.keys(attendanceObj).length === 0) {
        setError("Please add attendance count for at least one segment");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("authToken");
      const sessionSlug = selectedSession.toLowerCase();

      // POST request with attendance payload
      const response = await fetch(
        `https://rcs-dms.onlinetn.com/api/v1//segment/diet-roll/${editableDate}/${sessionSlug}`,
        {
          method: "POST",
          headers: {
            "Authorization": token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            attendance: attendanceObj
          })
        }
      );

      const data = await response.json();
      if (response.ok) {
        // Calculate total residents
        const totalResidents = Object.values(attendanceObj).reduce((sum, count) => sum + count, 0);

        // Set the order summary data with diet roll response
        setOrderSummaryData({
          date: editableDate,
          session: selectedSession,
          totalResidents: totalResidents,
          items: extraItems.filter(item => item.item && item.quantity),
          dietRollResponse: data.data // Store the diet roll data here
        });

        setShowOrderSummary(true);
        setError('');
      } else {
        setError(data.message || "Failed to fetch diet roll");
        console.error("Diet roll error:", data.message);
      }
    } catch (err) {
      setError("Network error while fetching diet roll");
      console.error("Diet roll network error:", err);
    } finally {
      setLoading(false);
    }
  };
  const [dietRollSummary, setDietRollSummary] = useState(null);

  const getDietRollSummary = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const sessionSlug = selectedSession.toLowerCase(); // lowercase session for API

      const response = await fetch(
        `https://rcs-dms.onlinetn.com/api/v1//segment/diet-roll/${editableDate}/${sessionSlug}`,
        {
          method: "GET",
          headers: {
            "Authorization": token,
            "Content-Type": "application/json"
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setDietRollSummary(data.data);   // only take the `data` part
        setShowOrderSummary(true);       // open summary modal
      } else {
        console.error("Diet roll error:", data.message);
      }
    } catch (err) {
      console.error("Diet roll network error:", err);
    }
  };

  const [dietRollResponseData, setDietRollResponseData] = useState(null);



  const fetchDietRollResponseData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const sessionSlug = selectedSession.toLowerCase();

      const response = await fetch(
        `https://rcs-dms.onlinetn.com/api/v1//segment/diet-roll/${editableDate}/${sessionSlug}`,
        {
          method: "GET",
          headers: {
            "Authorization": token,
            "Content-Type": "application/json"
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setDietRollResponseData(data.data);
        setShowOrderSummary(true);
      } else {
        console.error("Diet roll error:", data.message);
      }
    } catch (err) {
      console.error("Diet roll network error:", err);
    }
  };
const handleExportExcel = () => {
  if (!selectedAttendanceItems) return;

  // Helpers
  function capitalizeFirst(text) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  function formatDateForExcel(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Collect all item IDs from segments + extra items
  const allItemIds = new Set();
  Object.values(selectedAttendanceItems.segments || {}).forEach(segItems => {
    Object.keys(segItems || {}).forEach(itemId => allItemIds.add(itemId));
  });
  Object.keys(selectedAttendanceItems.extra_items || {}).forEach(itemId => allItemIds.add(itemId));

  // Map item IDs to names (columns)
  const itemColumns = Array.from(allItemIds).map(itemId => {
    const itemDetail = itemsOptions.find(i => i.id.toString() === itemId);
    return { id: itemId, name: itemDetail?.name?.toLowerCase() || `item ${itemId}` };
  });

  // Build rows for each segment
  const rows = Object.entries(selectedAttendanceItems.attendance || {}).map(([segId, count]) => {
    const segment = segmentOptions.find(s => s.id.toString() === segId);
    const segItems = selectedAttendanceItems.segments?.[segId] || {};

    const row = {
      date: formatDateForExcel(selectedAttendanceItems.att_date),
      session: capitalizeFirst(selectedAttendanceItems.session || ""),
      "segment / items": `${capitalizeFirst(segment?.category || "segment")} (${capitalizeFirst(segment?.diet || "n/a")})`,
      attendance: count,
    };

    itemColumns.forEach(col => {
      row[col.name] = segItems[col.id] || 0;
    });

    return row;
  });

  // Add extra items row if present
  if (selectedAttendanceItems.extra_items && Object.keys(selectedAttendanceItems.extra_items).length > 0) {
    const row = {
      date: formatDateForExcel(selectedAttendanceItems.att_date),
      session: capitalizeFirst(selectedAttendanceItems.session || ""),
      "segment / items": "Extra items",
      attendance: "-",
    };
    itemColumns.forEach(col => {
      row[col.name] = selectedAttendanceItems.extra_items[col.id] || 0;
    });
    rows.push(row);
  }

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows, { origin: "A1" });

  // Format headers → First letter uppercase
  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
    if (worksheet[cellRef]) {
      const headerText = worksheet[cellRef].v.toString();
      worksheet[cellRef].v = headerText.charAt(0).toUpperCase() + headerText.slice(1).toLowerCase();
      worksheet[cellRef].s = { font: { bold: true } };
    }
  }

  // Format first column "segment / items" rows → capitalize first
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const cellRef = XLSX.utils.encode_cell({ r: R, c: 2 }); // col index 2 = "segment / items"
    if (worksheet[cellRef]) {
      worksheet[cellRef].v = capitalizeFirst(worksheet[cellRef].v.toString());
      worksheet[cellRef].s = { font: { bold: true } };
    }
  }

  // Create workbook & save
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Diet Roll");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array", cellStyles: true });
  const data = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(data, `diet_roll_${selectedAttendanceItems.att_date}_${selectedAttendanceItems.session}.xlsx`);
};


  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 rounded-lg">
      <div className="flex gap-6">
        {/* Left Side - Attendance Creation */}
        <div className="flex-1">
          <div className="bg-white shadow rounded-lg p-6 h-full flex flex-col">
            <h1 className="text-xl font-semibold text-center mb-4 text-gray-800">No of People Eating today</h1>
            {error && (
              <div
                ref={errorRef}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm"
              >
                {error}
              </div>
            )}
            <div className="mb-4 flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Date:</span>
                    <input
                      type="date"
                      value={editableDate}
                      min={new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0]} // 7 days ago
                      max={new Date().toISOString().split('T')[0]} // today
                      onChange={(e) => setEditableDate(e.target.value)}
                      className="text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Session:</span>
                    <select
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      className="text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                   {['Morning', 'Midday', 'Evening Snacks', 'Evening'].map(session => {
  const isUsed = existingSessions.includes(session);
  return (
    <option
      key={session}
      value={session}
      disabled={isUsed}
      style={isUsed ? { color: '#9CA3AF', backgroundColor: '#F3F4F6' } : {}}
    >
      {session}
    </option>
  );
})}
                    </select>
                  </div>
                </div>

              </div>
              <p className="text-sm font-medium text-gray-700 mt-2">
                Total: {currentTotal}
              </p>
            </div>

            <div className="overflow-auto">
              <table className="w-full table-auto border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">S.No</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Resident Segment</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Attendance Count</th>
                  </tr>
                </thead>
                <tbody>
                  {segments.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">

                      {/* S.No */}
                      <td className="border border-gray-300 px-4 py-2">{index + 1}.</td>

                      {/* Resident Segment Dropdown */}
                   {/* Resident Segment Dropdown */}
<td className="border border-gray-300 px-4 py-2">
  <select
    value={item.segmentId}
    onChange={(e) => handleSegmentChange(index, e.target.value)}
    className="w-full px-2 py-1 border border-gray-300 rounded-md"
  >
    <option value="">Select Segment</option>
    {segmentOptions.map(option => {
      // Check if this segment is already selected in another row
      const isAlreadySelected = segments.some(
        (seg, idx) => idx !== index && seg.segmentId === option.id.toString()
      );

      // Check if this category appears more than once with different diets
      const hasMultipleDiets = segmentOptions.filter(
        seg => seg.category === option.category
      ).length > 1;

      return (
        <option 
          key={option.id} 
          value={option.id}
          disabled={isAlreadySelected}
          style={isAlreadySelected ? { color: '#9CA3AF', backgroundColor: '#F3F4F6' } : {}}
        >
          {hasMultipleDiets
            ? `${option.category} - ${option.diet}`
            : option.category}
        </option>
      );
    })}
  </select>
</td>

                      {/* Attendance Count */}
                      <td className="border border-gray-300 px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          value={item.nos}
                          onChange={(e) => handleNosChange(index, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          placeholder="0"
                        />
                      </td>

                      {/* Action Button */}
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {index === segments.length - 1 ? (
                          <button
                            type="button"
                            onClick={addRow}
                            className="text-green-600 hover:text-green-800"
                            title="Add Row"
                          >
                            ➕
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            className="text-red-600 hover:text-red-800"
                            title="Remove Row"
                          >
                            ➖
                          </button>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>


              </table>
            </div>

            {/* Extra Items Section */}
            <div className="mt-2">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Extra Items
              </h2>

              <table className="w-full table-auto border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="w-12 border border-gray-300 px-2 py-2 text-left">S.No</th>
                    <th className="w-1/4 border border-gray-300 px-2 py-2 text-left">Category</th>
                    <th className="w-1/3 border border-gray-300 px-2 py-2 text-left">Item</th>
                    <th className="w-1/5 border border-gray-300 px-2 py-2 text-left">Quantity</th>
                    <th className="w-12 border border-gray-300 px-2 py-2 text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {extraItems.map((row, index) => {
                    // Filter items based on category
                    const filteredItems = itemsOptions.filter((opt) => {
                      if (row.category === "grocery") return opt.category === "food";
                      if (row.category === "dailie") return opt.category === "dailie";
                      if (row.category === "housekeeping") return opt.category === "housekeeping";
                      return false;
                    });

                    return (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        {/* S.No */}
                        <td className="w-12 border border-gray-300 px-2 py-2 text-center">
                          {index + 1}.
                        </td>

                        {/* Category Dropdown */}
                        <td className="w-1/4 border border-gray-300 px-2 py-2">
                          <select
                            value={row.category}
                            onChange={(e) => handleExtraChange(index, "category", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          >
                            <option value="">Select Category</option>
                            <option value="grocery">Grocery</option>
                            <option value="dailie">Veg / Meat / Dairy</option>
                            <option value="housekeeping">House Keeping</option>
                          </select>
                        </td>

                        {/* Item Dropdown */}
                        <td className="w-1/3 border border-gray-300 px-2 py-2">
                          <select
                            value={row.item}
                            onChange={(e) => handleExtraChange(index, "item", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          >
                            <option value="">Select Item</option>
                            {filteredItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Quantity Input */}
                        {/* Quantity Input + Unit */}
                        <td className="w-1/5 border border-gray-300 px-2 py-2">
                          <div className="flex items-center gap-2">
                            <input
  type="number"
  min="0"
  step="0.01"
  value={row.quantity}
  onChange={(e) => handleExtraChange(index, "quantity", e.target.value)}
  className="w-20 px-2 py-1 border border-gray-300 rounded-md"
/>
                            {/* Show unit if item is selected */}
                            <span className="text-sm text-gray-600">
                              {
                                itemsOptions.find(opt => opt.id.toString() === row.item)?.indent || ""
                              }
                            </span>
                          </div>
                        </td>


                        {/* Action (+/- Button) */}
                        <td className="w-12 border border-gray-300 px-2 py-2 text-center">
                          {index === extraItems.length - 1 ? (
                            <button
                              onClick={addExtraRow}
                              className="text-green-600 hover:text-green-800"
                              title="Add Row"
                            >
                              ➕
                            </button>
                          ) : (
                            <button
                              onClick={() => removeExtraRow(index)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove Row"
                            >
                              ➖
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>


            <div className="mt-4 flex justify-end">
              {(() => {
                const isDuplicate = previewData.some(
                  record => record.date.split('T')[0] === editableDate && record.session === selectedSession
                );

                return (
                  <button
                    onClick={fetchDietRoll}
                    disabled={loading || isDuplicate}
                    className={`px-4 py-2 rounded transition ${isDuplicate
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-sky-600 text-white hover:bg-sky-700'
                      } ${loading ? 'disabled:opacity-50' : ''}`}
                  >
                    {loading ? 'Saving...' : isDuplicate ? ` Already Created` : 'Submit'}
                  </button>
                );
              })()}
            </div>
          </div>

        </div>

        {/* Right Side - Preview */}
        <div className="w-96">
          <div className="bg-white shadow rounded-lg p-6 h-full flex flex-col">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Previous Records
            </h2>



            {previewLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
              </div>
            ) : previewError ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-700">{previewError}</p>
              </div>
            ) : previewData.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <p className="text-sm text-gray-600">No attendance data for this date</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto">
                <div className="bg-gray-50 rounded-lg p-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-2">Date</th>
                        <th className="text-right py-2">Total Count</th>
                        <th className="text-center py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((item, index) => (
                        <tr key={index} className="border-b border-gray-200 last:border-b-0">
                          <td className="py-2 text-left">
                            {formatDate(item.date)}{" "}
                            <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                              {item.session}
                            </span>
                          </td>
                          <td className="py-2 text-right font-semibold">
                            {item.totalCount}
                          </td>
                          <td className="py-2 text-center">
                            <button
                              onClick={() => {
                                loadAttendanceById(item)
                              }}
                              className="text-blue-600 hover:text-blue-800 text-lg mr-1"
                              title="Refresh"
                            >
                              🔄
                            </button>
                            <button
                              onClick={() => handleViewItems(item)}
                              className="text-green-600 hover:text-green-800 text-lg"
                              title="View Items"
                            >
                              📦
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
        {showPopup && selectedAttendance && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center px-4">
            <div className="relative bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl transition-all">
              {/* Info Section */}
              <div className="space-y-2 mb-4 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="font-medium"> Date:</span>
                  <span>{formatDate(selectedAttendance.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium"> Total Count:</span>
                  <span className="text-blue-600 font-semibold">{selectedAttendance.totalCount}</span>
                </div>
              </div>

              <hr className="my-3" />

              {/* Segment-wise Breakdown */}
              <div>
                <p className="text-sm font-medium mb-2 text-gray-800"> Segment-wise Attendance</p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {Object.entries(selectedAttendance.attendance || {}).map(([segId, count]) => {
                    const segment = segmentOptions.find(s => s.id.toString() === segId);
                    return (
                      <div key={segId} className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm">
                        <div className="text-gray-800">
                          {segment?.category || 'Segment'}{" "}
                          <span className="text-gray-500">({segment?.diet || 'N/A'})</span>
                        </div>
                        <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowPopup(false)}
                  className="inline-block px-5 py-2 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {showOrderSummary && orderSummaryData && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
              {/* Header - Fixed */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl flex-shrink-0">
                <h2 className="text-xl font-semibold">Diet Roll Summary</h2>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Order Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-gray-600 text-sm">Date</span>
                      <p className="font-semibold">{formatDate(orderSummaryData.date)}</p>
                    </div>

                    <div>
                      <span className="text-gray-600 text-sm">Total Residents</span>
                      <p className="font-semibold">{orderSummaryData.totalResidents}</p>
                    </div>
                  </div>

                  {/* API Response Items */}
                  {/* Diet Plan Items */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">Diet Plan Items</h3>
                      <span className="text-sm text-gray-500 bg-blue-100 px-2 py-1 rounded">
                     {orderSummaryData.dietRollResponse ?
  (() => {
const mealKey = normalizeSessionKey(orderSummaryData.session);

    return Object.values(orderSummaryData.dietRollResponse).reduce((total, segment) =>
      total + Object.keys(segment[mealKey] || {}).length, 0
    );
  })() : 0} items

                      </span>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {orderSummaryData.dietRollResponse && Object.keys(orderSummaryData.dietRollResponse).length > 0 ? (
                        <div className="space-y-4 p-4">
                          {Object.entries(orderSummaryData.dietRollResponse).map(([segmentName, segmentData], segmentIdx) => (
                            <div key={segmentIdx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">

                              {/* Segment header */}
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold text-gray-800">{segmentName}</h4>
                                <span className="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded">
                                  {segmentData.persons} persons
                                </span>
                              </div>

                              {/* Items table */}
                              {/* Items table */}
                              <table className="w-full text-sm border border-gray-200 rounded">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left border-b border-gray-200">S.No</th>
                                    <th className="px-3 py-2 text-left border-b border-gray-200">Item</th>
                                    <th className="px-3 py-2 text-right border-b border-gray-200">Quantity</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                 const mealKey = orderSummaryData.session.toLowerCase();
const items = segmentData[mealKey] || {};
                                    return Object.values(items).map((item, itemIdx) => (
                                      <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 border-b border-gray-100">{itemIdx + 1}</td>
                                        <td className="px-3 py-2 border-b border-gray-100">{item.name}</td>
                                        <td className="px-3 py-2 text-right font-medium border-b border-gray-100">
                                          {item.qty} {item.unit}
                                        </td>
                                      </tr>
                                    ));
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-500 bg-gray-50">
                          <div className="text-4xl mb-2">🍽️</div>
                          <p>No diet plan items found</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Extra Items Added by User */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">Extra Items</h3>
                      <span className="text-sm text-gray-500 bg-green-100 px-2 py-1 rounded">
                        {orderSummaryData.items.length} items
                      </span>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {orderSummaryData.items.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 bg-gray-50">
                          <div className="text-4xl mb-2">📦</div>
                          <p>No extra items added</p>
                        </div>
                      ) : (
                        <div className="overflow-y-auto max-h-60">
                          <div className="bg-white">
                            {orderSummaryData.items.map((item, idx) => {
                              const itemDetail = itemsOptions.find(opt => opt.id.toString() === item.item);
                              return (
                                <div key={idx} className="flex justify-between items-center px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center space-x-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-semibold">
                                      {idx + 1}
                                    </span>
                                    <span className="font-medium text-gray-800">
                                      {itemDetail?.name || "Unknown Item"}
                                    </span>
                                  </div>
                                  <span className="  px-3 py-1 rounded-full text-sm font-semibold">
                                    {item.quantity} {itemDetail?.unit || itemDetail?.indent || ''}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer - Fixed */}
              <div className="border-t border-gray-200 p-6 bg-white rounded-b-xl flex-shrink-0">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowOrderSummary(false)}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSave}
                    disabled={loading}   // 👈 disable when loading
                    className={`px-6 py-2.5 rounded-lg font-medium shadow-lg transition-all
    ${loading
                        ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"}
  `}
                  >
                    {loading ? "Saving..." : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showItemsPopup && selectedAttendanceItems && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">

              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl flex-shrink-0 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Diet Roll Items</h2>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-gray-100"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-3"> {/* Reduced space-y-6 to space-y-3 */}

                  {/* Diet Plan Items */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {selectedAttendanceItems.att_date ? formatDate(selectedAttendanceItems.att_date) : formatDate(new Date())}
                          {" • "}
                          Session: {selectedAttendanceItems.session || "N/A"}</h3>
                      </div>
                      <span className="text-black text-sm font-semibold px-3 py-1 flex items-center gap-1">
                        👥: {selectedAttendanceItems.totalCount || 0}
                      </span>
                    </div>

                    {selectedAttendanceItems.attendance && Object.keys(selectedAttendanceItems.attendance).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(selectedAttendanceItems.attendance).map(([segId, count]) => {
                          const segment = segmentOptions.find(s => s.id.toString() === segId);
                          const items = selectedAttendanceItems.segments?.[segId] || {}; // fallback if no diet items

                          return (
                            <div key={segId} className="border rounded-lg p-4 bg-gray-50">
                              {/* Segment Header */}
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold">
                                  {segment?.category || `Segment ${segId}`} ({segment?.diet || "N/A"})
                                </h4>
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                                  {count} persons
                                </span>
                              </div>

                              {/* Show diet items only if exist */}
                              {Object.keys(items).length > 0 ? (
                                <table className="w-full text-sm border border-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-3 py-2 text-left">S.No</th>
                                      <th className="px-3 py-2 text-left">Item</th>
                                      <th className="px-3 py-2 text-right">Qty</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Object.entries(items).map(([itemId, qty], idx) => {
                                      const itemDetail = itemsOptions.find(i => i.id.toString() === itemId);
                                      return (
                                        <tr key={itemId}>
                                          <td className="px-3 py-2">{idx + 1}</td>
                                          <td className="px-3 py-2">{itemDetail?.name || `Item ${itemId}`}</td>
                                          <td className="px-3 py-2 text-right">
                                            {qty} {itemDetail?.indent || ""}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-gray-500 text-sm italic">No diet plan items found</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                        <div className="text-4xl mb-2">🍽️</div>
                        <p className="text-gray-500">No segment attendance found</p>
                      </div>
                    )}

                  </div>

                  {/* Extra Items */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center"> {/* mb-3 to mb-1 */}
                      <span className="bg-green-100 text-green-600 p-2 rounded-lg mr-3">📦</span>
                      Extra Items
                    </h3>

                    {selectedAttendanceItems.extra_items && Object.keys(selectedAttendanceItems.extra_items).length > 0 ? (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="border-b border-gray-200 px-4 py-3 text-left">S.No</th>
                              <th className="border-b border-gray-200 px-4 py-3 text-left">Item Name</th>
                              <th className="border-b border-gray-200 px-4 py-3 text-right">Quantity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(selectedAttendanceItems.extra_items).map(([itemId, quantity], idx) => {
                              const itemDetail = itemsOptions.find(opt => opt.id.toString() === itemId);
                              return (
                                <tr key={itemId} className="hover:bg-gray-50">
                                  <td className="border-b border-gray-100 px-4 py-3 text-gray-600">
                                    {idx + 1}
                                  </td>
                                  <td className="border-b border-gray-100 px-4 py-3 font-medium">
                                    {itemDetail?.name || `Item ID: ${itemId}`}
                                  </td>
                                  <td className="border-b border-gray-100 px-4 py-3 text-right font-semibold">
                                    {(Number(quantity).toFixed(3))} {itemDetail?.unit || itemDetail?.indent || ''}
                                  </td>

                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                        <div className="text-4xl mb-2">📦</div>
                        <p className="text-gray-500">No extra items found</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-6 bg-white rounded-b-xl flex-shrink-0">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowItemsPopup(false)}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default AttendanceCreation;
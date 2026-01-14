import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../services/api';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { FileSpreadsheet } from "lucide-react";
import { saveAs } from "file-saver";
import axios from "axios";
// OR if you already have custom api instance with interceptors:
// import api from "../config/api";

import * as XLSX from "xlsx-js-style";

import ExcelJS from "exceljs";


import { enGB } from "date-fns/locale";


const categoryToType = {
  'Grocery': 'food',
  'Veg/Meat/Dairy': 'dailie',
  'Housekeeping': 'housekeeping',
};


const Stock = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddStockForm, setShowAddStockForm] = useState(false);
const [stocksToAdd, setStocksToAdd] = useState([
  { category: '', itemId: '', quantity: '', unit: '', adjustType: '', adjustValue: '', remarks: '' }
]);

  const [categories] = useState(['Grocery', 'Veg/Meat/Dairy', 'Housekeeping']);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [summaryData, setSummaryData] = useState([]);
  const [availableItems, setAvailableItems] = useState({
    Grocery: [],
    'Veg/Meat/Dairy': [],
    Housekeeping: []
  });

  const [remarks, setRemarks] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [originalStocks, setOriginalStocks] = useState({}); // Track original values
  const [showUpdateSummary, setShowUpdateSummary] = useState(false);
  const [editedItems, setEditedItems] = useState({});
  const [showAddSummary, setShowAddSummary] = useState(false);
  const [preparedItems, setPreparedItems] = useState({});
  const [showDietRoll, setShowDietRoll] = useState(false);
  const [dietRollData, setDietRollData] = useState([]);
  const [dietLoading, setDietLoading] = useState(false);
  const [dietError, setDietError] = useState(null);
const [successMessage, setSuccessMessage] = useState("");
const successRef = useRef(null);
const [showItemSummary, setShowItemSummary] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);




  // Add this right after the useState line:
  const handleRemarksChange = useCallback((value) => {
    setRemarks(value);
  }, []);

  const handleAddAllStocks = () => {
    const itemsPayload = {};
  stocksToAdd.forEach(row => {
  if (row.itemId) {
    if (row.adjustValue) {
   itemsPayload[row.itemId] = {
  type: row.adjustType || "opening",
  value: parseFloat(row.adjustValue),
  description: row.remarks || ""   // ✅ send row description
};
    }
  }
});

    if (Object.keys(itemsPayload).length === 0) {
      alert("Please add at least one valid item!");
      return;
    }

    setPreparedItems(itemsPayload);
    setShowAddSummary(true); // 🔥 open popup instead of API call
  };
  const confirmAddStocks = async () => {
    setSaveLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const requestData = {
        items: preparedItems,
        remarks: remarks || "Stock addition"
      };

      const response = await fetch(`${API_BASE_URL}/item/stock/update`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      if (response.ok && !result.error) {
        setSuccessMessage("Stocks added successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);

        // 🔥 auto scroll
        setTimeout(() => {
          successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);


        // Reset form
        setStocksToAdd([{ category: '', itemId: '', quantity: '', unit: '' }]);
        setShowAddStockForm(false);
        setShowAddSummary(false);
        setPreparedItems({});
        setRemarks("");

        // 🔥 Re-fetch updated stocks instead of page reload
        const refreshed = await fetch(`${API_BASE_URL}/item/list/stock`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const refreshedData = await refreshed.json();
        if (refreshed.ok && !refreshedData.error) {
          setStocks(refreshedData.data || []);
        }
      } else {
        // ✅ removed alert
        console.error(result.message || "Failed to add stocks");
      }
    } catch (err) {
      console.error("Error adding stocks:", err);
      // ✅ removed alert
    } finally {
      setSaveLoading(false);
    }
  };
const handleRowChange = (index, field, value) => {
  const updated = [...stocksToAdd];
  updated[index][field] = value;

  if (field === "itemId") {
    // Look up selected item from all categories
    const allItems = Object.values(availableItems).flat();
    const selected = allItems.find(i => i.id === parseInt(value));

    if (selected) {
      updated[index].unit = selected.indent || '';

      // Match against stock API response
      const stockRecord = stocks.find(
        s => s.item_id === selected.id || s.id === selected.id
      );

  if (stockRecord && stockRecord.stock !== undefined && stockRecord.stock !== null) {
        // Item exists in stock API → show quantity and allow adjustment
        updated[index].quantity = stockRecord.stock;
        updated[index].adjustType = "";
        updated[index].adjustValue = "";
      } else {
        // Item not in stock API → no quantity, force opening balance entry
        updated[index].quantity = "";
        updated[index].adjustType = "";
        updated[index].adjustValue = "";
      }
    }
  }
  setStocksToAdd(updated);
};

const addNewRow = () => {
  setStocksToAdd([...stocksToAdd, { category: '', itemId: '', quantity: '', unit: '', adjustType: '', adjustValue: '', remarks: '' }]);
};



  useEffect(() => {
    const fetchStockList = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/item/list/stock`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (response.ok && !result.error) {
          setStocks(result.data || []);
        } else {
          setError(result.message || 'Failed to fetch stocks');
        }
      } catch (err) {
        setError('Network error occurred while fetching stocks');
        console.error('Error fetching stocks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStockList();
  }, []);

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse shadow-sm">
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-3/4 mb-3"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-1/2 mb-2"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-2/3"></div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-16 text-gray-500">

      <h3 className="text-xl font-semibold mb-2 text-gray-700">No stock data available</h3>
    </div>
  );
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/segment/items`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (response.ok && Array.isArray(result.data)) {
          const grouped = {
            Grocery: result.data.filter(item => item.category?.toLowerCase() === 'food'),
            'Veg/Meat/Dairy': result.data.filter(item => item.category?.toLowerCase() === 'dailie'),
            Housekeeping: result.data.filter(item => item.category?.toLowerCase() === 'housekeeping'),
          };
          setAvailableItems(grouped);
        } else {
          console.warn('Unexpected response:', result);
          setAvailableItems({ Grocery: [], 'Veg/Meat/Dairy': [], Housekeeping: [] });
        }
      } catch (err) {
        console.error('Failed to fetch segment items:', err);
        setAvailableItems({ Grocery: [], 'Veg/Meat/Dairy': [], Housekeeping: [] });
      }
    };

    fetchItems();
  }, []);


  const [updateMode, setUpdateMode] = useState(false);
  const [updatedStocks, setUpdatedStocks] = useState({});

  // Toggle update mode and initialize editable stocks
  const handleUpdateClick = () => {
    const initialValues = {};
    const originalValues = {};
    stocks.forEach(item => {
      initialValues[item.id] = item.stock;
      originalValues[item.id] = item.stock; // Store original values
    });
    setUpdatedStocks(initialValues);
    setOriginalStocks(originalValues);
    setUpdateMode(true);
  };
  // Handle input changes
  const handleStockChange = (id, value) => {
    setUpdatedStocks(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Handle save button click - show summary instead of direct save
  const handleSaveClick = () => {
    const edited = {};
    Object.keys(updatedStocks).forEach(id => {
      const originalValue = originalStocks[id];
      const newValue = updatedStocks[id];

      if (parseFloat(newValue) !== parseFloat(originalValue)) {
        edited[id] = parseFloat(newValue);
      }
    });

    if (Object.keys(edited).length === 0) {
      // ✅ removed alert('No changes detected to update.');
      return;
    }

    setEditedItems(edited);
    setShowUpdateSummary(true);
  };


  // Final save function called from modal
  const handleFinalSaveStocks = async () => {
    setSaveLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const requestData = {
        items: editedItems,
        remarks: remarks || 'Stock update'
      };

      const response = await fetch(`${API_BASE_URL}/item/stock/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        setSuccessMessage("Stock updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);

        setTimeout(() => {
          successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);


        setStocks(prevStocks =>
          prevStocks.map(stock => ({
            ...stock,
            stock: editedItems[stock.id] !== undefined ? editedItems[stock.id] : stock.stock
          }))
        );
        setUpdateMode(false);
        setShowUpdateSummary(false);
        setRemarks('');
        setEditedItems({});
      } else {
        // ✅ removed alert
        console.error(result.message || 'Failed to update stock');
      }
    } catch (err) {
      console.error('Error updating stock:', err);
      // ✅ removed alert
    } finally {
      setSaveLoading(false);
    }
  };


  // Excel download function
  const handleDownloadExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = stocks.map((item, index) => ({
        'S.No': index + 1,
        'Item Name': item.name || 'N/A',
        'Quantity': item.stock !== undefined ? Number(item.stock).toFixed(3) : '-',
        'Units': item.unit || '-'
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws['!cols'] = [
        { wch: 8 },  // S.No
        { wch: 30 }, // Item Name
        { wch: 15 }, // Quantity
        { wch: 10 }  // Units
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Stocks');

      // Download file
      XLSX.writeFile(wb, 'stocks.xlsx');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Failed to download Excel file');
    }
  };



  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date()
  });



  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  useEffect(() => {
    const fetchDietRoll = async () => {
      setDietLoading(true);
      setDietError(null);

      try {
        const token = localStorage.getItem("authToken");
        const start = formatDateForAPI(dateRange.start);
        const end = formatDateForAPI(dateRange.end);

        const response = await fetch(
          `${API_BASE_URL}/item/diet-roll?start=${start}&end=${end}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );



        const result = await response.json();

        if (response.ok && !result.error) {
          // const transformedData = (result.data || []).map((item) => {
          //   const openingRow = item.ledger.find((row) => row.date === "Opening Balance");
          //   const todayRow = item.ledger.find((row) => row.date !== "Opening Balance");

          //   return {
          //     id: item.id,
          //     name: item.name,
          //     unit: item.unit,
          //     opening: openingRow ? Number(openingRow.balance) : 0,
          //     received: todayRow && todayRow.received !== "-" ? Number(todayRow.received) : 0,
          //     used: todayRow && todayRow.issued !== "-" ? Number(todayRow.issued) : 0,
          //     closing: todayRow ? Number(todayRow.balance) : 0,
          //     ledger: item.ledger || []  // Preserve the original ledger data
          //   };
          // });

          //   setDietRollData(transformedData);
          //   setSummaryData(result.summary || []);
          setDietRollData(result.data || []);
          setSummaryData(result.summary || []);

        } else {
          setDietError(result.message || "Failed to fetch diet roll");
          setDietRollData([]);
          setSummaryData([]);
        }

      } catch (err) {
        setDietError("Network error fetching diet roll");
        setDietRollData([]);
        setSummaryData([]);
      } finally {
        setDietLoading(false);
      }
    };

    if (showDietRoll) {
      fetchDietRoll();
    }
  }, [dateRange, showDietRoll]); // ✅ Changed from [currentDate, showDietRoll] to [dateRange, showDietRoll]

  const [tempRange, setTempRange] = useState([{
    startDate: dateRange.start,
    endDate: dateRange.end,
    key: "selection"
  }]);
  const [showPicker, setShowPicker] = useState(false);


  const [segments, setSegments] = useState([]);

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${API_BASE_URL}/segment`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.error) setSegments(data.data || []);
      } catch (err) {
        console.error("Error fetching segments:", err);
      }
    };
    fetchSegments();
  }, []);

  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(null);  // ✅ add this

 const handleDownloadConsumptionExcel = async () => {
  try {
    console.log("🚀 Starting Excel download...");

    const token = localStorage.getItem("authToken");
    const start = formatDateForAPI(dateRange.start);
    const end = formatDateForAPI(dateRange.end);

    const response = await fetch(
      `${API_BASE_URL}/item/ledger?start=${start}&end=${end}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();
    if (!response.ok || result.error) {
      console.error("❌ API Error:", result);
      alert("Failed to fetch ledger for Excel export");
      return;
    }

    const ledgerData = Array.isArray(result.data) ? result.data : [];
    if (!ledgerData.length) {
      alert("No stock data available for export");
      return;
    }

    // --- Build rows ---
    const titleRow = ["Stock Consumption"];
    const dateRangeRow = [
      `Date Range: ${dateRange.start.toLocaleDateString("en-GB")} - ${dateRange.end.toLocaleDateString("en-GB")}`
    ];
    const emptyRow = [""];
    const headerRow1 = ["Date"];
    const headerRow2 = [""];

    ledgerData.forEach((item) => {
      headerRow1.push(item.name, "", "", ""); // 4 cols: Received, Issued, Balance, Empty
      headerRow2.push(
        `Received (${item.unit})`,
        `Issued (${item.unit})`,
        `Balance (${item.unit})`,
        "" // free empty col
      );
    });

    const rows = [titleRow, dateRangeRow, emptyRow, headerRow1, headerRow2];

    // Opening stock row
    const openingRow = ["Opening Stock"];
    ledgerData.forEach((item) => {
      const openingEntry = Array.isArray(item.ledger)
        ? item.ledger.find((entry) => entry.date === "Opening Balance")
        : null;
      openingRow.push("-", "-");
      openingRow.push(Number(openingEntry?.balance ?? 0));
      openingRow.push(""); // free col
    });
    rows.push(openingRow);

    // Dates
    const allDates = new Set();
    ledgerData.forEach((item) => {
      if (!Array.isArray(item.ledger)) return;
      item.ledger.forEach((row) => {
        if (row.date && row.date !== "Opening Balance") allDates.add(row.date);
      });
    });

    const sortedDates = [...allDates].sort((a, b) => new Date(a) - new Date(b));

    sortedDates.forEach((dateStr) => {
      const row = [new Date(dateStr).toLocaleDateString("en-GB")];
      ledgerData.forEach((item) => {
        const entry = Array.isArray(item.ledger)
          ? item.ledger.find((l) => l.date === dateStr)
          : null;
        row.push(Number(entry?.received ?? 0));
        row.push(Number(entry?.issued ?? 0));
        row.push(Number(entry?.balance ?? 0));
        row.push(""); // free col
      });
      rows.push(row);
    });

    // Totals row
    const totalRow = ["Total"];
    ledgerData.forEach((item) => {
      let totalReceived = 0, totalIssued = 0, totalBalance = 0;
      if (Array.isArray(item.ledger)) {
        item.ledger.forEach((l) => {
          if (l.date && l.date !== "Opening Balance") {
            totalReceived += Number(l.received ?? 0);
            totalIssued += Number(l.issued ?? 0);
            totalBalance += Number(l.balance ?? 0);
          }
        });
      }
      totalRow.push(totalReceived, totalIssued, totalBalance);
      totalRow.push(""); // free col
    });
    rows.push(totalRow);

    // --- ExcelJS workbook ---
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Stock Consumption");

    rows.forEach(r => sheet.addRow(r));

    // Style Date column
    sheet.getColumn(1).eachCell((cell, rowNumber) => {
      if (rowNumber >= 4) {
        cell.font = { bold: true };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });

    // ✅ Freeze first column
    sheet.views = [{ state: "frozen", xSplit: 1, ySplit: 0, topLeftCell: "B1" }];

    // Style title
    sheet.getCell("A1").font = { bold: true, color: { argb: "FFFF0000" } };
    sheet.getCell("A1").alignment = { horizontal: "center" };

    // Style headers
    [4, 5].forEach(rowNum => {
      const row = sheet.getRow(rowNum);
      row.eachCell(cell => {
        cell.font = { bold: true, color: { argb: "FF000000" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
    });

    // Merge headers for each item
    ledgerData.forEach((_, idx) => {
      const startCol = 2 + idx * 4;
      const endCol = startCol + 3;
      sheet.mergeCells(4, startCol, 4, endCol);
    });

    // Column widths
    const colWidths = [{ width: 15 }]; // Date col
    ledgerData.forEach(() => {
      colWidths.push({ width: 12 }, { width: 12 }, { width: 15 }, { width: 20 }); // extra empty col
    });
    sheet.columns = colWidths;

    const startStr = dateRange.start.toLocaleDateString("en-GB").replace(/\//g, "-");
    const endStr = dateRange.end.toLocaleDateString("en-GB").replace(/\//g, "-");
    const filename = `stock_ledger_${startStr}_to_${endStr}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);

    console.log("✅ Excel file download completed successfully!");
  } catch (error) {
    console.error("❌ Error downloading Excel:", error);
    alert("Failed to download Excel file");
  }
};




  const handleDownloadDietRollExcel = () => {
    if (!dietRollData || dietRollData.length === 0) {
      alert("No diet roll data available to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dietRollData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DietRoll");
    XLSX.writeFile(workbook, "StockDietRoll.xlsx");
  };

// 🔹 Calculate summary counts and totals for Add Summary
const calculateSummary = () => {
  let newCount = 0, newSum = 0;
  let issuedCount = 0, issuedSum = 0;
  let receivedCount = 0, receivedSum = 0;

  Object.values(preparedItems).forEach(item => {
    if (item.type === "opening") {
      newCount++;
      newSum += item.value || 0;
    } else if (item.type === "issued") {
      issuedCount++;
      issuedSum += item.value || 0;
    } else if (item.type === "received") {
      receivedCount++;
      receivedSum += item.value || 0;
    }
  });

  return { newCount, newSum, issuedCount, issuedSum, receivedCount, receivedSum };
};
const [itemLedger, setItemLedger] = useState([]);
const [ledgerLoading, setLedgerLoading] = useState(false);

const fetchItemLedger = async (item) => {
  try {
    setShowItemSummary(true);
    setSelectedItem(item);
    setLedgerLoading(true);

    const token = localStorage.getItem("authToken");
    const start = formatDateForAPI(dateRange.start);
    const end = formatDateForAPI(dateRange.end);

    const response = await fetch(
      `${API_BASE_URL}/item/ledger/${item.id}?start=${start}&end=${end}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();

    if (response.ok && !result.error && Array.isArray(result.data)) {
      setItemLedger(result.data);
    } else {
      setItemLedger([]);
      console.error("Failed to fetch item ledger:", result.message);
    }
  } catch (err) {
    console.error("Error fetching item ledger:", err);
    setItemLedger([]);
  } finally {
    setLedgerLoading(false);
  }
};

// 🔹 Download Excel for Item Ledger
const handleDownloadItemLedgerExcel = () => {
  if (!itemLedger || itemLedger.length === 0) {
    alert("No data available to export");
    return;
  }

  const excelData = itemLedger.map((row, idx) => ({
    // "S.No": idx + 1,
    "Date": row.date,
    "Description": row.description || "-",
    "Received": row.cr || 0,
    "Issued": row.dr || 0,
    "Balance": row.balance || 0,
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Item Ledger");

  const fileName = `${selectedItem?.name?.replace(/\s+/g, "_") || "Item"}_Ledger.xlsx`;
  XLSX.writeFile(wb, fileName);
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {successMessage && (
          <div
            ref={successRef}
            className="mb-4 p-3 rounded-lg bg-green-100 border border-green-300 text-green-800 font-medium shadow"
          >
            {successMessage}
          </div>
        )}
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {/* Left: Icon + Heading */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-800">Stock</h1>
            </div>

            {/* Right: Diet Roll Button and Summary */}
            <div className="flex items-center gap-6">
           {/* Hide Stock Consumption button when Add Stock Form OR Diet Roll is active */}
{!showAddStockForm && !showDietRoll && (
  <button
    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium"
    onClick={() => setShowDietRoll(true)}
  >
    Stock Consumption
  </button>
)}
            </div>
          </div>
        </div>
        <div className="p-1">
          {showDietRoll ? (
            <div className="p-4 sm:p-6 bg-white rounded-xl shadow-md">
              {/* 🔥 Top Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
                {/* Left Side: Heading + Date */}
                <div className="flex items-center gap-6">
                  {/* Heading */}
                  <h4 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Diet Roll
                  </h4>

                  {/* Date navigation */}
                  {/* Date Range Field */}
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowPicker(!showPicker)}
                        className="border px-3 py-2 rounded bg-white shadow-sm text-gray-700"
                      >
                        {dateRange.start.toLocaleDateString("en-GB")} - {dateRange.end.toLocaleDateString("en-GB")}
                      </button>

                      <div className="flex items-center gap-3">
                        {/* Export Stock Consumption */}
                        <div className="relative group">
                          <button
                            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg shadow hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-medium flex items-center gap-2"
                            onClick={handleDownloadConsumptionExcel}
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs font-medium px-3 py-1 rounded-lg shadow">
                            Export Stock Consumption
                          </span>
                        </div>

                        {/* Export Stock Diet Roll */}
                        <div className="relative group">
                          <button
                            className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg shadow hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center gap-2"
                            onClick={handleDownloadDietRollExcel}
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block 
  bg-gray-800 text-white text-xs font-medium px-3 py-1 rounded-lg shadow whitespace-nowrap">
                            Export Stock Diet Roll
                          </span>

                        </div>
                      </div>


                    </div>
                    {showPicker && (
                      <div className="absolute mt-2 bg-white shadow-lg rounded-lg z-50 p-3">
                        <DateRangePicker
                          onChange={(ranges) => setTempRange([ranges.selection])}
                          showSelectionPreview={true}
                          moveRangeOnFirstSelection={false}
                          months={1}             // 🔥 only one month
                          ranges={tempRange}
                          direction="vertical"   // fits nicely
                          locale={enGB}   // ✅ add this line
                        />

                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setShowPicker(false)}
                            className="px-4 py-1 bg-gray-200 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              setDateRange({
                                start: tempRange[0].startDate,
                                end: tempRange[0].endDate
                              });
                              setShowPicker(false);
                            }}
                            className="px-4 py-1 bg-blue-600 text-white rounded"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Back to Stocks */}
                <button
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 font-medium rounded-lg shadow hover:from-gray-200 hover:to-gray-300 transition mt-4 sm:mt-0"
                  onClick={() => setShowDietRoll(false)}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Stocks
                </button>
              </div>


             {/* Two Summary Tables Side by Side */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

  {/* Left Summary: Indent Summary */}
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
    <div className="bg-gradient-to-r from-blue-100 to-blue-200 px-4 py-3 rounded-t-lg">
      <h3 className="text-lg font-semibold text-gray-800">Indent Summary</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
          <tr>
            <th className="px-3 py-2 text-xs font-semibold text-gray-700 text-center">S.No</th>
            <th className="px-3 py-2 text-xs font-semibold text-gray-700 text-center">Type</th>
            <th className="px-3 py-2 text-xs font-semibold text-gray-700 text-center">Date</th>
            <th className="px-3 py-2 text-xs font-semibold text-gray-700 text-center">Order ID</th>
          </tr>
        </thead>
      </table>

      {/* Scrollable body (max 4 rows visible) */}
      <div className="max-h-60 overflow-y-auto">
        <table className="min-w-full">
          <tbody className="divide-y divide-gray-100">
            {dietLoading ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500 text-sm">
                  Loading indent summary...
                </td>
              </tr>
            ) : dietError ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-red-500 font-medium text-sm">
                  {dietError}
                </td>
              </tr>
            ) : summaryData.filter(item => item.type === 'Indent').length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500 text-sm">
                  No indent data available
                </td>
              </tr>
            ) : (
              summaryData
                .filter(item => item.type === 'Indent')
                .map((item, index) => (
                  <tr
                    key={`${item.type}-${item.id}-${index}`}
                    className={`${index % 2 === 0 ? "bg-gray-50/30" : "bg-white"} hover:bg-gray-50 transition`}
                  >
                    <td className="px-3 py-2 text-center text-gray-700 text-sm">{index + 1}</td>
                    <td className="px-3 py-2 text-center text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-sm text-gray-700">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString("en-GB") : "-"}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-900 font-semibold text-sm">
                      {item.id}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  {/* Right Summary: Attendance Summary */}
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
    <div className="bg-gradient-to-r from-green-100 to-green-200 px-4 py-3 rounded-t-lg">
      <h3 className="text-lg font-semibold text-gray-800">Diet Roll Summary</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
          <tr>
            <th className="px-3 py-2 text-xs font-semibold text-gray-700 text-left">S.No</th>
            <th className="px-3 py-2 text-xs font-semibold text-gray-700 text-left">Session</th>
            <th className="px-3 py-2 text-xs font-semibold text-gray-700 text-center">Total</th>
          </tr>
        </thead>
      </table>

      {/* Scrollable body (max 4 rows visible) */}
      <div className="max-h-60 overflow-y-auto">
        <table className="min-w-full">
          <tbody className="divide-y divide-gray-100">
            {dietLoading ? (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500 text-sm">
                  Loading attendance summary...
                </td>
              </tr>
            ) : dietError ? (
              <tr>
                <td colSpan="3" className="text-center py-4 text-red-500 font-medium text-sm">
                  {dietError}
                </td>
              </tr>
            ) : summaryData.filter(item => item.type === 'Attendance').length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500 text-sm">
                  No attendance data available
                </td>
              </tr>
            ) : (
              summaryData
                .filter(item => item.type === 'Attendance')
                .map((item, index) => {
                  const totalAttendance = item.attendance
                    ? Object.values(item.attendance).reduce((sum, count) => sum + count, 0)
                    : 0;

                  return (
                    <tr
                      key={`${item.id}-${index}`}
                      className={`${index % 2 === 0 ? "bg-gray-50/30" : "bg-white"} hover:bg-gray-50 transition`}
                    >
                      <td className="px-3 py-2 text-center text-gray-700 text-sm">{index + 1}</td>
<td className="px-3 py-2 text-sm text-gray-700 flex justify-center">
  <div className="text-left">
    {item.session ? item.session : "-"}
  </div>
</td>
                      <td
                        className="px-3 py-2 text-center text-gray-900 font-semibold text-sm cursor-pointer text-blue-600 underline"
                        onClick={() => {
                          setSelectedAttendance(item.attendance);
                          setSelectedAttendanceDate(item.date);
                        }}
                      >
                        {totalAttendance}
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>


              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="min-w-full bg-white">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                    <tr>
                      {["S.No", "Items", "Opening Stock", "Addition", "Consumption", "Closing Stock","Action"].map((header) => (
                        <th
                          key={header}
                          className="px-4 py-3 text-sm font-semibold text-gray-700 text-center"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dietLoading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-6 text-gray-500">
                          Loading diet roll...
                        </td>
                      </tr>
                    ) : dietError ? (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-red-500 font-medium">
                          {dietError}
                        </td>
                      </tr>
                    ) : dietRollData.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-6 text-gray-500">
                          No diet roll data available
                        </td>
                      </tr>
                    ) : (
                      dietRollData.map((item, index) => (
                        <tr
                          key={item.id || index}
                          className={`${index % 2 === 0 ? "bg-gray-50/30" : "bg-white"} hover:bg-gray-50 transition`}
                        >
                          <td className="px-4 py-3 text-center text-gray-700">{index + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {item.name}
                            {item.unit && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                                {item.unit}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">{item.opening.toFixed(3)}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{item.received.toFixed(3)}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{item.used.toFixed(3)}</td>
                <td className="px-4 py-3 text-right text-gray-900 font-semibold">{item.closing.toFixed(3)}</td>
<td className="px-4 py-3 text-center">
<button
  onClick={() => fetchItemLedger(item)}
  className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors duration-200"
  title="View Item Summary"
>
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
    </svg>
  </button>
</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (


            // 🔥 Existing All Items Block (your current code stays here)
            <>
              {/* Main Content Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
  {showAddStockForm ? "Update Stocks" : "All Items"}
</h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-4">
                        {/* Show Excel & Add Stocks only when not updating and not adding */}
                        {!updateMode && !showAddStockForm && (
                          <>
                            <button
                              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg shadow hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-medium flex items-center gap-2"
                              onClick={handleDownloadExcel}
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                            </button>


                            <button
                              className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium"
                              onClick={() => setShowAddStockForm(true)}
                            >
                              Update Stocks
                            </button>
                          </>
                        )}

                        {/* Show Cancel only in Add Stock mode */}
                        {showAddStockForm && (
                          <button
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg shadow hover:bg-gray-400 transition font-medium"
                            onClick={() => setShowAddStockForm(false)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                  </div>

                </div>

                <div className="p-6">
                  {showAddStockForm ? (
                    <div className="bg-white p-6 rounded-lg shadow">

                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-200 rounded-lg shadow-sm">
               <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
  <tr>
    <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-12 text-center">S.No</th>
    <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-40 text-left">Category</th>
    <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-60 text-left">Item</th>
    <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-24 text-left">Stock</th>
    <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-32 text-left">Correction Request</th>
    <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-64 text-left">Description</th>
    <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-16 text-center">Action</th>
  </tr>
</thead>
                          <tbody className="divide-y divide-gray-100">
                            {stocksToAdd.map((row, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition">
                                {/* S.No */}
                                <td className="px-4 py-2 text-center">{index + 1}</td>

                                {/* Category */}
                                <td className="px-4 py-2">
                                  <select
                                    value={row.category}
                                    onChange={(e) => handleRowChange(index, "category", e.target.value)}
                                    className="border rounded-lg px-2 py-1 w-40 focus:ring-2 focus:ring-blue-400"
                                  >
                                    <option value="">Select</option>
                                    {categories.map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </td>

                                {/* Item */}
                             {/* Item with unit label */}
<td className="px-4 py-2 flex items-center gap-2">
  <select
    value={row.itemId}
    onChange={(e) => handleRowChange(index, "itemId", e.target.value)}
    className="border rounded-lg px-2 py-1 w-60 focus:ring-2 focus:ring-blue-400"
  >
    <option value="">Select</option>
    {(availableItems[row.category] || []).map(item => (
      <option key={item.id} value={item.id}>{item.name}</option>
    ))}
  </select>
  {row.unit && (
    <span className="text-sm text-gray-500">{row.unit}</span>
  )}
</td>

{/* Quantity (label, show N/A if not present) */}
<td className="px-4 py-2 text-center">
  <span className="text-sm font-medium text-gray-700">
    {row.quantity !== "" && row.quantity !== undefined
      ? row.quantity
      : "N/A"}
  </span>
</td>

{/* Stock Adjustment */}
<td className="px-4 py-2">
  {row.quantity !== "" && row.quantity !== undefined ? (
    // Stock exists (even if 0) → allow Issued/Received
    <div className="flex items-center gap-2">
      <select
        value={row.adjustType}
        onChange={(e) => handleRowChange(index, "adjustType", e.target.value)}
        className="border rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-400 w-28"
      >
        <option value="">Select</option>
        <option value="issued">Issued</option>
        <option value="received">Received</option>
      </select>

      {row.adjustType && (
        <input
          type="number"
          value={row.adjustValue}
          onChange={(e) => handleRowChange(index, "adjustValue", e.target.value)}
          placeholder="Enter value"
          className="border rounded-lg px-2 py-1 w-20 text-right focus:ring-2 focus:ring-blue-400"
        />
      )}
    </div>
  ) : (
    // No stock record → only Opening Balance allowed
    <div className="flex items-center gap-2">
      <select
        value={row.adjustType || "opening"}
        onChange={(e) => handleRowChange(index, "adjustType", e.target.value)}
        className="border rounded-lg px-2 py-1 bg-gray-100 text-gray-800 w-28"
      >
        <option value="opening">Opening Balance</option>
      </select>
      <input
        type="number"
        value={row.adjustValue}
        onChange={(e) => handleRowChange(index, "adjustValue", e.target.value)}
        placeholder="Enter"
        className="border rounded-lg px-2 py-1 w-20 text-right focus:ring-2 focus:ring-blue-400"
      />
    </div>
  )}
</td>
{/* Remarks field - add this BEFORE the Action column */}
<td className="px-4 py-2">
  <input
    type="text"
    value={row.remarks}
    onChange={(e) => handleRowChange(index, "remarks", e.target.value)}
    placeholder="Remarks"
    className="border rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-blue-400"
  />
</td>

                                {/* Action */}
                                <td className="px-4 py-2 text-center">
                                  <button
                                    onClick={addNewRow}
                                    title="Add Row"
                                    className="px-3 py-1.5 bg-green-500 text-white text-sm font-medium 
               rounded-md shadow hover:bg-green-600 active:bg-green-700 
               transition duration-200"
                                  >
                                    +
                                  </button>
                                </td>

                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Submit All Button */}
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={handleAddAllStocks}
                          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow hover:from-blue-700 hover:to-blue-800 transition duration-200"
                        >
                          Submit
                        </button>
                      </div>

                    </div>
                  ) : loading ? (

                    <LoadingSkeleton />
                  ) : stocks.length === 0 ? (
                    <EmptyState />
                  ) : (
                    // Existing Table
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              S.No
                            </th>
                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Item Name
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                              Quantity
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Units
                            </th>
                            {/* {updateMode && (
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Enter Stock
                              </th>
                            )} */}
                          </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-100">
                          {stocks.map((item, index) => (
                            <tr
                              key={item.id || index}
                              className="hover:bg-gray-50 transition-colors duration-150"
                            >
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                <span className="bg-gray-100 px-2 py-1 rounded-full font-medium">
                                  {index + 1}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">
                                  {item.name || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                {item.stock !== undefined ? (
                                  <span className="text-gray-800 text-sm font-medium text-right">
                                    {Number(item.stock).toFixed(3)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                <span className="text-gray-800 text-sm font-medium">
                                  {item.unit || '-'}
                                </span>
                              </td>
                              {/* {updateMode && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  <input
                                    type="number"
                                    step="any"
                                    id={`enter-stock-${item.id}`}
                                    value={
                                      updatedStocks[item.id] !== undefined
                                        ? updatedStocks[item.id] // keep exactly what user typed
                                        : (item.stock !== undefined ? parseFloat(item.stock).toFixed(3) : "")
                                    }
                                    onChange={(e) => handleStockChange(item.id, e.target.value)}
                                    className="px-2 py-1 w-24 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-right"
                                  />

                                </td>
                              )} */}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </div>
               {/* Update Summary Modal */}
        {showUpdateSummary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">

              {/* Modal Header - Blue gradient background */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5 text-white relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold">Stock Update Summary</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowUpdateSummary(false);
                      setRemarks('');
                      setEditedItems({});
                    }}
                    className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center hover:bg-opacity-30 transition-all"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">


                {/* Update Date and Type */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Update Date</p>
                      <p className="font-semibold text-gray-900">{new Date().toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>

                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-orange-700 font-medium">Total Items</p>
                        <p className="text-2xl font-bold text-orange-800">{Object.keys(editedItems).length}</p>
                      </div>
                    </div>
                  </div>

                </div>


                {/* Remarks Section */}
                <div className="mb-6">
                  <label htmlFor="update-remarks" className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                    </svg>
                    Remarks (Optional):
                  </label>
                  <textarea
                    id="update-remarks"
                    value={remarks}
                    onChange={(e) => handleRemarksChange(e.target.value)}
                    placeholder="Add any notes about this stock update..."
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowUpdateSummary(false);
                      setRemarks('');
                      setEditedItems({});
                    }}
                    disabled={saveLoading}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl shadow-sm hover:bg-gray-200 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinalSaveStocks}
                    disabled={saveLoading}
                    className="px-8 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saveLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Confirm
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
     {showAddSummary && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white flex justify-between items-center">
        <h3 className="text-xl font-bold">Stock Add Summary</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-90">
            {new Date().toLocaleDateString("en-GB")}
          </span>
          <button
            onClick={() => setShowAddSummary(false)}
            className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center hover:bg-opacity-30"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">

        {/* Summary Cards - vertical full width */}
        <div className="flex flex-col gap-4 w-full">

          {/* New Items */}
       {/* Example: New Items */}
<div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200 w-full">
  <p className="text-sm text-yellow-700 font-medium">New Items</p>
  <div className="mt-2 flex justify-between text-sm text-gray-700">
    <span>Items: {calculateSummary().newCount}</span>
    <span>Total Weight: {calculateSummary().newSum.toFixed(2)}</span>
  </div>
</div>

         {/* Issued Items */}
<div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200 w-full">
  <p className="text-sm text-red-700 font-medium">Issued Items</p>
  <div className="mt-2 flex justify-between text-sm text-gray-700">
    <span>Items: {calculateSummary().issuedCount}</span>
    <span>Total Weight: {calculateSummary().issuedSum.toFixed(2)}</span>
  </div>
</div>

{/* Received Items */}
<div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 w-full">
  <p className="text-sm text-green-700 font-medium">Received Items</p>
  <div className="mt-2 flex justify-between text-sm text-gray-700">
    <span>Items: {calculateSummary().receivedCount}</span>
    <span>Total Weight: {calculateSummary().receivedSum.toFixed(2)}</span>
  </div>
</div>
        </div>

        {/* Remarks Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Remarks (Optional):</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add notes about this stock addition..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => setShowAddSummary(false)}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={confirmAddStocks}
            disabled={saveLoading}
            className="px-8 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 disabled:opacity-50"
          >
            {saveLoading ? "Adding..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
        {selectedAttendance && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">

              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">Diet Roll Details</h3>
                  <p className="text-sm text-white/90">
                    {new Date(selectedAttendanceDate).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAttendance(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                {Object.entries(selectedAttendance).map(([id, count]) => {
                  const seg = segments.find(s => s.id === Number(id));
                  return (
                    <div
                      key={id}
                      className="flex justify-between items-center px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-sm hover:shadow-md transition"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {seg ? seg.category : `Segment ${id}`}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t flex justify-end bg-gray-50">
                <button
                  onClick={() => setSelectedAttendance(null)}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-medium shadow hover:from-green-600 hover:to-green-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Item Summary Modal */}
 {showItemSummary && selectedItem && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
    <div className="bg-white rounded-3xl shadow-xl max-w-5xl w-full overflow-hidden">
      
   {/* Header with Excel Download */}
<div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 flex justify-between items-center">
  <div>
    <h3 className="text-2xl font-semibold text-white">Item-wise Summary</h3>
    <p className="text-sm text-white/90 mt-1">{selectedItem.name}</p>
  </div>
  {/* Right side: Excel + Close */}
  <div className="flex items-center gap-3">
    {/* Excel Download Button */}
    <button
      onClick={handleDownloadItemLedgerExcel}
      className="p-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg transition"
      title="Download Excel"
    >
      <FileSpreadsheet className="w-5 h-5" />
    </button>

    {/* Close Button */}
    {/* <button
      onClick={() => {
        setShowItemSummary(false);
        setSelectedItem(null);
      }}
      className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-lg font-bold transition"
    >
      ✕
    </button> */}
  </div>
</div>


      {/* Body */}
      <div className="p-6 max-h-[70vh] overflow-y-auto">
        {ledgerLoading ? (
          <div className="text-center py-10 text-gray-500 text-lg font-medium">
            Loading...
          </div>
        ) : itemLedger && itemLedger.length > 0 ? (
          <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700 border-b border-gray-200 pb-2 mb-3">
            <span>S.No</span>
            <span>Date</span>
            <span>Description</span>
            <span>Received</span>
            <span>Issued</span>
            <span>Balance</span>
          </div>
        ) : null}

        {itemLedger && itemLedger.length > 0 ? (
          itemLedger.map((row, idx) => (
            <div
              key={row.sno}
              className={`grid grid-cols-6 gap-4 items-center text-sm py-3 px-4 rounded-lg ${
                idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
              } shadow-sm`}
            >
              <span>{row.sno}</span>
              <span>{row.date}</span>
              <span className="truncate">{row.description}</span>
              <span className="text-green-600 font-medium">{row.cr || '-'}</span>
              <span className="text-red-600 font-medium">{row.dr || '-'}</span>
              <span className="font-medium">{row.balance}</span>
            </div>
          ))
        ) : !ledgerLoading ? (
          <div className="text-center py-10 text-gray-500 text-lg font-medium">
            No data available
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="px-8 py-5 border-t flex justify-end bg-gray-50">
        <button
          onClick={() => {
            setShowItemSummary(false);
            setSelectedItem(null);
          }}
          className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition"
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

export default Stock;
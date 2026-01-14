import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import '../fonts/NotoSansTamil-VariableFont_wdth,wght-normal.js';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


const SimplifiedDashboardNew = () => {
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [storeData, setStoreData] = useState(null);
  const [orderReport, setOrderReport] = useState([]);
  const [recentIndents, setRecentIndents] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeDetails, setStoreDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          'https://rcs-dms.onlinetn.com/api/v1//indent/report/orders',
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
          console.log('✅ Orders report fetched:', result.data);
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
  const receivedOrders = orderReport.filter(item => item.status?.toLowerCase() === 'received').length;
  const dispatchedOrders = orderReport.filter(item => item.status?.toLowerCase() === 'dispatched').length;

  const summaryCards = [
    {
      title: 'Total Orders',
      value: totalOrders,
      icon: <ShoppingCart className="w-7 h-7 text-blue-600" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',

    },
    {
      title: 'Received Orders',
      value: receivedOrders,
      icon: <CalendarDays className="w-7 h-7 text-emerald-600" />,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',

    },
    {
      title: 'Dispatched and InTransit',
      value: dispatchedOrders,
      icon: <TrendingUp className="w-7 h-7 text-amber-600" />,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',

    },
    {
      title: 'Items',
      value: storeData?.stockItems || 0,
      icon: <Users className="w-7 h-7 text-purple-600" />,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',


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
              <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                {userRole === 'rcs-store' ? 'Store Manager' : 'Administrator'}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card, idx) => (
            <div
              key={idx}
              className={`group relative border border-white/20 rounded-3xl p-4 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 ${card.bgColor || 'bg-white/80'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-2xl ${card.iconBg || 'bg-white'} group-hover:scale-110 transition-transform duration-300`}>
                  {card.icon}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className={card.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {card.change}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-xs font-medium">{card.title}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </p>
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
                      {recentIndents.map((indent, idx) => (
                        <tr key={indent.id} className="group hover:bg-slate-50 transition-colors duration-200">
                          <td className="px-6 py-4 font-medium text-slate-600">#{idx + 1}</td>
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
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                            {store.name}
                          </span>

                        </div>

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
    </div>
  );
};

export default SimplifiedDashboardNew;
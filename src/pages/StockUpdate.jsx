import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const StockNewNotifications = () => {
  const [stockItems, setStockItems] = useState([]);
  const [itemMap, setItemMap] = useState({}); // 🔑 id → name map
  const [loading, setLoading] = useState(false);
  const [stockMap, setStockMap] = useState({}); // 🔑 id → stock value map
  const [processingNotifications, setProcessingNotifications] = useState(new Set());
   const location = useLocation();
  const selectedNotification = location.state?.selectedNotification;
  const showOnlyThis = location.state?.showOnlyThis;
  const navigate = useNavigate();
  // Fetch items (id → name)
  const fetchItemMap = async (token) => {
    try {
      const response = await fetch(
        "https://rcs-dms.onlinetn.com/api/v1//segment/items",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!data.error && data.data) {
        const map = {};
      data.data.forEach((item) => {
  map[item.id] = {
    name: item.name,
    unit: item.indent || "", // store unit also
  };
});

        setItemMap(map);
      }
    } catch (err) {
      console.error("Error fetching item names:", err);
    }
  };

  // Fetch stock-new notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const token =
        typeof window !== "undefined" && window.localStorage
          ? window.localStorage.getItem("authToken")
          : "demo-token";

      if (!token || token === "demo-token") {
        console.warn("⚠️ No authToken found.");
        setStockItems([]);
        return;
      }

      // If we have a specific notification to show, use it directly
      if (selectedNotification && showOnlyThis) {
        setStockItems([selectedNotification]);
        // Still fetch item names and stock map
        fetchItemMap(token);
        fetchStockMap(token);
        return;
      }

      // Otherwise fetch all notifications
      const response = await fetch(
        "https://rcs-dms.onlinetn.com/api/v1//notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!data.error && data.data) {
        const stockNewOnly = data.data.filter(
          (n) => n.type?.toLowerCase() === "stock-new".toLowerCase()
        );
        setStockItems(stockNewOnly);

        // Also fetch item names once
        fetchItemMap(token);
        fetchStockMap(token);
      } else {
        setStockItems([]);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setStockItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [selectedNotification, showOnlyThis]);

  const fetchStockMap = async (token) => {
    try {
      const response = await fetch(
        "https://rcs-dms.onlinetn.com/api/v1//item/list/stock",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!data.error && data.data) {
        const map = {};
        data.data.forEach((item) => {
          map[item.id] = item.stock; // 👈 map id → stock
        });
        setStockMap(map);
      }
    } catch (err) {
      console.error("Error fetching stock values:", err);
    }
  };

  const handleApprove = async (notificationId, notification) => {
    try {
      setProcessingNotifications(prev => new Set(prev).add(notificationId));
      
      const token = typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem("authToken")
        : "demo-token";

      if (!token || token === "demo-token") {
        console.warn("⚠️ No authToken found.");
        alert("Authentication token not found. Please log in again.");
        return;
      }

      console.log("Approving notification:", notificationId);
      
      const response = await fetch(
        `https://rcs-dms.onlinetn.com/api/v1//item/stock/update/${notificationId}/approve`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: notification.items,
            remarks: notification.message || "Stock update approved"
          })
        }
      );

      const result = await response.json();
      
 if (!result.error && response.ok) {
        navigate('/stocks');
      } else {
        alert(`Error approving notification: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error approving notification:", err);
      alert("Failed to approve notification. Please try again.");
    } finally {
      setProcessingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleDecline = async (notificationId) => {
    try {
      setProcessingNotifications(prev => new Set(prev).add(notificationId));
      
      const token = typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem("authToken")
        : "demo-token";

      if (!token || token === "demo-token") {
        console.warn("⚠️ No authToken found.");
        alert("Authentication token not found. Please log in again.");
        return;
      }

      console.log("Declining notification:", notificationId);
      
      const response = await fetch(
        `https://rcs-dms.onlinetn.com/api/v1//item/stock/update/${notificationId}/reject`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );

      const result = await response.json();
      
  if (!result.error && response.ok) {
        navigate('/stocks');
      } else {
        alert(`Error rejecting notification: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error declining notification:", err);
      alert("Failed to reject notification. Please try again.");
    } finally {
      setProcessingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          {showOnlyThis ? "Stock Update Details" : "Stock New Notifications"}
        </h2>

      </div>
      
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : stockItems.length > 0 ? (
        <div className="flex flex-col gap-6">
          {stockItems.map((notif) => {
            const isProcessing = processingNotifications.has(notif.id);
            
            return (
              <div
                key={notif.id}
                className="p-4 bg-white border rounded-lg shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">
                    {showOnlyThis ? "Stock Update Request" : `Notification #${notif.id}`} - {notif.title || "Stock Update"}
                  </h3>
            <div className="text-xs font-normal mt-1">
    <span className="text-red-600">Issued</span> /{" "}
    <span className="text-green-600">Received</span> /{" "}
    <span className="text-blue-600">Opening Balance</span>
  </div>
                </div>


          <table className="w-full border-collapse">
  <thead>
    <tr className="bg-gray-100 text-left">
      <th className="border px-3 py-2">S.No</th>
      <th className="border px-3 py-2">Name</th>
      <th className="border px-3 py-2">Current Stock</th>
      <th className="border px-3 py-2 text-center">Updated</th>
      <th className="border px-3 py-2 text-center">New Stock</th>
    </tr>
  </thead>
  <tbody>
    {notif.items &&
      Object.entries(notif.items).map(([id, value], idx) => (
        <tr key={id} className="hover:bg-gray-50">
          <td className="border px-3 py-2">{idx + 1}</td>
       <td className="border px-3 py-2 font-medium">
  {itemMap[id]?.name || "—"}{" "}
  {value?.description ? (
    <span className="text-gray-500 text-sm">({value.description})</span>
  ) : null}
  {itemMap[id]?.unit && (
 <span className="ml-2 bg-blue-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
  {itemMap[id].unit}
</span>

  )}
</td>

       <td className="border px-3 py-2 text-center">
  {stockMap[id] !== undefined && stockMap[id] !== null
    ? Number(stockMap[id]).toFixed(3)
    : "—"}
</td>

          <td
            className={`border px-3 py-2 text-center font-semibold ${
              value?.type === "issued"
                ? "text-red-600"
                : value?.type === "received"
                ? "text-green-600"
                : value?.type === "opening"
                ? "text-blue-600"
                : "text-gray-600"
            }`}
          >
            {value?.value ?? "—"}
          </td>

     <td className="border px-3 py-2 text-center font-semibold">
  {(() => {
    const current = stockMap[id] ?? 0;
    const val = value?.value ?? 0;
    let newStock = "—";
    if (value?.type === "issued") newStock = current - val;
    else if (value?.type === "received") newStock = current + val;
    else if (value?.type === "opening") newStock = val;
    return isNaN(newStock) ? "—" : Number(newStock).toFixed(3);
  })()}
</td>

        </tr>
      ))}
  </tbody>
</table>


           <div className="flex items-center justify-between mt-4">
  {/* ✅ Note / Remarks on left */}
  <p className="text-sm text-gray-600">
    <span className="font-semibold">Remarks:</span>{" "}
    {notif.remarks || "—"}
  </p>

  {/* ✅ Action buttons on right */}
  <div className="flex gap-3">
    <button
      onClick={() => handleDecline(notif.id)}
      disabled={isProcessing}
      className={`px-4 py-2 text-white rounded transition-colors ${
        isProcessing
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-red-500 hover:bg-red-600"
      }`}
    >
      {isProcessing ? "Processing..." : "Decline"}
    </button>
    <button
      onClick={() => handleApprove(notif.id, notif)}
      disabled={isProcessing}
      className={`px-4 py-2 text-white rounded transition-colors ${
        isProcessing
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-green-500 hover:bg-green-600"
      }`}
    >
      {isProcessing ? "Processing..." : "Approve"}
    </button>
  </div>
</div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">
            {showOnlyThis ? "No notification data available" : "No stock new notifications"}
          </p>
          {showOnlyThis && (
            <button 
              onClick={() => window.history.back()} 
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Go back
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StockNewNotifications;
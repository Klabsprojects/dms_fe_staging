import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';
import { ListChecks, Info } from "lucide-react";

const DispatchOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dispatchData, setDispatchData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [eWayBill, setEWayBill] = useState(false);
  const [packPopupItem, setPackPopupItem] = useState(null);
  const [selectedPacks, setSelectedPacks] = useState([]);
  const [showAllPacks, setShowAllPacks] = useState(false);
  const [remarksPopupItem, setRemarksPopupItem] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);

      try {
        const token = localStorage.getItem('authToken');

        // 1️⃣ FETCH ORDER ITEMS
        const response = await fetch(`${API_BASE_URL}/indent/${id}/detail`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json();

        // 2️⃣ FETCH MASTER ITEMS LIST (YOUR NEW API)
        const masterResponse = await fetch(`https://rcs-dms.onlinetn.com/api/v1/item/all/list`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        const masterResult = await masterResponse.json();
        const masterItems = masterResult.data || masterResult;

        if (response.ok && !result.error) {
          const details = result.data || result;
          setOrderDetails(details);

          if (details && details.length > 0) {
            const initialDispatchData = details.map(item => {
              const masterItem = masterItems.find(m => m.id === item.id);

              let packSize = 0;
              let packRate = 0;
              let brandName = item.brand;
              if (masterItem && masterItem.brands && masterItem.brands.length > 0) {
                // ✅ Prepare all available packs with brand info
                const allPacks = masterItem.brands
                  .filter(b => b && (typeof b.pack_size !== "undefined" || typeof b.pack !== "undefined") && b.rate !== undefined)
                  .map(b => {
                    // Handle both pack_size and pack fields
                    const packSize = Number(b.pack_size ?? b.pack ?? 0);

                    return {
                      name: (b.name || '').trim(),
                      pack_size: packSize,
                      rate: parseFloat(b.rate),
                      per_unit: packSize === 0
                        ? parseFloat(b.per_unit)
                        : parseFloat(b.per_unit ?? (b.rate / packSize)),
                      gst: masterItem.gst || 0  // ✅ ADD THIS LINE
                    };
                  });



                // ✅ CASE 1: Brand is NULL → Always allow selection via popup
                // ✅ CASE 1: Brand is NULL → Check if single pack or multiple
                if (!item.brand || item.brand === null) {

                  // ✅ NEW: If only ONE pack exists, auto-select it (no icon needed)
                  if (allPacks.length === 1) {
                    packSize = allPacks[0].pack_size;

                    packRate = allPacks[0].rate;
                    brandName = allPacks[0].name; // Set brand name from single pack
                    item.brandPacks = []; // Empty = no icon
                  } else {
                    // Multiple packs → allow selection via popup
                    item.brandPacks = allPacks;

                    // auto-select lowest cost pack for pack & rate ONLY
                    // auto-select lowest cost pack for pack & rate ONLY
                    const lowestCostPack = allPacks.reduce((min, curr) =>
                      curr.per_unit < min.per_unit ? curr : min
                      , allPacks[0]); // ✅ ADD THIS INITIAL VALUE
                    packSize = lowestCostPack.pack_size;


                    packRate = lowestCostPack.rate;
                    brandName = null; // Keep NULL so icon shows
                  }

                } else {
                  // ✅ CASE 2: Brand IS selected → Check if OTHER brands exist

                  // Count unique brands (excluding empty string and the selected brand)
                  const uniqueBrands = new Set(
                    allPacks
                      .map(p => p.name.trim())
                      .filter(name => name !== '') // exclude loose qty
                  );

                  const selectedBrand = (item.brand || '').trim();

                  // Get packs for selected brand
                  const packsForBrand = selectedBrand
                    ? allPacks.filter(p => p.name.trim().toLowerCase() === selectedBrand.toLowerCase())
                    : allPacks;

                  // 🔍 DEBUG LOGS
                  console.log(`📦 Item: ${item.name}`);
                  console.log(`🏷️ Selected Brand: "${selectedBrand}"`);
                  console.log(`📊 Unique Brands Count: ${uniqueBrands.size}`);
                  console.log(`✅ Packs for "${selectedBrand}":`, packsForBrand);

                  // ✅ Show icon if multiple brands exist OR multiple packs for selected brand
                  if (uniqueBrands.size > 1 || packsForBrand.length > 1) {
                    item.brandPacks = allPacks; // Store ALL packs for selection

                    // Auto-select lowest per-unit cost pack from selected brand
                    if (packsForBrand.length > 0) {
                      const lowestCostPack = packsForBrand.reduce((min, curr) =>
                        curr.per_unit < min.per_unit ? curr : min
                        , packsForBrand[0]);

                      packSize = lowestCostPack.pack_size;
                      packRate = lowestCostPack.rate;
                      brandName = selectedBrand;
                    }
                  } else if (packsForBrand.length === 1) {
                    // Only one pack for this brand, no other brands
                    packSize = packsForBrand[0].pack_size;
                    packRate = packsForBrand[0].rate;
                    brandName = selectedBrand;
                    item.brandPacks = []; // No icon needed
                  } else {
                    packSize = 0;
                    packRate = 0;
                    brandName = selectedBrand;
                    item.brandPacks = []; // No icon needed
                  }
                }
              }
              const orderQty = parseFloat(item.qty);
              let dispatchQty = orderQty;
              let remarks = ""; // Keep empty by default

              if (packSize > 0) {
                const totalPacks = Math.floor(orderQty / packSize);
                const maxDispatch = totalPacks * packSize;
                dispatchQty = maxDispatch; // ✅ ALWAYS set for any pack size > 0
                // Remove auto-generated remarks - keep field empty for user input
              }
              return {
                id: item.id,
                name: item.name,
                brand: brandName,
                unit: item.unit,
                originalBrand: item.brand,
                orderQuantity: orderQty,
                dispatchQuantity: dispatchQty,
                pack_size: packSize,
                no_of_packs: packSize > 0 ? Math.floor(dispatchQty / packSize) : "-",
                rate: packRate || (() => {
                  // Calculate lowest per-unit rate from all available packs
                  if (item.brandPacks && item.brandPacks.length > 0) {
                    const validPacks = item.brandPacks.filter(p => p.pack_size > 0);
                    if (validPacks.length > 0) {
                      const lowestPerUnit = Math.min(
                        ...validPacks.map(p => p.per_unit)
                      );
                      return lowestPerUnit.toFixed(2);
                    }
                  }
                  // Fetch rate from master list API for items without packs
                  const masterItem = masterItems.find(m => m.id === item.id);
                  return masterItem?.rate || item.rate_range || 0;
                })(),
                remarks: remarks,
                brandPacks: item.brandPacks || []  // ✅ ADD THIS LINE
              };
            });

            setDispatchData(initialDispatchData);
          }
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrderDetails();
    }
  }, [id]);


  // Handle dispatch quantity change
  const handleDispatchQuantityChange = (itemId, rawValue) => {
    setDispatchData(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;

        const pack_size = Number(item.pack_size);



        const orderQty = Number(item.orderQuantity);
        const isBlank = rawValue === '';
        const inputQty = parseFloat(rawValue);

        // allow empty typing state
        if (isBlank || isNaN(inputQty)) {
          return { ...item, dispatchQuantity: '', no_of_packs: '-' };
        }

        // block negatives
        if (inputQty < 0) {
          return { ...item, dispatchQuantity: 0, no_of_packs: pack_size > 0 ? 0 : '-' };

        }


        // PACK = 0 → allow any decimals BUT DO NOT ALLOW qty > ordered
        if (pack_size === 0) {

          if (inputQty > orderQty) {
            alert(`Dispatch quantity cannot be greater than ordered quantity (${orderQty}).`);
            return {
              ...item,
              dispatchQuantity: orderQty,   // reset to ordered qty
              no_of_packs: "-",
            };
          }

          return {
            ...item,
            dispatchQuantity: inputQty,
            no_of_packs: "-",
          };
        }


        // === pack > 0: keep pack-based rounding / cap logic (unchanged) ===
        let roundedQty;
        const lower = Math.floor(inputQty / pack_size) * pack_size;
        const higher = Math.ceil(inputQty / pack_size) * pack_size;

        roundedQty = (Math.abs(higher - inputQty) < Math.abs(inputQty - lower)) ? higher : lower;
        if (roundedQty > orderQty) {
          roundedQty = Math.floor(orderQty / pack_size) * pack_size;
        }

        return {
          ...item,
          dispatchQuantity: roundedQty,
          no_of_packs: Math.floor((roundedQty || 0) / pack_size),

        };
      })
    );
  };
  // Handle remarks change
  const handleRemarksChange = (itemId, value) => {
    setDispatchData(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, remarks: value }
          : item
      )
    );
  };


  const handleSubmitDispatch = async () => {
    // Validate dispatch quantities
    let hasError = false;

    for (const item of dispatchData) {
      const qtyStr = item.dispatchQuantity;
      const qty = parseFloat(qtyStr);
      if (
        qtyStr === "" ||  // only empty is invalid
        isNaN(qty) ||     // invalid number
        qty < 0           // still block negatives
      ) {
        alert(`Invalid dispatch quantity for item "${item.name}".`);
        hasError = true;
        break;
      }

      // Round quantity to 3 decimal places for consistency
      item.dispatchQuantity = qty.toFixed(3);
    }

    if (hasError) {
      return;
    }

    // ✅ Validate phone number
    if (!/^\d{10}$/.test(driverPhone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/indent/${id}/dispatch`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dispatch: new Date().toISOString().slice(0, 10),
          vehicleNumber,
          vehicleType,
          driverName,
          driverPhone,
          bill: eWayBill ? "yes" : "no",
          items: dispatchData
            .filter(item => parseFloat(item.dispatchQuantity || 0) > 0)
            .map(item => {
              // ✅ Generate pack details string for this item
              let packsString = "";

              // Case 1: User manually selected packs via popup
              if (item.selectedPacksData && item.selectedPacksData.length > 0) {
                const grouped = {};

                item.selectedPacksData.forEach(p => {
                  const key = `${p.name}_${p.pack_size}_${p.rate}`;
                  if (!grouped[key]) {
                    grouped[key] = {
                      name: p.name || '',
                      pack_size: p.pack_size,
                      rate: p.rate,
                      gst: p.gst || 0,
                      count: 0,
                      loose_qty: 0
                    };
                  }

                  if (p.pack_size === 0) {
                    grouped[key].loose_qty += (p.loose_qty || 0);
                  } else {
                    grouped[key].count += 1;
                  }
                });

                // Convert grouped data to string format
                packsString = Object.values(grouped)
                  .map(g => {
                    if (g.pack_size === 0) {
                      // Loose qty format: Brand>>0>>loose_qty>>rate>>gst
                      return `${g.name}>>0>>${g.loose_qty}>>${g.rate}>>${g.gst}`;
                    } else {
                      // Pack format: Brand>>pack_size>>rate>>count>>gst
                      return `${g.name}>>${g.pack_size}>>${g.rate}>>${g.count}>>${g.gst}`;
                    }
                  })
                  .join('||');
              }
              // Case 2: Auto-calculated packs (no manual selection)
              else if (item.pack_size > 0) {
                const packCount = Math.floor(parseFloat(item.dispatchQuantity) / item.pack_size);
                const brandName = item.brand || '';
                const gst = item.brandPacks?.[0]?.gst || 0;

                // Format: Brand>>pack_size>>rate>>count>>gst
                packsString = `${brandName}>>${item.pack_size}>>${item.rate}>>${packCount}>>${gst}`;
              }
              // Case 3: Loose quantity (pack_size = 0)
              else {
                const brandName = item.brand || '';
                const looseQty = parseFloat(item.dispatchQuantity);
                const gst = item.brandPacks?.[0]?.gst || 0;

                // Format: Brand>>0>>loose_qty>>rate>>gst
                packsString = `${brandName}>>0>>${looseQty}>>${item.rate}>>${gst}`;
              }
// ✅ Calculate total amount (same logic as Amount column)
const dispatchQty = parseFloat(item.dispatchQuantity || 0);
let totalAmount = 0;

if (item.selectedPacksData && item.selectedPacksData.length > 0) {
  totalAmount = item.selectedPacksData.reduce((sum, p) => sum + p.rate, 0);
} else if (item.pack_size > 0 && item.rate) {
  const numPacks = dispatchQty / item.pack_size;
  totalAmount = numPacks * parseFloat(item.rate);
} else {
  totalAmount = dispatchQty * parseFloat(item.rate || 0);
}

return {
  id: item.id,
  qty: parseFloat(item.dispatchQuantity).toFixed(3),
  remarks: item.remarks,
  packs: packsString,
  rate: (() => {
    if (item.selectedPacksData && item.selectedPacksData.length > 0) {
      const totalAmount = item.selectedPacksData.reduce((sum, p) => sum + p.rate, 0);
      const dispatchQty = parseFloat(item.dispatchQuantity) || 1;
      return (totalAmount / dispatchQty).toFixed(2);
    } else if (item.pack_size > 0) {
      return (item.rate / item.pack_size).toFixed(2);
    } else {
      return parseFloat(item.rate) || 0;
    }
  })(),
  amount: totalAmount.toFixed(2)  // ✅ NEW: Add total amount
};
            }),
          // ✅ REMOVED: packs array is no longer needed
        }),
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        setSuccessMessage('Order dispatched successfully!');
        navigate('/indent-request');
      } else {
        alert(result.message || 'Error dispatching order');
      }
    } catch (err) {
      console.error('Error dispatching order:', err);
      alert('Error dispatching order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle back to orders list
  const handleBackToOrders = () => {
    navigate('/indent-request');
  };

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-gray-50 rounded-lg">
        {successMessage && (
          <div className="mb-3 px-4 py-2 bg-green-100 text-green-800 rounded text-sm font-medium">
            {successMessage}
          </div>
        )}
        <div className="bg-white shadow rounded-lg p-6 h-full flex flex-col">
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }
  const dispatchSummary = dispatchData.reduce(
    (summary, item) => {
      const qty = parseFloat(item.dispatchQuantity || 0);
      const packs = item.pack_size > 0 ? Math.floor(qty / item.pack_size) : 0;

      if (qty > 0) {
        return {
          totalItems: summary.totalItems + 1,
          totalQty: summary.totalQty + qty,
          totalPacks: summary.totalPacks + packs,
        };
      }

      return summary;
    },
    { totalItems: 0, totalQty: 0, totalPacks: 0 } // ✅ INITIAL VALUE - THIS IS CRITICAL
  );
  const summarizePacks = (packs, packPopupItem) => {
    if (packs.length === 0) return [];

    const group = {};

    packs.forEach(p => {
      if (!group[p.pack_size]) group[p.pack_size] = { count: 0, rate: p.rate };
      group[p.pack_size].count += 1;

    });

    return Object.entries(group).map(([pack, info]) => {
      const packKg = parseFloat(pack);
      const count = info.count;

      const label = packKg < 1
        ? `${packKg * 1000} G`
        : `${packKg} ${packPopupItem.unit}`;

      const totalValue = (info.rate * count).toFixed(2);

      return `${label} × ₹${info.rate} × ${count} packs = ₹${totalValue}`;
    });
  };

  const buildRemarksString = (packs) => {
    if (!packs || packs.length === 0) return "";

    const grouped = {};

    packs.forEach(p => {
      if (!grouped[p.pack_size]) {
        grouped[p.pack_size] = { count: 0, rate: p.rate };
      }
      grouped[p.pack_size].count += 1;
    });

    return Object.entries(grouped)
      .map(([packSize, info]) => {
        const size = parseFloat(packSize);

        const qty =
          size < 1
            ? size * 10   // 0.5 → 5
            : size;       // 1 → 1

        return `${qty}*${info.rate}*${info.count}`;
      })
      .join(" , ");
  };
// Add this function before the return statement, around line 590
const hasInvalidAmounts = dispatchData.some(item => {
  const dispatchQty = parseFloat(item.dispatchQuantity || 0);
  
  if (dispatchQty === 0) return false; // Skip items with 0 dispatch qty
  
  // Calculate amount same way as in the Amount column
  let totalAmount = 0;
  
  if (item.selectedPacksData && item.selectedPacksData.length > 0) {
    totalAmount = item.selectedPacksData.reduce((sum, p) => {
      if (p.pack_size === 0) {
        const perUnit = p.per_unit || p.rate || 0;
        const looseQty = p.loose_qty || 0;
        return sum + (perUnit * looseQty);
      } else {
        return sum + p.rate;
      }
    }, 0);
  } else if (item.pack_size > 0 && item.rate) {
    const numPacks = dispatchQty / item.pack_size;
    totalAmount = numPacks * parseFloat(item.rate);
  } else if (item.brandPacks && item.brandPacks.length > 0) {
    const looseItem = item.brandPacks.find(p => p.pack_size === 0);
    if (looseItem && looseItem.per_unit) {
      totalAmount = dispatchQty * parseFloat(looseItem.per_unit);
    } else {
      totalAmount = dispatchQty * parseFloat(item.rate || 0);
    }
  } else {
    totalAmount = dispatchQty * parseFloat(item.rate || 0);
  }
  
  return totalAmount === 0; // Return true if amount is 0 for items with dispatch qty
});
  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 rounded-lg">
      <div className="bg-white shadow rounded-lg p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Dispatch Order #{id}</h1>
          <button
            onClick={handleBackToOrders}
            className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Orders
          </button>
        </div>

        {/* Order Items Dispatch Table */}
        {orderDetails && orderDetails.length > 0 ? (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Items to Despatch</h3>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">S.No</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Item Name</th>
                    <th className="border border-gray-300 px-6 py-2 text-center w-32">Ordered</th>
                    {/* <th className="border border-gray-300 px-4 py-2 text-center">Rate</th> */}
                    <th className="border border-gray-300 px-4 py-2 text-center">Despatch</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Diff</th>
<th className="border border-gray-300 px-4 py-2 text-center">Amount</th> {/* NEW */}
                    <th className="border border-gray-300 px-2 py-2 text-center w-44">Despatch Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatchData
                    .filter(item => Number(item.orderQuantity || 0) > 0)
                    .map((item, index) => {
                      const dispatchQty = Number(item.dispatchQuantity || 0);
                      const orderQty = Number(item.orderQuantity || 0);
                      const diff = dispatchQty - orderQty;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{index + 1}.</td>

                          <td className="border border-gray-300 px-4 py-2 font-medium">
                            <div className="text-gray-800 flex items-center gap-2 flex-wrap">
                              {/* Item Name */}
                              <span>{item.name}</span>

                              {/* Unit - NO BG */}
                              <span className="text-xs font-semibold text-gray-700">
                                {item.unit}
                              </span>
{/* BRAND - GREEN BG - Display only from detail API */}
{item.originalBrand && (
  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">
    {item.originalBrand}
  </span>
)}
                            </div>
                          </td>


                          <td className="border border-gray-300 px-6 py-2 text-right">
                            {orderQty.toFixed(3)}
                          </td>
                      {/* <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
  {(() => {
    // If multiple packs are selected (via popup icon)
    if (item.selectedPacksData && item.selectedPacksData.length > 0) {
      const totalAmount = item.selectedPacksData.reduce((sum, p) => sum + p.rate, 0);
      const dispatchQty = parseFloat(item.dispatchQuantity) || 1;
      const perUnitRate = (totalAmount / dispatchQty).toFixed(2);
      return `₹${perUnitRate}`;
    }

    // Calculate per-unit rate from item data
    if (item.pack_size > 0 && item.rate) {
      const perUnit = (parseFloat(item.rate) / parseFloat(item.pack_size)).toFixed(2);
      return `₹${perUnit}`;
    }
    
    // For loose qty or when pack_size is 0
    if (item.brandPacks && item.brandPacks.length > 0) {
      const looseItem = item.brandPacks.find(p => p.pack_size === 0);
      if (looseItem && looseItem.per_unit) {
        return `₹${parseFloat(looseItem.per_unit).toFixed(2)}`;
      }
    }
    
    // Fallback to item.rate if available
    return item.rate ? `₹${parseFloat(item.rate).toFixed(2)}` : "-";
  })()}
</td> */}

                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <div className="flex items-center justify-center gap-2">

                   
                              {/* INPUT - Disabled when icon is shown */}
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.dispatchQuantity ?? ''}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const inputQty = parseFloat(raw);
                                  const orderQty = parseFloat(item.orderQuantity);

                                  // ✅ Block if trying to enter more than ordered
                                  if (!isNaN(inputQty) && inputQty > orderQty) {
                                    alert(`Cannot exceed ordered quantity (${orderQty}${item.unit})`);
                                    return; // Don't update state
                                  }

                                  setDispatchData(prev =>
                                    prev.map(data =>
                                      data.id === item.id ? { ...data, dispatchQuantity: raw } : data
                                    )
                                  );
                                }}
                                onBlur={(e) => handleDispatchQuantityChange(item.id, e.target.value)}
                                disabled={item.brandPacks && item.brandPacks.length > 1}
                                className={`no-spinner w-20 px-2 py-1 border border-gray-300 rounded text-center ${item.brandPacks && item.brandPacks.length >= 1 && (item.originalBrand === null || item.brandPacks.length > 1)
                                  ? 'bg-gray-100 cursor-not-allowed opacity-60'
                                  : ''
                                  }`}
                              />

                              {/* 🔍 DEBUG - Check icon condition */}
                              {console.log(`${item.name}: brandPacks length = ${item.brandPacks?.length}, should show icon: ${item.brandPacks && item.brandPacks.length > 1}`)}

                              {item.brandPacks && item.brandPacks.length > 1 && (
                                <button
                                  className="p-1 rounded bg-blue-100 hover:bg-blue-200"
                                  title="Select pack size"
                                  onClick={() => {
                                    setPackPopupItem(item);
                                    setShowAllPacks(false);

                                    // ✅ If no previous selection, auto-select lowest per-unit pack
                                    if (!item.selectedPacksData || item.selectedPacksData.length === 0) {
                                      const packsWithPerUnit = item.brandPacks
                                        .map(p => ({
                                          ...p,
                                          per_unit: p.pack_size === 0 ? p.per_unit : (p.rate / p.pack_size)
                                        }));

                                      if (packsWithPerUnit.length > 0) {
                                        // Find pack with lowest per-unit cost
                                        const lowestPack = packsWithPerUnit.reduce((min, curr) =>
                                          curr.per_unit < min.per_unit ? curr : min
                                        );

                                        // ✅ Handle loose qty differently
                                        if (lowestPack.pack_size === 0) {
                                          // For loose qty, don't create array - just store the loose_qty value
                                          setSelectedPacks([{
                                            ...lowestPack,
                                            loose_qty: item.orderQuantity  // Set to full ordered quantity
                                          }]);
                                        } else {
                                          // For packs, calculate how many fit
                                          const numPacks = Math.floor(item.orderQuantity / lowestPack.pack_size);
                                          const autoSelected = Array(numPacks).fill(lowestPack);
                                          setSelectedPacks(autoSelected);
                                        }
                                      } else {
                                        setSelectedPacks([]);
                                      }
                                    } else {
                                      setSelectedPacks(item.selectedPacksData); // Load previous selection
                                    }
                                  }}
                                >
                                  <ListChecks size={20} className="text-blue-700" />
                                </button>
                              )}

                            </div>
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center font-semibold">
                            <span className={diff < 0 ? "text-red-600" : diff > 0 ? "text-green-600" : "text-gray-700"}>
                              {diff.toFixed(2)}
                            </span>
                          </td>

<td className="border border-gray-300 px-4 py-2 text-center font-semibold text-green-700">
  <div className="flex items-center justify-center gap-2">
    <span>
      ₹{(() => {
        const dispatchQty = parseFloat(item.dispatchQuantity || 0);
        
        // If multiple packs selected via popup
        if (item.selectedPacksData && item.selectedPacksData.length > 0) {
          return item.selectedPacksData.reduce((sum, p) => {
            if (p.pack_size === 0) {
              const perUnit = p.per_unit || p.rate || 0;
              const looseQty = p.loose_qty || 0;
              return sum + (perUnit * looseQty);
            } else {
              return sum + p.rate;
            }
          }, 0).toFixed(2);
        }
        
        if (item.pack_size > 0 && item.rate) {
          const numPacks = dispatchQty / item.pack_size;
          return (numPacks * parseFloat(item.rate)).toFixed(2);
        }
        
        if (item.brandPacks && item.brandPacks.length > 0) {
          const looseItem = item.brandPacks.find(p => p.pack_size === 0);
          if (looseItem && looseItem.per_unit) {
            return (dispatchQty * parseFloat(looseItem.per_unit)).toFixed(2);
          }
        }
        
        return (dispatchQty * parseFloat(item.rate || 0)).toFixed(2);
      })()}
    </span>
    
    {parseFloat(item.dispatchQuantity || 0) > 0 && (
      <button
        type="button"
        onClick={() => setRemarksPopupItem(item)}
        className="p-1 rounded bg-indigo-100 hover:bg-indigo-200"
        title="View dispatch details"
      >
        <Info size={18} className="text-indigo-700" />
      </button>
    )}
  </div>
</td>

                          <td className="border border-gray-300 px-2 py-2 text-center w-44">
                            <div className="flex items-center gap-2">
                           
                              {/* Remarks input */}
                              <input
                                type="text"
                                value={item.remarks}
                                onChange={(e) => handleRemarksChange(item.id, e.target.value)}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter remarks (optional)"
                              />
                              {/* View Remarks Icon */}
                            </div>

                          </td>

                        </tr>
                      );
                    })}
                </tbody>
              </table>

{/* Total Amount Summary Row */}
<div className="mt-4 flex justify-end">
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg px-6 py-3 shadow-sm">
    <div className="flex items-center gap-4">
      <span className="text-base font-semibold text-gray-700">Total Amount:</span>
      <span className="text-2xl font-bold text-green-700">
  ₹{dispatchData
    .filter(item => Number(item.orderQuantity || 0) > 0)
    .reduce((sum, item) => {
      const dispatchQty = parseFloat(item.dispatchQuantity || 0);
      
      if (item.selectedPacksData && item.selectedPacksData.length > 0) {
        // ✅ FIXED: Calculate both packs AND loose qty
        return sum + item.selectedPacksData.reduce((s, p) => {
          if (p.pack_size === 0) {
            // Loose qty: per_unit × loose_qty
            const perUnit = p.per_unit || p.rate || 0;
            return s + (perUnit * (p.loose_qty || 0));
          } else {
            // Pack: just add rate
            return s + p.rate;
          }
        }, 0);
      } else if (item.pack_size > 0 && item.rate) {
        const numPacks = dispatchQty / item.pack_size;
        return sum + (numPacks * parseFloat(item.rate));
      } else {
        return sum + (dispatchQty * parseFloat(item.rate || 0));
      }
    }, 0).toFixed(2)}
</span>
    </div>
  </div>
</div>

            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center text-gray-500 mb-6">
            <p>No items found for this order</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleBackToOrders}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Cancel
          </button>
     <button
  onClick={() => setShowPopup(true)}
  disabled={submitting || hasInvalidAmounts}
  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
  title={hasInvalidAmounts ? "Cannot dispatch: Some items have invalid amounts (₹0)" : ""}
>
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Despatching...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Confirm Despatch
              </>
            )}
          </button>
        </div>
        {showPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl border border-gray-100 overflow-hidden">

              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">Dispatch Order Summary</h2>
                  </div>
                  <button
                    onClick={() => setShowPopup(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 space-y-4">
                {/* Order Summary Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  {/* Header and Date - Properly Aligned */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                    <h3 className="text-base font-semibold text-blue-800">
                      Order Summary for Items to be Dispatched
                    </h3>
                    <div className="bg-white px-3 py-1 rounded-md text-xs border border-blue-200">
                      <span className="font-semibold text-gray-900 ml-1">
                        {new Date().toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                  </div>

                  {/* Info Grid - Perfectly Aligned */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white bg-opacity-70 rounded-md p-3 border border-blue-100">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700 text-sm">Total Items:</span>
                        <span className="font-bold text-gray-900">{dispatchSummary.totalItems}</span>
                      </div>
                    </div>

                    <div className="bg-white bg-opacity-70 rounded-md p-3 border border-blue-100">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700 text-sm">Total Quantity:</span>
                        <span className="font-bold text-gray-900">{dispatchSummary.totalQty.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="bg-white bg-opacity-70 rounded-md p-3 border border-blue-100">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700 text-sm">Total Packs:</span>
                        <span className="font-bold text-gray-900">{dispatchSummary.totalPacks}</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-md p-3 border border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700 text-sm">Est. Value:</span>
                        <span className="font-bold text-green-700">
                          ₹{dispatchData.reduce((sum, item) => sum + (item.dispatchQuantity * item.rate || 0), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle & Incharge Details */}
                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-gray-800">Vehicle & Incharge Details</h4>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Vehicle Number
                        </label>
                        <input
                          type="text"
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value)}
                          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                          placeholder="e.g., TN 01 AB 1234"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Vehicle Type
                        </label>
                        <input
                          type="text"
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value)}
                          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                          placeholder="e.g., Truck / Van"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Incharge Name
                        </label>
                        <input
                          type="text"
                          value={driverName}
                          onChange={(e) => setDriverName(e.target.value)}
                          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                          placeholder="e.g., Ravi Kumar"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Incharge Phone
                        </label>
                        <input
                          type="tel"
                          value={driverPhone}
                          onChange={(e) => {
                            // allow only numbers, max 10 digits
                            const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setDriverPhone(value);
                          }}
                          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                          placeholder="e.g., 9876543210"
                        />

                      </div>
                    </div>
                  </div>
                </div>

                {/* E-Way Bill Section */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eWayBill}
                      onChange={(e) => setEWayBill(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-800 font-medium text-sm">E-Way Bill Required</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowPopup(false)}
                  className="px-5 py-2 text-sm font-semibold bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
   <button
  onClick={handleSubmitDispatch}
  disabled={submitting}
  className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all shadow-md flex items-center gap-2 ${
    submitting
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
  }`}
>
  {submitting ? (
    <>
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      Submitting...
    </>
  ) : (
    <>
      Submit Dispatch
    </>
  )}
</button>
              </div>
            </div>
          </div>
        )}
        {packPopupItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">


              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-2">{packPopupItem.name}</h2>
                    <div className="flex justify-between items-center">
                      {/* Left: Brand */}
                      <div>
                        {packPopupItem.brand ? (
                          <span className="text-sm font-semibold px-3 py-1 rounded bg-green-100 text-green-700">
                            {packPopupItem.brand}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500 italic">No brand selected</span>
                        )}
                      </div>

                      {/* Right: Ordered Quantity */}
                      <div className="text-right">
                        <span className="text-sm text-gray-600">Ordered: </span>
                        <span className="font-bold text-lg text-gray-900">
                          {packPopupItem.orderQuantity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPackPopupItem(null);
                      setShowAllPacks(false); // Reset checkbox when closing
                    }}
                    className="text-gray-400 hover:text-gray-600 ml-4"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Pack list - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Available Pack Sizes:</h3>

                {(() => {
                  // Find lowest per-unit pack INCLUDING loose qty
                  // ✅ FIXED CODE - Include loose qty in comparison
                  const packsWithPerUnit = packPopupItem.brandPacks
                    .map(p => ({
                      ...p,
                      // Use existing per_unit for loose qty, calculate for packs
                      per_unit: p.pack_size === 0 ? p.per_unit : (p.rate / p.pack_size)
                    }));
                  const lowestPack = packsWithPerUnit
                    .reduce((min, curr) => curr.per_unit < min.per_unit ? curr : min, packsWithPerUnit[0]);

                  // Decide which packs to display

                  return (
                    <>
                      {/* LOWEST PRICE PACK (ALWAYS VISIBLE) */}
                      <div className="space-y-2">
                        {packPopupItem.brandPacks
                          .filter(p => p.pack_size === lowestPack.pack_size && p.name === lowestPack.name && p.rate === lowestPack.rate)
                          .map((p, idx) => {
                            const ratePerKg =
                              p.pack_size === 0
                                ? Number(p.per_unit).toFixed(2)
                                : (p.rate / p.pack_size).toFixed(2);

                            return (
                              <div key={idx} className="flex justify-between items-center border border-gray-200 p-3 rounded-lg hover:bg-gray-50 transition">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    {/* Pack Size */}
                                    <span className="font-semibold text-gray-800">
                                      {p.pack_size === 0 ? (

                                        <span>Loose Qty</span>
                                      ) : (
                                        <span>
                                          {p.pack_size < 1
                                            ? `${(p.pack_size * 1000).toFixed(0)} G`
                                            : `${p.pack_size} ${packPopupItem.unit}`
                                          }

                                        </span>

                                      )}
                                    </span>

                                    {/* Brand label (if multiple brands) */}
                                    {!packPopupItem.brand && (
                                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                        {p.name}
                                      </span>
                                    )}

                                    {/* Pack Rate - HIGHLIGHTED */}
                                    <span className="text-sm font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                      ₹{p.rate}
                                    </span>

                                  </div>

                                  {/* Per kg rate with GST - below */}
                                  <div className="text-xs text-gray-600">
                                    Per {packPopupItem.unit}: ₹{ratePerKg}
                                    {p.gst > 0 && p.pack_size > 0 && (
                                      <span className="text-orange-700 font-semibold ml-2">
                                        | GST: {p.gst}%
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* PACK > 0 → show +Add button */}
                                {p.pack_size > 0 ? (
                                  <div className="flex items-center gap-2">
                                    {/* Minus Button */}
                                    <button
                                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold"
                                      onClick={() => {
                                        const index = selectedPacks.findIndex(x => x.pack_size === p.pack_size
                                          && x.name === p.name);
                                        if (index >= 0) {
                                          const updated = [...selectedPacks];
                                          updated.splice(index, 1);
                                          const newTotal = updated.reduce((sum, x) => sum + x.pack_size
                                            , 0);
                                          setSelectedPacks(updated);
                                          setDispatchData(prev =>
                                            prev.map(itm =>
                                              itm.id === packPopupItem.id
                                                ? { ...itm, dispatchQuantity: newTotal }
                                                : itm
                                            )
                                          );
                                        }
                                      }}
                                    >
                                      -
                                    </button>

                                    {/* INPUT FIELD - User can type directly */}
                                    <input
                                      type="number"
                                      min="0"
                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm font-semibold -ml-1"
                                      value={selectedPacks.filter(x => x.pack_size === p.pack_size
                                        && x.name === p.name).length || ''}
                                      onChange={(e) => {
                                        const newCount = parseInt(e.target.value) || 0;
                                        if (newCount < 0) return;

                                        const currentPacks = selectedPacks.filter(x => x.pack_size === p.pack_size
                                          && x.name === p.name);
                                        const diff = newCount - currentPacks.length;

                                        if (diff > 0) {
                                          // Add packs
                                          const newPacks = Array(diff).fill(p);
                                          const updatedPacks = [...selectedPacks, ...newPacks];
                                          const newTotal = updatedPacks.reduce((sum, x) => sum + x.pack_size
                                            , 0);

                                          const safeTotal = Number(newTotal.toFixed(4));
                                          const orderedQty = Number(packPopupItem.orderQuantity.toFixed(4));

                                          if (safeTotal > orderedQty) {
                                            alert(`Cannot exceed ordered quantity (${packPopupItem.orderQuantity}${packPopupItem.unit})`);
                                            return;
                                          }

                                          setSelectedPacks(updatedPacks);
                                          setDispatchData(prev =>
                                            prev.map(itm =>
                                              itm.id === packPopupItem.id
                                                ? { ...itm, dispatchQuantity: newTotal }
                                                : itm
                                            )
                                          );
                                        } else if (diff < 0) {
                                          // Remove packs
                                          const updated = [...selectedPacks];
                                          for (let i = 0; i < Math.abs(diff); i++) {
                                            const index = updated.findIndex(x => x.pack_size === p.pack_size
                                              && x.name === p.name);
                                            if (index >= 0) updated.splice(index, 1);
                                          }
                                          const newTotal = updated.reduce((sum, x) => sum + x.pack_size
                                            , 0);
                                          setSelectedPacks(updated);
                                          setDispatchData(prev =>
                                            prev.map(itm =>
                                              itm.id === packPopupItem.id
                                                ? { ...itm, dispatchQuantity: newTotal }
                                                : itm
                                            )
                                          );
                                        }
                                      }}
                                      placeholder="0"
                                    />

                                    {/* Plus Button */}
                                    <button
                                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-bold"
                                      onClick={() => {
                                        const currentTotal = selectedPacks.reduce((sum, x) => sum + x.pack_size
                                          , 0);
                                        const newTotal = currentTotal + p.pack_size;

                                        const safeTotal = Number(newTotal.toFixed(4));
                                        const orderedQty = Number(packPopupItem.orderQuantity.toFixed(4));

                                        if (safeTotal > orderedQty) {
                                          alert(`Cannot exceed ordered quantity (${packPopupItem.orderQuantity}${packPopupItem.unit})`);
                                          return;
                                        }

                                        setSelectedPacks(prev => [...prev, p]);
                                        setDispatchData(prev =>
                                          prev.map(itm =>
                                            itm.id === packPopupItem.id
                                              ? { ...itm, dispatchQuantity: newTotal }
                                              : itm
                                          )
                                        );
                                      }}
                                    >
                                      +
                                    </button>

                                    {/* Total weight display - LARGER */}
                                    <span className="text-sm font-bold text-gray-900 ml-2 px-2 py-0.5 bg-gray-100 rounded">
                                      {(() => {
                                        const count = selectedPacks.filter(
                                          x => x.pack_size === p.pack_size
                                            && x.name === p.name
                                        ).length;

                                        const totalKg = count * p.pack_size;


                                        return totalKg > 0
                                          ? Number(totalKg.toFixed(3)).toString()
                                          : "";
                                      })()}
                                    </span>

                                  </div>
                                ) : (
                                  /* Loose qty input - unchanged */
                                  // Loose qty input - unchanged
                                  // Loose qty input - can be added to pack selection
                                  // Loose qty input - unchanged
                                  // Loose qty input - can be added to pack selection
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      placeholder="Enter qty"
                                      className="w-24 px-2 py-1 border border-gray-300 rounded"
                                      value={
                                        selectedPacks.find(x => x.pack_size === 0 && x.name === p.name)?.loose_qty || ''
                                      }
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;

                                        // Remove any existing loose qty for this brand
                                        const withoutLoose = selectedPacks.filter(x => !(x.pack_size === 0 && x.name === p.name));

                                        // Calculate total with packs only
                                        const packsTotal = withoutLoose.reduce((sum, x) => sum + x.pack_size, 0);
                                        const newTotal = packsTotal + val;
                                        const ordered = packPopupItem.orderQuantity;

                                        if (newTotal > ordered) {
                                          alert(`Total quantity cannot exceed ordered qty (${ordered}${packPopupItem.unit})`);
                                          return;
                                        }

                                        // Add loose qty if > 0
                                        const updatedPacks = val > 0
                                          ? [...withoutLoose, { pack_size: 0, rate: p.rate, name: p.name, loose_qty: val }]
                                          : withoutLoose;

                                        setSelectedPacks(updatedPacks);
                                        setDispatchData(prev =>
                                          prev.map(itm =>
                                            itm.id === packPopupItem.id
                                              ? { ...itm, dispatchQuantity: newTotal }
                                              : itm
                                          )
                                        );
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>

                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showAllPacks}
                            disabled={showAllPacks}   // ✅ ONLY disable, DO NOT hide
                            onChange={(e) => setShowAllPacks(e.target.checked)}
                            className="w-4 h-4 mt-0.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-60"
                          />
                          <span className="text-sm text-gray-800 font-medium">
                            Stock not available, informed customer for other brand delivery.
                          </span>
                        </label>
                      </div>

                      {/* OTHER PACK OPTIONS (SHOWN AFTER CHECKBOX CLICK) */}
                      {showAllPacks && (
                        <div className="mt-4 space-y-2">
                          {packPopupItem.brandPacks
                            .filter(p => !(p.pack_size === lowestPack.pack_size && p.name === lowestPack.name && p.rate === lowestPack.rate))
                            .map((p, idx) => {
                              const ratePerKg =
                                p.pack_size === 0
                                  ? Number(p.per_unit).toFixed(2)
                                  : (p.rate / p.pack_size).toFixed(2);

                              return (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center border border-gray-200 p-3 rounded-lg hover:bg-gray-50 transition"
                                >
                                  {/* LEFT SIDE */}
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      {/* Pack Size */}
                                      <span className="font-semibold text-gray-800">
                                        {p.pack_size === 0 ? (

                                          <span>Loose Qty</span>
                                        ) : p.pack_size < 1 ? (
                                          `${(p.pack_size * 1000).toFixed(0)} G`
                                        ) : (
                                          `${p.pack_size} ${packPopupItem.unit}`
                                        )}
                                      </span>

                                      {/* Brand badge (only when no brand selected) */}
                                      {!packPopupItem.brand && (
                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                          {p.name}
                                        </span>
                                      )}

                                      {/* Pack Rate */}
                                      <span className="text-sm font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                        ₹{p.rate}
                                      </span>

                                    </div>


                                    {/* Per unit rate with GST */}
                                    <div className="text-xs text-gray-600">
                                      Per {packPopupItem.unit}: ₹{ratePerKg}
                                      {p.gst > 0 && p.pack_size > 0 && (
                                        <span className="text-orange-700 font-semibold ml-2">
                                          | GST: {p.gst}%
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* RIGHT SIDE */}
                                  {p.pack_size > 0 ? (
                                    <div className="flex items-center gap-2">
                                      {/* Minus */}
                                      <button
                                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold"
                                        onClick={() => {
                                          const index = selectedPacks.findIndex(
                                            x => x.pack_size === p.pack_size
                                              && x.name === p.name
                                          );
                                          if (index >= 0) {
                                            const updated = [...selectedPacks];
                                            updated.splice(index, 1);

                                            const newTotal = updated.reduce((sum, x) => sum + x.pack_size
                                              , 0);
                                            setSelectedPacks(updated);

                                            setDispatchData(prev =>
                                              prev.map(itm =>
                                                itm.id === packPopupItem.id
                                                  ? { ...itm, dispatchQuantity: newTotal }
                                                  : itm
                                              )
                                            );
                                          }
                                        }}
                                      >
                                        -
                                      </button>

                                      {/* Count Input */}
                                      <input
                                        type="number"
                                        min="0"
                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm font-semibold"
                                        value={
                                          selectedPacks.filter(
                                            x => x.pack_size === p.pack_size
                                              && x.name === p.name
                                          ).length || ""
                                        }
                                        onChange={(e) => {
                                          const newCount = parseInt(e.target.value) || 0;
                                          if (newCount < 0) return;

                                          const currentCount = selectedPacks.filter(
                                            x => x.pack_size === p.pack_size
                                              && x.name === p.name
                                          ).length;

                                          const diff = newCount - currentCount;
                                          let updated = [...selectedPacks];

                                          if (diff > 0) {
                                            for (let i = 0; i < diff; i++) updated.push(p);
                                          } else {
                                            for (let i = 0; i < Math.abs(diff); i++) {
                                              const index = updated.findIndex(
                                                x => x.pack_size === p.pack_size
                                                  && x.name === p.name
                                              );
                                              if (index >= 0) updated.splice(index, 1);
                                            }
                                          }
                                          const newTotal = updated.reduce((sum, x) => sum + x.pack_size
                                            , 0);
                                          const orderedQty = packPopupItem.orderQuantity;

                                          if (newTotal > orderedQty) {
                                            alert(
                                              `Cannot exceed ordered quantity (${orderedQty}${packPopupItem.unit})`
                                            );
                                            return;
                                          }
                                          setSelectedPacks(updated);
                                          setDispatchData(prev =>
                                            prev.map(itm =>
                                              itm.id === packPopupItem.id
                                                ? { ...itm, dispatchQuantity: newTotal }
                                                : itm
                                            )
                                          );
                                        }}
                                        placeholder="0"
                                      />
                                      {/* Plus */}
                                      <button
                                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-bold"
                                        onClick={() => {
                                          const currentTotal = selectedPacks.reduce(
                                            (sum, x) => sum + x.pack_size,
                                            0
                                          );
                                          const newTotal = currentTotal + p.pack_size;

                                          const orderedQty = packPopupItem.orderQuantity;
                                          if (newTotal > orderedQty) {
                                            alert(
                                              `Cannot exceed ordered quantity (${orderedQty}${packPopupItem.unit})`
                                            );
                                            return;
                                          }

                                          setSelectedPacks(prev => [...prev, p]);
                                          setDispatchData(prev =>
                                            prev.map(itm =>
                                              itm.id === packPopupItem.id
                                                ? { ...itm, dispatchQuantity: newTotal }
                                                : itm
                                            )
                                          );
                                        }}
                                      >
                                        +
                                      </button>

                                      <span className="text-sm font-bold text-gray-900 ml-2 px-2 py-0.5 bg-gray-100 rounded">
                                        {(() => {
                                          const count = selectedPacks.filter(
                                            x => x.pack_size === p.pack_size
                                              && x.name === p.name
                                          ).length;

                                          const totalKg = count * p.pack_size;

                                          return totalKg > 0 ? totalKg.toFixed(3) : "";
                                        })()}
                                      </span>
                                    </div>
                                  ) : (
                                    // Loose qty input - unchanged
                                    // Loose qty input - can be added to pack selection
                                    // Loose qty input - can be added to pack selection
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        placeholder="Enter qty"
                                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                                        value={
                                          selectedPacks.find(x => x.pack_size === 0 && x.name === p.name && x.rate === p.rate)?.loose_qty || ''
                                        }
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0;

                                          // Remove any existing loose qty for this brand AND rate
                                          const withoutLoose = selectedPacks.filter(x => !(x.pack_size === 0 && x.name === p.name && x.rate === p.rate));

                                          // Calculate total with packs only
                                          const packsTotal = withoutLoose.reduce((sum, x) => sum + (x.pack_size || 0), 0);
                                          const looseQtyTotal = withoutLoose.reduce((sum, x) => sum + (x.loose_qty || 0), 0);
                                          const newTotal = packsTotal + looseQtyTotal + val;
                                          const ordered = packPopupItem.orderQuantity;

                                          if (newTotal > ordered) {
                                            alert(`Total quantity cannot exceed ordered qty (${ordered}${packPopupItem.unit})`);
                                            return;
                                          }

                                          // Add loose qty if > 0
                                          const updatedPacks = val > 0
                                            ? [...withoutLoose, { pack_size: 0, rate: p.rate, name: p.name, per_unit: p.per_unit, loose_qty: val }]
                                            : withoutLoose;

                                          setSelectedPacks(updatedPacks);
                                          setDispatchData(prev =>
                                            prev.map(itm =>
                                              itm.id === packPopupItem.id
                                                ? { ...itm, dispatchQuantity: newTotal }
                                                : itm
                                            )
                                          );
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {/* Selected total - Live updating */}
                      {/* Selected total - Live updating */}
                      {selectedPacks.length > 0 && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-gray-800">Selected Quantity:</span>
                            <span className="text-xl font-bold text-green-700">
                              {selectedPacks.reduce((sum, p) => {
                                if (p.pack_size === 0) {
                                  return sum + (p.loose_qty || 0);
                                }
                                return sum + p.pack_size;
                              }, 0).toFixed(3)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 space-y-1 mt-2">
                            {(() => {
                              // Group packs by brand and pack_size
                              const grouped = {};

                              selectedPacks.forEach(p => {
                                const key = `${p.name}_${p.pack_size}_${p.rate}`;
                                if (!grouped[key]) {
                                  grouped[key] = {
                                    name: p.name,
                                    pack_size: p.pack_size,
                                    rate: p.rate,
                                    gst: p.gst || 0,
                                    count: 0,
                                    loose_qty: 0
                                  };
                                }

                                if (p.pack_size === 0) {
                                  grouped[key].loose_qty += (p.loose_qty || 0);
                                } else {
                                  grouped[key].count += 1;
                                }
                              });

                              return Object.values(grouped).map((item, index) => {
                                const isLoose = item.pack_size === 0;
                                const packSizeDisplay = isLoose
                                  ? 'Loose Qty'
                                  : item.pack_size < 1
                                    ? `${(item.pack_size * 1000).toFixed(0)}G`
                                    : `${item.pack_size}${packPopupItem.unit}`;

                                let totalAmount, displayText;

                                if (isLoose) {
                                  // For loose qty: brand name pack size qty * rate = total
                                  const qtyInGrams = item.loose_qty < 1
                                    ? `${(item.loose_qty * 1000).toFixed(0)}G`
                                    : `${item.loose_qty}${packPopupItem.unit}`;
                                  totalAmount = (item.loose_qty * item.rate).toFixed(2);
                                  displayText = `${item.name} ${packSizeDisplay} ${qtyInGrams} × ₹${item.rate}`;
                                } else {
                                  // For packs: brand name pack size no of packs * rate = total
                                  totalAmount = (item.count * item.rate).toFixed(2);
                                  displayText = `${item.name} ${packSizeDisplay} ${item.count}P × ₹${item.rate}`;
                                }

                                // Add GST info if applicable
                                const gstText = item.gst > 0 && !isLoose ? ` + ${item.gst}% GST` : '';

                                return (
                                  <div key={index} className="flex items-start justify-between">
                                    <span className="ml-2">
                                      {index + 1}. {displayText} = ₹{totalAmount}{gstText}
                                    </span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setPackPopupItem(null);
                    setShowAllPacks(false); // Reset checkbox when closing
                  }}
                  className="px-5 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
                  disabled={selectedPacks.length === 0}
                  onClick={() => {
                    const totalQty = selectedPacks.reduce((sum, p) => {
                      if (p.pack_size === 0) {
                        return sum + (p.loose_qty || 0);
                      }
                      return sum + p.pack_size;
                    }, 0);

                    setDispatchData(prev =>
                      prev.map(itm =>
                        itm.id === packPopupItem.id
                          ? {
                            ...itm,
                            dispatchQuantity: totalQty,
                            no_of_packs: selectedPacks.length,
                            selectedPacksData: selectedPacks  // ✅ Only store pack data, no remarks
                          }
                          : itm
                      )
                    );

                    setPackPopupItem(null);
                  }}
                >
                  Apply Selection
                </button>
              </div>

            </div>
          </div>
        )}
        {remarksPopupItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">

              {/* Header */}
              {/* Header */}
              <div className="px-5 py-4 border-b flex justify-between items-center bg-gradient-to-r from-indigo-600 to-indigo-700">
                <h3 className="text-white font-semibold text-lg">
                  Dispatch Details - {remarksPopupItem.name}
                </h3>
                <button
                  onClick={() => setRemarksPopupItem(null)}
                  className="text-white hover:bg-white/20 rounded-full p-1"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">

                {/* Item Info */}
                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Item</span>
                    <span className="font-semibold text-gray-900">
                      {remarksPopupItem.name}
                    </span>
                  </div>

                  {remarksPopupItem.brand && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Brand</span>
                      <span className="font-medium text-green-700">
                        {remarksPopupItem.brand}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Ordered Qty</span>
                    <span className="font-medium">
                      {remarksPopupItem.orderQuantity} {remarksPopupItem.unit}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Dispatched Qty</span>
                    <span className="font-medium text-green-700">
                      {remarksPopupItem.dispatchQuantity} {remarksPopupItem.unit}
                    </span>
                  </div>
                </div>

                {/* Dispatch Breakdown */}
                {/* Dispatch Breakdown */}
                <div className="border rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Dispatch Breakdown
                  </h4>

                  <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-gray-800 leading-relaxed space-y-2">
                    {remarksPopupItem.selectedPacksData && remarksPopupItem.selectedPacksData.length > 0 ? (
                      (() => {
                        // Group packs by brand, pack_size, and rate
                        const grouped = {};

                        remarksPopupItem.selectedPacksData.forEach(p => {
                          const key = `${p.name}_${p.pack_size}_${p.rate}`;
                          if (!grouped[key]) {
                            grouped[key] = {
                              name: p.name,
                              pack_size: p.pack_size,
                              rate: p.rate,
                              gst: p.gst || 0,
                              count: 0,
                              loose_qty: 0
                            };
                          }

                          if (p.pack_size === 0) {
                            grouped[key].loose_qty += (p.loose_qty || 0);
                          } else {
                            grouped[key].count += 1;
                          }
                        });

                        return Object.values(grouped).map((item, index) => {
                          const isLoose = item.pack_size === 0;
                          const packSizeDisplay = isLoose
                            ? 'Loose Qty'
                            : item.pack_size < 1
                              ? `${(item.pack_size * 1000).toFixed(0)}G`
                              : `${item.pack_size}${remarksPopupItem.unit}`;

                          let totalAmount, displayText;

                          if (isLoose) {
                            const qtyInGrams = item.loose_qty < 1
                              ? `${(item.loose_qty * 1000).toFixed(0)}G`
                              : `${item.loose_qty}${remarksPopupItem.unit}`;
                            totalAmount = (item.loose_qty * item.rate).toFixed(2);
                            displayText = `${item.name} ${packSizeDisplay} ${qtyInGrams} × ₹${item.rate}`;
                          } else {
                            totalAmount = (item.count * item.rate).toFixed(2);
                            displayText = `${item.name} ${packSizeDisplay} ${item.count}P × ₹${item.rate}`;
                          }

                          const gstText = item.gst > 0 && !isLoose ? ` + ${item.gst}% GST` : '';

                          return (
                            <div key={index} className="font-medium">
                              {index + 1}. {displayText} = ₹{totalAmount}{gstText}
                            </div>
                          );
                        });
                      })()
                    ) : remarksPopupItem.pack_size > 0 && remarksPopupItem.no_of_packs !== "-" && Number(remarksPopupItem.no_of_packs) > 0 ? (
                      // Auto-calculated packs display
                      <div className="font-medium">
                        {(() => {
                          // Get brand name from auto-selected pack if brand is null
                          const displayBrand = remarksPopupItem.brand ||
                            (remarksPopupItem.brandPacks && remarksPopupItem.brandPacks.length > 0
                              ? remarksPopupItem.brandPacks.find(p =>
                                p.pack_size === remarksPopupItem.pack_size &&
                                p.rate === remarksPopupItem.rate
                              )?.name || 'Unknown Brand'
                              : 'Unknown Brand');

                          return `${displayBrand} ${remarksPopupItem.pack_size < 1
                            ? `${(remarksPopupItem.pack_size * 1000).toFixed(0)}G`
                            : `${remarksPopupItem.pack_size}${remarksPopupItem.unit}`} ${remarksPopupItem.no_of_packs}P × ₹${remarksPopupItem.rate} = ₹${(remarksPopupItem.no_of_packs * remarksPopupItem.rate).toFixed(2)}${remarksPopupItem.brandPacks?.[0]?.gst > 0 ? ` + ${remarksPopupItem.brandPacks[0].gst}% GST` : ''}`;
                        })()}
                      </div>
                    ) : (
                      // Loose quantity without packs
                      <div className="font-medium">
                        {remarksPopupItem.brand || 'Loose Qty'} - {remarksPopupItem.dispatchQuantity} {remarksPopupItem.unit} × ₹{remarksPopupItem.rate} = ₹{(remarksPopupItem.dispatchQuantity * remarksPopupItem.rate).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* User Remarks - Separate Section */}
                {remarksPopupItem.remarks && remarksPopupItem.remarks.trim() !== "" && (
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Additional Remarks
                    </h4>
                    <p className="text-sm text-gray-800">
                      {remarksPopupItem.remarks}
                    </p>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t flex justify-end bg-gray-50">
                <button
                  onClick={() => setRemarksPopupItem(null)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
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

export default DispatchOrder;
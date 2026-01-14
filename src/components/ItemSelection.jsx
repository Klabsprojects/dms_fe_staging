import React, { useEffect, useState } from "react";
import axios from "axios";
import { MousePointerClick } from "lucide-react"; // Change this import at the top
import { ListChecks } from "lucide-react"; // Change this import at the top
import { HandClick } from "lucide-react"; // Alternative option

const ItemSelection = () => {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("grocery");
  const [loading, setLoading] = useState(true);

  // Brand popup states
  const [showBrandPopup, setShowBrandPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedBrandRate, setSelectedBrandRate] = useState("");
  // POPUP STATES

  const [selectedPopupItem, setSelectedPopupItem] = useState(null);
  const openBrandPopup = (item) => {
    setSelectedPopupItem(item);
    setSelectedBrand(null); // reset previous choice
    setShowBrandPopup(true);
  };
  const closeBrandPopup = () => {
    setShowBrandPopup(false);
    setSelectedPopupItem(null);
  };


  const getSelectedItems = () => {
    return JSON.parse(localStorage.getItem("selectedItems")) || [];
  };

  const filterAlreadySelected = (list) => {
    const selectedIds = getSelectedItems();
    return list.filter((item) => !selectedIds.includes(item.id));
  };

  useEffect(() => {
    loadItems();
  }, []);

  const getRateDisplay = (brands = []) => {
    if (!brands.length) return "—";

    const rates = brands.map(b => b.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);

    return min === max ? `${min}` : `${min} - ${max}`;
  };


  const loadItems = async () => {
    try {
      const token = localStorage.getItem("authToken");

      const response = await axios.get(
        "https://rcs-dms.onlinetn.com/api/v1/item/all/list",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let allItems = response.data?.data || [];
      allItems = filterAlreadySelected(allItems);

      setItems(allItems);
    } catch (error) {
      console.error("Failed to load items:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("authToken");
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };


  const handleBrandSubmit = () => {
    if (!selectedBrand) return alert("Please select a brand");

    alert(
      `Brand selected for ${selectedItem.name}: ${selectedBrand.name} (Rate: ₹${selectedBrandRate})`
    );

    setShowBrandPopup(false);
  };

  //---------------- FILTERED LIST ----------------//
  const filteredItems = items.filter((item) => {
    if (activeTab === "grocery") return item.category === "food";
    if (activeTab === "housekeeping") return item.category === "housekeeping";
    if (activeTab === "dailie") return item.category === "dailie";
    return false;
  });
  // API: Submit brand selection
  const submitBrandSelection = async (itemId, brandData) => {
    try {
      const token = localStorage.getItem("authToken");

      const payload = {
        name: brandData.brand,
        // pack: brandData.qty,   // qty now contains pack
        // rate: brandData.rate,
      };


      const url = `https://rcs-dms.onlinetn.com/api/v1/item/branch/brand/${itemId}`;

      await axios.put(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Brand added successfully!");

      // 🔹 Optimistically update local items state
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId
            ? {
              ...item,
              brand: brandData.brand,
              rate: brandData.rate,
              // Update brands array to reflect new rate/qty/mrp for selected brand
          brands: item.brands.map(b =>
  b.name === brandData.brand
    ? { ...b, rate: brandData.rate, pack_size: brandData.qty, mrp: brandData.mrp }
    : b
),

            }
            : item
        )
      );


      // Close the popup after update
      // Reload items from backend after successful update
      await loadItems();
      closeBrandPopup();


    } catch (err) {
      console.error("Brand submit failed:", err);
      alert("Failed to submit brand. Try again.");
    }
  };
const getFinalRateRange = (item) => {
  const brands = item.brands || [];

  // If no brands found
  if (!brands.length) return "—";

  // Helper function to calculate rate per kg
const getRatePerKg = (rate, packSize) => {
  if (packSize === 0) return rate;
  return rate / packSize;
};


  // CASE 1 & 2:
  // Non-branded OR Branded but NO brand selected → use full range
  if (item.branded === 0 || item.brand === null || item.brand === "" || item.brand === "-") {
    const ratesPerKg = brands.map(b => getRatePerKg(b.rate, b.pack_size
));
    const min = Math.min(...ratesPerKg);
    const max = Math.max(...ratesPerKg);
    return min === max
      ? `${min.toFixed(2)}/kg`
      : `${min.toFixed(2)} - ${max.toFixed(2)}/kg`;
  }

  // CASE 3:
  // Branded AND brand selected → only selected brand range
  const selectedBrandRates = brands
    .filter(b => b.name === item.brand)
    .map(b => getRatePerKg(b.rate, b.pack_size
));

  if (!selectedBrandRates.length) return "—";

  const min = Math.min(...selectedBrandRates);
  const max = Math.max(...selectedBrandRates);

  return min === max
    ? `${min.toFixed(2)}/kg`
    : `${min.toFixed(2)} - ${max.toFixed(2)}/kg`;
};
const hasMultiplePacks = (item) => {
  if (!item.brands || item.brands.length === 0) return false;

  const uniquePacks = new Set(item.brands.map(b => b.pack_size
));
  return uniquePacks.size > 1;
};

  return (
    <div className="w-full px-4 py-6">

      {/* Header */}
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Item Selection</h2>

      {/* Tabs */}
      <div className="flex space-x-2 mb-4">
        {[
          { key: "grocery", label: "Grocery" },
          { key: "housekeeping", label: "Housekeeping" },
          { key: "dailie", label: "Veg / Meat / Dairy " },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${activeTab === tab.key
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow p-4">
        {loading ? (
          <p className="text-gray-500">Loading items...</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-gray-500">No items found.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-700 text-sm">
                <th className="p-2 w-20">S.No</th>
                <th className="p-2">Item Name</th>

<th className="p-2">GST</th>

                {/* NEW RATE COLUMN */}
                <th className="p-2">Rate</th>

                {/* NEW MRP COLUMN — HIDE FOR VEG/MEAT/DAIRY */}
                {/* {activeTab !== "dailie" && <th className="p-2">MRP</th>} */}
                {activeTab !== "dailie" && <th className="p-2"></th>}
              </tr>
            </thead>


            <tbody>
              {filteredItems.map((item, index) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 text-sm">
                  <td className="p-2">{index + 1}</td>

                  {/* Name + Unit INLINE */}
           <td className="p-2">
  <span className="font-medium">
    {item.name} {item.indent && <span className="text-gray-500 text-sm">({item.indent})</span>}
  </span>

  {item.branded === 1 && item.brand && item.brand !== "-" && (
    <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-xl">
      {item.brand}
    </span>
  )}
</td>

<td className="p-2">
  <span className="text-blue-700 font-medium">
    {item.gst ? `${item.gst}%` : "0%"}
  </span>
</td>

  {/* NEW RATE COLUMN */}
     <td className="p-2">
  <span className="text-green-700 font-medium">
 {activeTab === "dailie"
  ? (item.rate ? `${Number(item.rate).toFixed(2)}/kg` : "—")
  : getFinalRateRange(item)
}

  </span>
</td>

                  {/* NEW MRP COLUMN — HIDE FOR VEG/MEAT/DAIRY */}
                  {/* {activeTab !== "dailie" && (
          <td className="p-2">
  {item.mrp && typeof item.mrp === "number" ? (
    <span className="text-blue-700 font-medium">₹{item.mrp}</span>
  ) : (
    <span className="text-gray-400">—</span>
  )}
</td>
                  )} */}

                  {/* Brand / Rate Column */}
                {item.branded === 1 ? (
  <button
    onClick={() => {
      if (hasMultiplePacks(item)) {
        openBrandPopup(item);
      }
    }}
    className={`p-1 rounded transition
      ${hasMultiplePacks(item)
        ? "text-blue-600 hover:text-blue-800 cursor-pointer"
        : "text-gray-400 cursor-not-allowed"
      }`}
    title={
      hasMultiplePacks(item)
        ? (item.brand && item.brand !== "-" ? "Update Selected Brand" : "Select Brand")
        : "Only one pack available"
    }
  >
    <ListChecks size={18} />
  </button>
) : (
  <span className="text-gray-400 text-sm"></span>
)}

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* ================= BRAND POPUP ================= */}
      {showBrandPopup && selectedPopupItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-2">
          <div className="bg-white w-[600px] max-h-[85vh] overflow-y-auto rounded-xl shadow-xl animate-fadeInUp">

            {/* HEADER */}
            <div className="bg-blue-600 text-white px-5 py-3 rounded-t-xl font-semibold text-lg">
              Select Brand
            </div>

            {/* ITEM NAME */}
            <div className="px-6 py-4 text-gray-800 font-semibold text-md">
              {selectedPopupItem.name}
            </div>

            {/* BRAND LIST */}
            <div className="px-6 pb-4 space-y-3">
              {/* GROUP BRANDS */}
              {(() => {
                const groupedBrands = Object.values(
                  selectedPopupItem.brands.reduce((acc, b) => {
                    if (!acc[b.name]) {
                      acc[b.name] = {
                        name: b.name,
                        packs: [],
                        rates: []
                      };
                    }
                    acc[b.name].packs.push(b.pack_size
);
                    acc[b.name].rates.push(b.rate);
                    return acc;
                  }, {})
                );

return groupedBrands.map((brand, idx) => {
                  const minRate = Math.min(...brand.rates);
                  const maxRate = Math.max(...brand.rates);

                  // Calculate rate per kg for each pack size
             const ratesPerKg = brand.packs.map((packSize, i) => {
  if (packSize === 0) return brand.rates[i];
  return brand.rates[i] / packSize;
});

                  const minRatePerKg = Math.min(...ratesPerKg);
                  const maxRatePerKg = Math.max(...ratesPerKg);
             const packDisplay = brand.packs
.map(p => {
  if (p === 0) return "Loose";
  if (p < 1) return `${p * 1000} Gm`;
  return `${p} Kg`;
})

  .join(", ");
const rateDisplay =
  minRatePerKg === maxRatePerKg
    ? `${minRatePerKg.toFixed(2)}/kg`
    : `${minRatePerKg.toFixed(2)} - ${maxRatePerKg.toFixed(2)}/kg`;
                  return (
                    <div
                      key={idx}
                      onClick={() =>
                        setSelectedBrand({
                          brand: brand.name,
                          qty: brand.packs[0],
                          rate: minRate,
                        })
                      }
                      className={`cursor-pointer rounded-lg p-4 border transition-all
          ${selectedBrand?.brand === brand.name
                          ? "bg-blue-600 text-white border-blue-700"
                          : "bg-white text-gray-800 border-gray-300 hover:bg-blue-50"
                        }`}
                    >
                      <div className="flex justify-between items-center w-full text-md font-medium">
                        <span className="w-1/3 truncate">{brand.name}</span>
                        <span className="w-1/3 text-right">{packDisplay}</span>
                        <span className="w-1/3 text-right">{rateDisplay}</span>
                      </div>
                    </div>
                  );
                });
              })()}

            </div>


            {/* SELECTED TEXT */}
            {selectedBrand && (
              <div className="px-6 text-green-600 font-medium">
                Selected: {selectedBrand.brand}
              </div>
            )}
            {/* FOOTER BUTTONS */}
            <div className="flex justify-end gap-3 p-5 border-t">
              <button
                onClick={closeBrandPopup}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                disabled={!selectedBrand}
                onClick={() => {
                  submitBrandSelection(selectedPopupItem.id, selectedBrand);
                  closeBrandPopup();
                }}
                className={`px-5 py-2 rounded-lg text-white 
      ${selectedBrand
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-blue-300 cursor-not-allowed"
                  }
    `}
              >
                Select
              </button>
            </div>


          </div>
        </div>
      )}

    </div>
  );
};

export default ItemSelection;

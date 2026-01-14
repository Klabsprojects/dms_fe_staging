import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../services/api';
import { Trash2 } from 'lucide-react';
import StoreUpdateForm from './StoreUpdate';
import { Copy } from "lucide-react";

const units = ['Kg', 'Litre', 'Nos', 'Packets', 'Box'];

const categoryMap = {
    Grocery: 'food',
    Housekeeping: 'housekeeping',
    'Veg, Meat, Dairy': 'dailie', // 'dailie' covers veg/meat/dairy in backend
};
const labelMap = {
    food: 'Grocery',
    housekeeping: 'Housekeeping',
    dailie: 'Veg, Meat, Dairy',
};
const Items = () => {
    const formRef = useRef(null);
    const [allItems, setAllItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState(null);
    const [editedItem, setEditedItem] = useState(null);
    const [editIndex, setEditIndex] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [discountExpiryDate, setDiscountExpiryDate] = useState('');
    const [brandPopup, setBrandPopup] = useState({ open: false, brands: [] });
    const [loadingRow, setLoadingRow] = useState(null);
    const [showStatusIndicators, setShowStatusIndicators] = useState(false);
    const [updatedItems, setUpdatedItems] = useState(new Set());
    const categoryIcons = {
        Grocery: '🍽️',
        Housekeeping: '🧹',
        'Veg, Meat, Dairy': '🥦', // Combined icon
    };
    const [userRole, setUserRole] = useState('');
    const [inlineEdit, setInlineEdit] = useState({ index: null, field: '', value: '' });
    const [activeEditField, setActiveEditField] = useState(null); // 'rate' or 'discount'
    const [pendingEdits, setPendingEdits] = useState({});
        const [storeUpdateItem, setStoreUpdateItem] = useState(null);
    const isAdmin = userRole === 'rcs-admin';
    const formFields = isAdmin
        ? ['category', 'item', 'unit', 'gst']
        : ['item', 'unit', 'rate', 'discount', 'expiryDate'];

const tableFields = isAdmin
    ? ['item', 'gst']
    : selectedCategory === 'Veg, Meat, Dairy'
        ? ['item', ...(storeUpdateItem ? [] : ['gst','rate'])]
         : ['item', ...(storeUpdateItem ? [] : ['gst', 'brands', 'package', 'rate'])];

    const [lastUpdatedItem, setLastUpdatedItem] = useState(null);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/item/all/list`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });
                const result = await response.json();
                if (!result.error && Array.isArray(result.data)) {
                    const frontendCategoryMap = {
                        Grocery: 'food', // ✅ changed from Ration
                        Housekeeping: 'housekeeping',
                        'Veg, Meat, Dairy': 'dailie',
                    };
                    // Filter only those items that match the known backend categories
                    const allowedCategories = ['food', 'housekeeping', 'dailie'];
                    const filteredData = result.data.filter(item =>
                        allowedCategories.includes(item.category?.toLowerCase())
                    );
                    setAllItems(filteredData);
                    setCategories(Object.keys(frontendCategoryMap));
                    setSelectedCategory('Grocery');
                    setUserRole(result.user?.role?.toLowerCase()?.trim());  // 👈 This sets the role from API
                }

            } catch (error) {
                console.error('Error fetching items:', error);
            }
        };

        fetchItems();
    }, []);

    const handleUpdateItem = async () => {
        if (!editedItem?.item?.trim()) return;

        try {
            const token = localStorage.getItem('authToken');

            const payload = {
                category: editedItem.category,
                name: editedItem.item,
                resident: "Grams", // static for now
                indent: editedItem.unit,
                gst: parseInt(editedItem.gst || 0),
            };

            // You should pass the item ID from the selected item
            const itemId = editedItem.id;

            const response = await fetch(`${API_BASE_URL}/item/${itemId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!result.error) {
                // alert('Item updated successfully!');
                setSuccessMessage('Item added successfully!');
                setNewItem(null);
                setEditedItem(null);
                setEditIndex(null);

                // Refresh item list
                const refreshed = await fetch(`${API_BASE_URL}/item/all/list`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                const refreshedResult = await refreshed.json();
                if (!refreshedResult.error && Array.isArray(refreshedResult.data)) {
                    setAllItems(refreshedResult.data);
                }
            } else {
                alert('Failed to update item: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error updating item:', error);
            alert('Server error while updating item');
        }
    };
    const normalizeCategory = (cat) => {
        const lower = cat?.toLowerCase();
        const found = Object.entries(categoryMap).find(([, value]) => value === lower);
        if (found) return lower;

        // Fallback if label is accidentally saved like 'Vegetables'
        return categoryMap[cat] || lower;
    };
    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        setNewItem(null);
    };

    const handleAddRow = () => {
        const backendCategory = categoryMap[selectedCategory]; // Get backend value

        setNewItem({
            item: '',
            category: backendCategory || '', // Prefill correctly
            unit: '',
            gst: '',
            discount: '',
            rate: ''
        });
    };
    const handleSaveRow = async () => {
        if (!newItem?.item?.trim()) return;

        try {
            const token = localStorage.getItem('authToken');

            const payload = {
                category: newItem.category,

                name: newItem.item,
                resident: "Grams", // Placeholder for now, you can make this a dropdown later
                indent: newItem.unit,
                gst: parseInt(newItem.gst || 0),
            };

            const response = await fetch(`${API_BASE_URL}/item`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!result.error) {
                setSuccessMessage('Item added successfully!');
                setNewItem(null);

                // Re-fetch item list to reflect new data
                const refreshed = await fetch(`${API_BASE_URL}/item/all/list`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });
                const refreshedResult = await refreshed.json();
                if (!refreshedResult.error && Array.isArray(refreshedResult.data)) {
                    setAllItems(refreshedResult.data);
                }

            } else {
                alert('Failed to add item: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error adding item:', error);
            alert('Server error while adding item');
        }
    };
    const filteredItems = items.filter((row) =>
        row.item.toLowerCase().includes(searchQuery.toLowerCase())
    );
    // Updated function to handle combined category filtering
    const getDisplayedCategoryItems = () => {
        let filtered = [];

        // normalize function (removes spaces + hyphens + lowercase)
        const normalize = (str) => str.replace(/[\s-]/g, "").toLowerCase();

        if (selectedCategory === 'Veg, Meat, Dairy') {
            filtered = allItems.filter(item =>
                item.category?.toLowerCase() === 'dailie' &&
                normalize(item.name).includes(normalize(searchQuery))
            );
        } else {
            const backendCategory = categoryMap[selectedCategory];
            filtered = allItems.filter(item =>
                item.category?.toLowerCase() === backendCategory?.toLowerCase() &&
                normalize(item.name).includes(normalize(searchQuery))
            );
        }

        // Sort alphabetically by name
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
    };
    const displayedCategoryItems = getDisplayedCategoryItems();

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        if (updatedItems.size > 0 || lastUpdatedItem) {
            setShowStatusIndicators(true);
        }
    }, []);

    const saveDiscount = async (itemId, discountValue, expiryDate) => {
        try {
            const token = localStorage.getItem('authToken');

            const payload = {
                id: itemId,
                discount: discountValue,
                expiryDate: expiryDate
            };

            const response = await fetch(`${API_BASE_URL}/item/discount`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!result.error) {
                console.log('Discount saved successfully:', result.message);
                // optionally refresh your items list here
            } else {
                console.error('Error saving discount:', result.message);
            }
        } catch (error) {
            console.error('Server error while saving discount:', error);
        }
    };
    const handleDeleteItem = async () => {
        if (!editedItem?.id) return;

        const confirmDelete = window.confirm('Are you sure you want to delete this item?');
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('authToken');

            const payload = {
                status: 'delete' // ✅ only send status
            };

            const response = await fetch(`${API_BASE_URL}/item/${editedItem.id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!result.error) {
                setSuccessMessage('Item deleted successfully!');
                setEditedItem(null);
                setEditIndex(null);

                // Refresh list
                const refreshed = await fetch(`${API_BASE_URL}/item/all/list`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                const refreshedResult = await refreshed.json();
                if (!refreshedResult.error && Array.isArray(refreshedResult.data)) {
                    setAllItems(refreshedResult.data);
                }
            } else {
                alert('Failed to delete item: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Server error while deleting item');
        }
    };

    const handleRateSave = async () => {
        const token = localStorage.getItem('authToken');
        const payload = {};

        Object.entries(pendingEdits).forEach(([id, rate]) => {
            if (rate !== '' && !isNaN(rate)) {
                payload[id] = { rate: parseFloat(rate) };
            }
        });

        try {
            const response = await fetch(`${API_BASE_URL}item/store/data`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!result.error) {
                setSuccessMessage('Rates updated successfully!');
                setActiveEditField(null);
                setPendingEdits({});
                window.scrollTo({ top: 0, behavior: 'smooth' });

                const refreshed = await fetch(`${API_BASE_URL}/item/all/list`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                const refreshedResult = await refreshed.json();
                if (!refreshedResult.error && Array.isArray(refreshedResult.data)) {
                    setAllItems(refreshedResult.data);
                }
            } else {
                alert('Failed to update rates: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving rate:', error);
            alert('Server error while saving rate');
        }
    };

    const handleDiscountSave = async () => {
        const token = localStorage.getItem('authToken');
        const payload = {};

        Object.keys(pendingEdits).forEach((key) => {
            if (key.endsWith('_expiry')) return;

            const id = key;
            const discount = parseInt(pendingEdits[id] || 0);
            const disc_exp = pendingEdits[`${id}_expiry`] || null;

            if (!isNaN(discount) && disc_exp) {
                payload[id] = { discount, disc_exp };
            }
        });

        try {
            const response = await fetch(`${API_BASE_URL}/item/store/data`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!result.error) {
                setSuccessMessage('Discounts updated successfully!');
                setPendingEdits({});
                setActiveEditField(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });

                const refreshed = await fetch(`${API_BASE_URL}/item/all/list`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                const refreshedResult = await refreshed.json();
                if (!refreshedResult.error && Array.isArray(refreshedResult.data)) {
                    setAllItems(refreshedResult.data);
                }
            } else {
                alert('Failed to update discounts: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving discount:', error);
            alert('Server error while saving discount');
        }
    };

    const handlePackageSave = async () => {
        const token = localStorage.getItem('authToken');
        const payload = {};

        Object.entries(pendingEdits).forEach(([key, value]) => {
            if (key.endsWith('_qty')) {
                const id = key.replace('_qty', '');
                const qty = parseFloat(value);

                if (!isNaN(qty)) {
                    // 🔒 Always fix unit to Kg
              payload[id] = { pack_size: qty, pack_unit: "Kg" };
                }
            }
        });

        try {
            const response = await fetch(`${API_BASE_URL}/item/store/data`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!result.error) {
                setSuccessMessage('Package saved successfully!');
                setPendingEdits({});
                setActiveEditField(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });

                const refreshed = await fetch(`${API_BASE_URL}/item/all/list`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                const refreshedResult = await refreshed.json();
                if (!refreshedResult.error && Array.isArray(refreshedResult.data)) {
                    setAllItems(refreshedResult.data);
                }
            } else {
                alert('Failed to update package: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving package:', error);
            alert('Server error while saving package');
        }
    };
    const [brandList, setBrandList] = useState([{ brand: "", rate: "", discount: "", packQty: "", packUnit: "Kg" }]);
  const handleStoreUpdate = (item) => {
    setStoreUpdateItem(item);

    if (item.brands && item.brands.length > 0) {

        // Group by brand name
        const grouped = item.brands.reduce((acc, b) => {
const name = b.name?.trim() || b.brand?.trim() || "Unknown";


            if (!acc[name]) {
                acc[name] = {
                    brand: name,
                    brandType: b.brand_type || "", // ✅ PREFILL
                    packs: []
                };
            }

            // Determine pack display logic
            let packQty = "";
            let otherQty = "";
            let otherUnit = "";
            const packValue = Number(b.pack_size) || 0;


            if (packValue === 0) {
                // LOOSE
                packQty = "loose";
            } else if ([0.1, 0.2, 0.25, 0.5, 1, 2].includes(packValue)) {
                // STANDARD PACKS
                packQty = packValue.toString();
            } else {
                // OTHERS - convert to appropriate unit
                packQty = "others";
                
                if (packValue < 1) {
                    // Less than 1 Kg → show in Grams
                    otherQty = (packValue * 1000).toString();
                    otherUnit = "Grams";
                } else {
                    // 1 Kg or more → show in Kg
                    otherQty = packValue.toString();
                    otherUnit = "Kg";
                }
            }

            acc[name].packs.push({
                packQty: packQty,
                otherQty: otherQty,
                otherUnit: otherUnit,
                rate: b.rate,
                autoRate: packValue > 0 
                    ? (Number(b.rate) / packValue).toFixed(2)
                    : b.rate // For loose, autoRate = rate
            });

            return acc;
        }, {});

        // Convert grouped object → array
        const finalBrandList = Object.values(grouped);
        setBrandList(finalBrandList);

    } else {
        // Default blank row if no brands exist
        setBrandList([
            {
                brand: "",
                packs: [
                    { packQty: "", otherQty: "", otherUnit: "", rate: "", autoRate: "" }
                ]
            }
        ]);
    }

    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
};
const handleStoreSave = async () => {
    try {
        const token = localStorage.getItem("authToken");

        const payload = {
            brand: []
        };

        brandList.forEach(b => {
            b.packs.forEach(p => {
                let packValue = 0;
                let rateValue = Number(p.rate) || 0;
                let perUnitRate = 0;

                // NORMAL PACK (0.1, 0.2, 1, 2 etc.)
                if (!isNaN(Number(p.packQty)) && p.packQty !== "others" && p.packQty !== "loose") {
                    packValue = Number(p.packQty);
                    perUnitRate = packValue > 0 ? (rateValue / packValue) : 0;
                }

                // OTHERS - Get from qty and unit fields, convert to Kg
                else if (p.packQty === "others") {
                    const qty = Number(p.otherQty) || 0;
                    const unit = p.otherUnit;

                    if (unit === "Kg") {
                        packValue = qty;
                    } else if (unit === "Grams") {
                        packValue = qty / 1000;
                    } else if (unit === "Litre") {
                        packValue = qty;
                    } else if (unit === "Pcs") {
                        packValue = qty;
                    }

                    perUnitRate = packValue > 0 ? (rateValue / packValue) : 0;
                }

                // LOOSE - Pack = 0, per_unit = rate (already per Kg)
                else if (p.packQty === "loose") {
                    packValue = 0;
                    perUnitRate = rateValue;
                }

                payload.brand.push({
                    name: b.brand,
                    brand_type: b.brandType,
                    pack_size: packValue,
                    rate: rateValue,
                    per_unit: parseFloat(perUnitRate.toFixed(2)),
                    gst: parseInt(storeUpdateItem?.gst) || 0  // ✅ GST inside each pack
                });
            });
        });

        const itemId = storeUpdateItem?.id;
        setLoadingRow(itemId);

        const response = await fetch(
            `${API_BASE_URL}/item/store/brand/${itemId}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );

        const result = await response.json();

        if (!result.error) {
            setLoadingRow(null);
            setLastUpdatedItem(itemId);
            setUpdatedItems(prev => new Set([...prev, itemId]));
            setStoreUpdateItem(null);

            // Refresh items
            const refreshed = await fetch(`${API_BASE_URL}/item/all/list`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            const refreshedResult = await refreshed.json();
            if (!refreshedResult.error) setAllItems(refreshedResult.data);
        } else {
            alert(result.message || "Failed to save brand details");
        }
    } catch (err) {
        console.error(err);
        setLoadingRow(null);
        alert("Server error while saving brand details");
    }
};
    const [hasHighlightedRows, setHasHighlightedRows] = useState(false);
    useEffect(() => {
        const hasGreen = allItems.some(item => updatedItems.has(item.id));
        const hasOrange = lastUpdatedItem !== null;

        if (hasGreen || hasOrange) {
            setHasHighlightedRows(true);
        }
    }, [allItems]);

    return (

        <div className="p-8">
            <h2 className="text-xl font-bold text-blue-800 mb-4">Select Category</h2>


            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div className="flex flex-wrap gap-3">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => handleCategoryClick(category)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border shadow-sm transition flex items-center gap-2 ${selectedCategory === category
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-blue-700 border-blue-400 hover:bg-blue-100'
                                }`}
                        >
                            <span>{categoryIcons[category]}</span>
                            <span>{category}</span>
                        </button>
                    ))}
                </div>


                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-64 focus:ring-1 focus:ring-blue-400 focus:outline-none"
                    />
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <div className="flex justify-between items-center mb-4 w-full">
                    <h3 className="text-lg font-semibold text-gray-800">

                        {labelMap[selectedCategory.toLowerCase()] || selectedCategory} Items
                    </h3>
                    {userRole === 'rcs-store' && selectedCategory === 'Veg, Meat, Dairy' && (
                        <div className="flex gap-2">
                            {activeEditField !== 'rate' ? (
                                <button
                                    onClick={() => setActiveEditField('rate')}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
                                >
                                    Rate
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setActiveEditField(null)}
                                        className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-600"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => handleRateSave()}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700"
                                    >
                                        Save
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                    {userRole === 'rcs-store' && hasHighlightedRows && (
                        <div className="flex items-center gap-4 text-xs">

                            <div className="flex items-center gap-1">
                                <span className="inline-block w-3 h-3 rounded-full bg-orange-400"></span>
                                <span className="text-gray-700">Last Updated</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <span className="inline-block w-3 h-3 rounded-full bg-green-400"></span>
                                <span className="text-gray-700">Updated</span>
                            </div>

                        </div>
                    )}
                </div>

                {isAdmin && !newItem && (
                    <button
                        onClick={handleAddRow}
                        className="inline-flex items-center whitespace-nowrap gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 text-sm rounded-md shadow-sm transition duration-200"
                    >
                        <span className="text-base">＋</span>
                        <span>Item</span>
                    </button>
                )}

            </div>
            {successMessage && (
                <div className="mb-3 px-4 py-2 bg-green-200 text-green-900 border border-green-400 rounded text-sm font-semibold shadow-sm">
                    ✅ {successMessage}
                </div>

            )}

            <div className={`flex gap-6 ${newItem ? 'items-start' : ''}`}>
                <div className={`${newItem ? 'w-2/3' : 'w-full'}`}>
                    <table className="w-full table-auto border border-gray-300 text-sm mb-8">
                        <thead>
                            <tr className="bg-gray-100 text-left">
                                {tableFields.map((field) => (
                                    <th key={field} className="border px-4 py-2 capitalize">
                                        {field === 'rate'
                                            ? 'Rate' // 🔹 Always keep "Rate" — no change on click
                                            : field === 'expiryDate'
                                                ? 'Discount Expiry'
                                                : field === 'gst'
                                                    ? 'GST'
                                                    : field.charAt(0).toUpperCase() + field.slice(1)}
                                    </th>
                                ))}

                                {/* 🔹 New Enter Rate column — only when editing */}
                                {selectedCategory === 'Veg, Meat, Dairy' && activeEditField === 'rate' && (
                                    <th className="border px-4 py-2">Enter Rate</th>
                                )}

                                {/* Admin Action */}
                                {userRole === 'rcs-admin' && (
                                    <th className="border px-4 py-2">Action</th>
                                )}

                               {/* Store Action for other categories */}
{userRole === 'rcs-store' && selectedCategory !== 'Veg, Meat, Dairy' && !storeUpdateItem && (
    <th className="border px-4 py-2">Action</th>
)}
                            </tr>
                        </thead>

                        <tbody>
                            {displayedCategoryItems.map((item, index) => (
                                <tr
                                    key={index}
                                    className={`
    ${lastUpdatedItem === item.id ? "bg-orange-200" : ""}
    ${updatedItems.has(item.id) && lastUpdatedItem !== item.id ? "bg-green-200" : ""}
  `}
                                >

                              {tableFields.map((field) => (
    <td key={field} className="border px-4 py-2">
        {field === "item" ? (
            <div className="flex items-center gap-2">
                <span>{item.name}</span>
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                    {item.indent}
                </span>
            </div>
        ) : field === "package" ? (
    (() => {
 const brandArray = Array.isArray(item.brands) ? item.brands : [];


        if (brandArray.length === 0) return "-";

        const uniqueQty = [...new Set(brandArray.map(b => {
        if (b.pack_size === 0) return "Loose Qty";
return b.pack_size;

        }))];
        
        return uniqueQty.join(", ");
    })()
) : field === "brands" ? (
    <span
        className="text-blue-600 underline cursor-pointer"
        onClick={() =>
            setBrandPopup({
                open: true,
       brands: item.brands ?? [],

                itemName: item.name
            })
        }
    >
{item.brands ? item.brands.length : 0}

    </span>
)

: field === "rate" ? (
                                                selectedCategory === "Veg, Meat, Dairy" ? (
                                                    item.rate || "-"
                                                ) : (
                                                    (() => {
                                                      const brandArray = Array.isArray(item.brands) ? item.brands : [];

                                                        if (brandArray.length === 0) return "-";

                                       // CORRECT/INCLUSIVE Logic
                         const autoRates = brandArray
    .map(b => {
        // If pack is missing/null/0, but rate exists, treat rate as per-unit rate
  if ((!b.pack_size || b.pack_size === 0) && b.rate) {
  return Number(b.rate);
}
if (b.pack_size > 0 && b.rate) {
  return Number(b.rate) / Number(b.pack_size);
}
        return null;
    }) // This filter is now implicitly included in the if-checks
    .filter(v => v !== null && !isNaN(v));

                                                        if (autoRates.length === 0) return "-";

                                                        const minAuto = Math.min(...autoRates).toFixed(2);
                                                        const maxAuto = Math.max(...autoRates).toFixed(2);

                                                        return minAuto === maxAuto
                                                            ? `${minAuto}`
                                                            : `${minAuto} - ${maxAuto}`;
                                                    })()
                                                )
                                            ) : (
                                                item[field]
                                            )}
                                        </td>

                                    ))}
                                    {selectedCategory === 'Veg, Meat, Dairy' && activeEditField === 'rate' && (
                                        <td className="border px-4 py-2">
                                            <input
                                                type="number"
                                                className="border px-2 py-1 rounded w-24 text-center"
                                                value={pendingEdits[item.id] || ''}
                                                onChange={(e) =>
                                                    setPendingEdits(prev => ({
                                                        ...prev,
                                                        [item.id]: e.target.value
                                                    }))
                                                }
                                            />
                                        </td>
                                    )}

                                    {userRole !== 'rcs-store' && (
                                        <td className="border px-2 py-1">
                                            <button
                                                onClick={() => {
                                                    setEditIndex(index);
                                                    setEditedItem({
                                                        id: item.id,
                                                        item: item.name,
                                                        unit: item.indent,
                                                        gst: item.gst,
                                                        discount: item.discount,
                                                        rate: item.rate,
                                                        expiryDate: item.expiryDate,
                                                        category: normalizeCategory(item.category),
                                                    });
                                                    setNewItem(null);
                                                    // 👇 Scroll to form
                                                    setTimeout(() => {
                                                        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                    }, 0);
                                                }}
                                                className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    )}
                          {userRole === 'rcs-store' && selectedCategory !== 'Veg, Meat, Dairy' && !storeUpdateItem && (
    <td className="border px-2 py-2 flex items-center gap-2">
        {loadingRow === item.id ? (
            <>
                <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"
                    ></path>
                </svg>
                <span className="text-blue-700 text-xs">Updating...</span>
            </>
        ) : (
            <>
                <button
                    className="p-1 text-blue-600 rounded transition"
                    onClick={() => handleStoreUpdate(item)}
                    title="Edit / Update"
                >
                    <svg 
                        width="18" 
                        height="18" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        <line x1="15" y1="12" x2="15" y2="18"></line>
                        <line x1="12" y1="15" x2="18" y2="15"></line>
                    </svg>
                </button>
            </>
        )}
    </td>
)}
                                </tr>
                            ))}

                        </tbody>

                    </table>
                    {activeEditField === 'rate' && selectedCategory === 'Veg, Meat, Dairy' && (
                        <div className="mt-4 text-right">
                            <button
                                onClick={handleRateSave}
                                className="bg-green-600 text-white px-5 py-2 rounded-lg shadow hover:bg-green-700"
                            >
                                Save Rate
                            </button>
                        </div>
                    )}

                </div>
                {storeUpdateItem && (
                    <StoreUpdateForm
                        item={storeUpdateItem}
                        brandList={brandList}
                        setBrandList={setBrandList}
                        onCancel={() => setStoreUpdateItem(null)}
                        onSave={handleStoreSave}
                    />
                )}


                {/* Add/Edit Form */}
                {(newItem || editedItem) && (
                    <div
                        ref={formRef}
                        className="w-1/3 bg-white p-4 border border-gray-300 rounded-xl shadow relative max-h-[450px] overflow-y-auto">
                        <button
                            onClick={() => {
                                setNewItem(null);
                                setEditedItem(null);
                                setEditIndex(null);
                            }}
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-lg font-bold"
                            title="Close"
                        >
                            ✖
                        </button>

                        <h4 className="text-md font-bold text-gray-700 mb-4">
                            {editedItem ? 'Edit Item' : 'Add New Item'}
                        </h4>

                        <div className="space-y-4 text-sm">
                            {formFields.includes('category') && (
                                <div>
                                    <label className="block font-medium text-gray-600 mb-1">Category</label>
                                    <select
                                        value={editedItem ? editedItem.category : newItem.category}
                                        onChange={(e) =>
                                            editedItem
                                                ? setEditedItem({ ...editedItem, category: e.target.value })
                                                : setNewItem({ ...newItem, category: e.target.value })
                                        }
                                        className="w-full border px-3 py-2 rounded"
                                    >
                                        <option value="food">Grocery</option>
                                        <option value="dailie">Veg / Meat / Dairy</option>
                                        <option value="housekeeping">Housekeeping</option>
                                    </select>

                                </div>
                            )}

                            {formFields.includes('item') && (
                                <div>
                                    <label className="block font-medium text-gray-600 mb-1">Item</label>
                                    <input
                                        type="text"
                                        value={editedItem ? editedItem.item : newItem.item}
                                        onChange={(e) =>
                                            editedItem
                                                ? setEditedItem({ ...editedItem, item: e.target.value })
                                                : setNewItem({ ...newItem, item: e.target.value })
                                        }
                                        className="w-full border px-3 py-2 rounded"
                                    />
                                </div>
                            )}

                            {formFields.includes('unit') && (
                                <div>
                                    <label className="block font-medium text-gray-600 mb-1">Unit</label>
                                    <select
                                        value={editedItem ? editedItem.unit : newItem.unit}
                                        onChange={(e) =>
                                            editedItem
                                                ? setEditedItem({ ...editedItem, unit: e.target.value })
                                                : setNewItem({ ...newItem, unit: e.target.value })
                                        }
                                        className="w-full border px-3 py-2 rounded"
                                    >
                                        <option value="">Select Unit</option>
                                        {units.map((unit, i) => (
                                            <option key={i} value={unit}>{unit}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formFields.includes('rate') && (
                                <div>
                                    <label className="block font-medium text-gray-600 mb-1 ">Rate (Per Kg)</label>
                                    <input
                                        type="number"
                                        value={editedItem ? editedItem.rate : newItem.rate}
                                        onChange={(e) =>
                                            editedItem
                                                ? setEditedItem({ ...editedItem, rate: e.target.value })
                                                : setNewItem({ ...newItem, rate: e.target.value })
                                        }
                                        className="w-full border px-3 py-2 rounded"
                                        placeholder="Enter Rate"
                                    />
                                </div>
                            )}

                            {formFields.includes('gst') && (
                                <div>
                                    <label className="block font-medium text-gray-600 mb-1">GST (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editedItem ? editedItem.gst : newItem.gst}
                                        onChange={(e) =>
                                            editedItem
                                                ? setEditedItem({ ...editedItem, gst: e.target.value })
                                                : setNewItem({ ...newItem, gst: e.target.value })
                                        }
                                        className="w-full border px-3 py-2 rounded"
                                        placeholder="Enter GST %"
                                    />
                                </div>
                            )}

                            {formFields.includes('discount') && (
                                <div>
                                    <label className="block font-medium text-gray-600 mb-1">Discount (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editedItem ? editedItem.discount : newItem.discount}
                                        onChange={(e) =>
                                            editedItem
                                                ? setEditedItem({ ...editedItem, discount: e.target.value })
                                                : setNewItem({ ...newItem, discount: e.target.value })
                                        }
                                        className="w-full border px-3 py-2 rounded"
                                        placeholder="Enter Discount %"
                                    />
                                </div>
                            )}

                            {formFields.includes('expiryDate') && (
                                <div>
                                    <label className="block font-medium text-gray-600 mb-1">Discount Expiry Date</label>
                                    <input
                                        type="date"
                                        value={editedItem ? editedItem.expiryDate || '' : newItem.expiryDate || ''}
                                        onChange={(e) =>
                                            editedItem
                                                ? setEditedItem({ ...editedItem, expiryDate: e.target.value })
                                                : setNewItem({ ...newItem, expiryDate: e.target.value })
                                        }
                                        className="w-full border px-3 py-2 rounded"
                                    />
                                </div>
                            )}


                            <div className="flex justify-between items-center gap-4 mt-4">
                                <button
                                    onClick={() => {
                                        if (editedItem) {
                                            handleUpdateItem();
                                        } else {
                                            handleSaveRow();
                                        }
                                    }}
                                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                                >
                                    {editedItem ? 'Save Changes' : 'Add Item'}
                                </button>

                                {editedItem && (
                                    <button
                                        onClick={handleDeleteItem}
                                        className="text-red-600 hover:text-red-800 p-2 rounded"
                                        title="Delete Item"
                                    >
                                        <Trash2 size={20} />
                                    </button>

                                )}
                            </div>

                        </div>
                    </div>
                )}
            </div>
      {brandPopup.open && (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
        <div className="bg-white w-full max-w-lg rounded-xl shadow-xl relative overflow-hidden">

            {/* FULL-WIDTH BLUE HEADER */}
            <div className="bg-blue-600 text-white text-lg font-semibold px-4 py-3 w-full">
                Brand Details
            </div>

            {/* ITEM NAME BELOW HEADER */}
            <div className="px-6 pt-4 pb-2 text-gray-900 text-base font-semibold border-b border-gray-300">
                {brandPopup.itemName}
            </div>

            {/* TABLE */}
            <div className="p-6">
                <table className="w-full table-auto border border-gray-300 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border px-4 py-2 text-left">Brand</th>
                            <th className="border px-4 py-2 text-left">Pack (Qty)</th>
                            <th className="border px-4 py-2 text-left">Rate</th>
                            <th className="border px-4 py-2 text-left">Rate per Kg</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            // Convert brands → always an array
                            const brandArray = Array.isArray(brandPopup.brands)
                                ? brandPopup.brands
                                : brandPopup.brands
                                    ? [brandPopup.brands]
                                    : [];

                            if (brandArray.length === 0) {
                                return (
                                    <tr>
                                        <td className="border px-4 py-3 text-center" colSpan="4">
                                            No brands available.
                                        </td>
                                    </tr>
                                );
                            }

                            return brandArray.map((b, i) => (
                                <tr key={i}>

                                    {/* BRAND NAME */}
                                    <td className="border px-4 py-2">
                                        {b.name || "-"}
                                    </td>

                              {/* PACK QTY */}
<td className="border px-4 py-2">
  {b.pack_size === 0 
    ? "Loose Quantity"
    : b.pack_size < 1 
      ? `${(b.pack_size * 1000).toFixed(0)} Grams`
      : `${b.pack_size} ${b.pack_unit || "Kg"}`
  }
</td>


                                    {/* RATE */}
                                    <td className="border px-4 py-2 text-right">
                                        ₹ {b.rate}
                                    </td>

                                    {/* RATE PER KG */}
                             {/* RATE PER KG (AUTO CALCULATED) */}
<td className="border px-4 py-2 text-right font-semibold">
  ₹ {
    b.pack_size === 0
      ? Number(b.rate).toFixed(2)
      : (Number(b.rate) / Number(b.pack_size)).toFixed(2)
  }
</td>

                                </tr>
                            ));
                        })()}
                    </tbody>

                </table>

                {/* CLOSE BUTTON */}
                <div className="flex justify-end mt-4">
                    <button
                        onClick={() => setBrandPopup({ open: false, brands: [], itemName: "" })}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 text-sm"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    </div>
)}
        </div>
    );
};

export default Items;


import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../services/api';
import { CalendarDays, Clock, Utensils, Package, Trash2 } from "lucide-react";

const InlineSegmentDietPlannerForm = ({
  segment,
  onSavePlan,
  onCancel,
  loading,
  groceryItems,
  getAllowedUnits,
  editingPlan = null,
  isEditing = false,
}) => {

  const unitOptions = ["Grams", "Kg", "Ml", "L", "Pcs"];


  const categoryOptions = ["Grocery", "Veg/Meat/Dairy", "HouseKeeping"];

  const categoryMapping = {
    Grocery: "food",
    "Veg/Meat/Dairy": "dailie",
    HouseKeeping: "housekeeping",
  };



  // 🟢 Core state
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [weeklyCompleted, setWeeklyCompleted] = useState(false);

  // Weekly
  const [dayMenus, setDayMenus] = useState({});
  const [remainingDays, setRemainingDays] = useState([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [mealTypesByDay, setMealTypesByDay] = useState({});
  const [newMealType, setNewMealType] = useState("");

  // Monthly
  const [monthMenus, setMonthMenus] = useState({});
  const [monthSelectedDates, setMonthSelectedDates] = useState([]);
  const [monthTempItems, setMonthTempItems] = useState([]);

  const defaultMealTypes = [
    "Morning Tea",
    "Morning",
    "Midday",
    "Evening Snacks",
    "Evening",
  ];

  const [availableMealTypes, setAvailableMealTypes] = useState(defaultMealTypes); // resets per day

  const [selectedMealType, setSelectedMealType] = useState(""); // 🔹 instead of reusing newMealType

  const [usedTypes, setUsedTypes] = useState([]);


  useEffect(() => {
    if (selectedDay) {
      setAvailableMealTypes(defaultMealTypes); // reset options when day changes
    }
  }, [selectedDay]);


  // 🟣 Save weekly plan → lock & switch
  const handleWeeklySave = () => {
    if (Object.keys(dayMenus).length === 0) {
      alert("Please add at least one week plan");
      return;
    }
    setWeeklyCompleted(true);
  };

  // 🟢 Final Save (update to include daily)
  const handleFinalSave = () => {
    // --- Daily ---
    const daily = {};
    (mealTypesByDay.daily || []).forEach((meal) => {
      daily[meal.name.toLowerCase()] = {
        items: meal.items.reduce((acc, item) => {
          if (item.id && item.quantity) acc[item.id] = item.quantity.toString();
          return acc;
        }, {}),
      };
    });

    // --- Weekly ---
    const weekly = {};
    Object.entries(dayMenus).forEach(([day, meals]) => {
      weekly[day] = {};
      meals.forEach((meal) => {
        weekly[day][meal.name.toLowerCase()] = {
          items: meal.items.reduce((acc, item) => {
            if (item.id && item.quantity) acc[item.id] = item.quantity.toString();
            return acc;
          }, {}),
        };
      });
    });

    // --- Monthly ---
    const monthly = {};
    Object.entries(monthMenus).forEach(([date, items]) => {
      monthly[date] = {
        items: items.reduce((acc, item) => {
          if (item.id && item.quantity) acc[item.id] = item.quantity.toString();
          return acc;
        }, {}),
      };
    });

    // --- Build payload only with created sections ---
    const payload = { plan: {} };
    if (Object.keys(daily).length > 0) payload.plan.daily = daily;
    if (Object.keys(weekly).length > 0) payload.plan.weekly = weekly;
    if (Object.keys(monthly).length > 0) payload.plan.monthly = monthly;

    console.log("📦 Final Payload (Object):", payload);
    onSavePlan(payload);
  };

  const handleDailySave = () => {
    if (!mealTypesByDay.daily || mealTypesByDay.daily.length === 0) {
      alert("Please add at least one daily meal plan");
      return;
    }

    const daily = {};
    mealTypesByDay.daily.forEach((meal) => {
      daily[meal.name.toLowerCase()] = {
        items: meal.items.reduce((acc, item) => {
          if (item.id && item.quantity) {
            acc[item.id] = item.quantity.toString();
          }
          return acc;
        }, {}),
      };
    });

    const payload = {
      plan: {
        daily: daily,
      },
    };

    console.log("📦 Daily Payload:", payload);
    onSavePlan(payload); // 🚀 will call handleSaveSegmentPlan → savePlanToSegment
  };

  const [segmentItems, setSegmentItems] = useState([]);


  const [segmentItemsLoading, setSegmentItemsLoading] = useState(false);

  const fetchSegmentItems = async () => {
    try {
      setSegmentItemsLoading(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await fetch(`${API_BASE_URL}/segment/items`, {
        method: "GET",
        headers: {
          Authorization: token, // 👈 same as your grocery fetch
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (result.error === false) {
        console.log("✅ Segments fetched successfully:", result.data);
        setSegmentItems(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching segment items:", error);
      setSegmentItems([]);
    } finally {
      setSegmentItemsLoading(false);
    }
  };

  useEffect(() => {
    fetchSegmentItems();
  }, []);


  const handleItemChange = (day, mealIndex, itemIndex, value) => {
    const updated = { ...mealTypesByDay };
    const selectedItem = segmentItems.find((s) => s.id === parseInt(value));

    updated[day][mealIndex].items[itemIndex] = {
      ...updated[day][mealIndex].items[itemIndex],
      id: selectedItem?.id || "",   // 👈 fallback to empty string
      name: selectedItem?.name || "",
      unit: selectedItem?.resident || "Grams",
    };

    setMealTypesByDay(updated);
  };

// Replace the useEffect starting at line ~185 with this fixed version:

useEffect(() => {
  if (!editingPlan || segmentItems.length === 0) return;

  const planSource =
    (editingPlan.data && editingPlan.data.plan) ||
    editingPlan.plan ||
    editingPlan;

  if (!planSource) return;

  console.log('🔍 Edit Plan Source:', planSource);
  console.log('📋 Available Segment Items:', segmentItems);

  const mapCategory = (apiKey) =>
    apiKey === "food"
      ? "Grocery"
      : apiKey === "dailie"
        ? "Veg/Meat/Dairy"
        : apiKey === "housekeeping"
          ? "HouseKeeping"
          : apiKey;

  const normalize = (str) =>
    (str || "").replace(/\s+/g, "").toLowerCase();

  const findItemByNameOrId = (itemName) => {
    return segmentItems.find(
      (g) =>
        g.id === parseInt(itemName) ||
        normalize(g.name) === normalize(itemName)
    );
  };

  // Clear existing state first
  setMealTypesByDay({});
  setDayMenus({});
  setMonthMenus({});
  setSelectedPlan(null); // Reset plan selection

  // Map meal categories into usable items
  const mapMeals = (mealsObj) => {
    return Object.entries(mealsObj || {}).map(([mealName, mealData]) => {
      const items = [];
      
      // Handle direct items structure (new API format)
      if (mealData.items) {
        Object.entries(mealData.items).forEach(([itemId, quantity]) => {
          const foundItem = findItemByNameOrId(itemId);
          console.log(`🔗 Mapping Item ID ${itemId} to:`, foundItem);
          
          if (foundItem) {
            items.push({
              category: mapCategory(foundItem.category),
              id: foundItem.id,
              name: foundItem.name,
              quantity: quantity.toString(),
              unit: foundItem.resident || "Grams",
            });
          }
        });
      } 
      // Handle old structure
      else {
        Object.entries(mealData || {}).forEach(([catKey, catItems]) => {
          if (catKey === 'items') return; // Skip if already processed above
          
          Object.entries(catItems || {}).forEach(([itemName, details]) => {
            const foundItem = findItemByNameOrId(itemName);
            const quantity = typeof details === "string" || typeof details === "number"
              ? details : details?.qty || "";
            const unit = typeof details === "string" || typeof details === "number"
              ? "Grams" : details?.unit || "Grams";

            items.push({
              category: mapCategory(catKey),
              id: foundItem ? foundItem.id : itemName,
              name: foundItem ? foundItem.name : itemName,
              quantity,
              unit,
            });
          });
        });
      }
      
      return { name: mealName.charAt(0).toUpperCase() + mealName.slice(1), items };
    });
  };

  // Handle DAILY plans
  if (planSource.daily) {
    console.log('📅 Processing Daily Plan:', planSource.daily);
    const dailyMeals = mapMeals(planSource.daily);
    console.log('✅ Mapped Daily Meals:', dailyMeals);
    
    setMealTypesByDay({ daily: dailyMeals });
    setSelectedPlan("daily");
    
    // Update available meal types for daily
    const usedMealTypes = dailyMeals.map(meal => meal.name);
    setAvailableMealTypes(prev => prev.filter(type => !usedMealTypes.includes(type)));
  }

  // Handle WEEKLY plans
  if (planSource.weekly) {
    console.log('📆 Processing Weekly Plan:', planSource.weekly);
    const weeklyMeals = {};
    
    Object.entries(planSource.weekly).forEach(([day, meals]) => {
      weeklyMeals[day] = mapMeals(meals);
    });
    
    console.log('✅ Mapped Weekly Meals:', weeklyMeals);
    
    setMealTypesByDay(weeklyMeals);
    setDayMenus(weeklyMeals);
    setSelectedPlan("weekly");
    setWeeklyCompleted(true); // Mark as completed since we're editing
    
    // Update remaining days - remove days that already have plans
    const usedDays = Object.keys(planSource.weekly);
    const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    setRemainingDays(allDays.filter(day => !usedDays.includes(day)));
    
    // Reset selected day if it's already used
    if (usedDays.includes(selectedDay)) {
      setSelectedDay(null);
    }
  }

  // Handle MONTHLY plans  
  if (planSource.monthly) {
    console.log('📅 Processing Monthly Plan:', planSource.monthly);
    const monthlyData = {};
    
    Object.entries(planSource.monthly).forEach(([date, dateData]) => {
      const items = [];
      
      // Handle items directly under date
      if (dateData.items) {
        Object.entries(dateData.items).forEach(([itemId, quantity]) => {
          const foundItem = findItemByNameOrId(itemId);
          if (foundItem) {
            items.push({
              category: mapCategory(foundItem.category),
              id: foundItem.id,
              name: foundItem.name,
              quantity: quantity.toString(),
              unit: foundItem.resident || "Grams",
            });
          }
        });
      }
      
      monthlyData[date] = items;
    });
    
    console.log('✅ Mapped Monthly Data:', monthlyData);
    
    setMonthMenus(monthlyData);
    setSelectedPlan("monthly");
    
    // Clear monthly temp selections since we're editing existing data
    setMonthSelectedDates([]);
    setMonthTempItems([]);
  }

}, [editingPlan, segmentItems]);

  return (
    <div>

      {/* Heading shows once a type is selected */}
      {selectedPlan && (
        <h2 className="text-lg font-semibold mb-4 capitalize">
          Selected Type: {selectedPlan}
        </h2>
      )}

      {/* If nothing is selected yet, show dropdown at the top */}
      {!selectedPlan && (
        <div className="flex items-center gap-3 mb-4">
          <label className="font-semibold text-gray-700">Select Type:</label>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="w-52 border border-gray-300 rounded-xl px-4 pr-10 py-2 text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all appearance-none"
          >
            <option value="">Choose</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          {/* Custom arrow */}
          <div className="-ml-8 pointer-events-none text-gray-500">
            ▼
          </div>
        </div>

      )}


 {(selectedPlan === "daily") && (
  <div className="p-4 border rounded-lg shadow bg-gray-50 mt-6">
    <h2 className="text-xl font-semibold text-blue-700 mb-4">Daily Plan</h2>
    
    {/* Existing meals display */}
    {(mealTypesByDay.daily || []).length > 0 && (mealTypesByDay.daily || []).map((meal, mealIndex) => (
      <div key={mealIndex} className="mb-4 p-3 border rounded bg-white">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">{meal.name}</h4>
          {/* Delete meal button */}
          <button
            type="button"
            className="text-red-600 hover:text-red-800"
            onClick={() => {
              const updated = { ...mealTypesByDay };
              updated.daily = updated.daily.filter((_, i) => i !== mealIndex);
              setMealTypesByDay(updated);
              
              // Add back to available meal types
              setAvailableMealTypes(prev => [...prev, meal.name]);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {meal.items.map((item, idx) => (
          <div key={idx} className="flex gap-2 mb-2 items-end">
            {/* Category */}
            <select
              value={item.category}
              onChange={(e) => {
                const updated = { ...mealTypesByDay };
                updated.daily[mealIndex].items[idx].category = e.target.value;
                setMealTypesByDay(updated);
              }}
              className="w-40 border px-2 py-1 rounded text-sm h-9"
            >
              <option value="">Category</option>
              {categoryOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            {/* Item dropdown filtered by category */}
            <select
              value={item.id || ""}
              onChange={(e) => {
                const selectedId = parseInt(e.target.value);
                const selectedItem = segmentItems.find((s) => s.id === selectedId);

                const updated = { ...mealTypesByDay };
                updated.daily[mealIndex].items[idx] = {
                  ...updated.daily[mealIndex].items[idx],
                  id: selectedItem?.id || "",
                  name: selectedItem?.name || "",
                  unit: selectedItem?.resident || "Grams",
                };
                setMealTypesByDay(updated);
              }}
              className="border px-2 py-1 rounded w-[250px] h-9"
            >
              <option value="">Select Item</option>
              {segmentItems
                .filter(
                  (seg) =>
                    categoryMapping[item.category] &&
                    seg.category.toLowerCase() === categoryMapping[item.category].toLowerCase()
                )
                .map((seg) => (
                  <option key={seg.id} value={seg.id}>
                    {seg.name}
                  </option>
                ))}
            </select>

            {/* Qty */}
            <input
              type="number"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => {
                const updated = { ...mealTypesByDay };
                updated.daily[mealIndex].items[idx].quantity = e.target.value;
                setMealTypesByDay(updated);
              }}
              className="border px-2 py-1 rounded w-20"
            />

            {/* Unit */}
            <select
              value={item.unit}
              onChange={(e) => {
                const updated = { ...mealTypesByDay };
                updated.daily[mealIndex].items[idx].unit = e.target.value;
                setMealTypesByDay(updated);
              }}
              className="border px-2 py-1 rounded w-24"
            >
              {unitOptions.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            {/* Delete item */}
            <button
              type="button"
              className="ml-2 p-1 rounded hover:bg-red-50"
              onClick={() => {
                const updated = { ...mealTypesByDay };
                updated.daily[mealIndex].items =
                  updated.daily[mealIndex].items.filter((_, i) => i !== idx);
                setMealTypesByDay(updated);
              }}
            >
              <Trash2 className="w-5 h-5 text-red-600" strokeWidth={2.5} />
            </button>
          </div>
        ))}

        {/* + Item button */}
        <button
          type="button"
          className="text-sm bg-blue-500 text-white px-3 py-1 rounded"
          onClick={() => {
            const updated = { ...mealTypesByDay };
            updated.daily[mealIndex].items.push({
              category: "",
              id: "",
              name: "",
              quantity: "",
              unit: "Grams",
            });
            setMealTypesByDay(updated);
          }}
        >
          + Item
        </button>
      </div>
    ))}

    {/* Meal type input + Create button BELOW meals */}
    <div className="flex gap-2 mt-4">
      <select
        value={selectedMealType}
        onChange={(e) => setSelectedMealType(e.target.value)}
        className="border px-2 py-1 rounded text-sm"
      >
        <option value="">-- Select Meal Type --</option>
        {availableMealTypes.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>

      <button
        type="button"
        className="bg-green-500 text-white px-3 py-1 rounded"
        onClick={() => {
          if (!selectedMealType.trim()) return;
          setMealTypesByDay((prev) => ({
            ...prev,
            daily: [
              ...(prev.daily || []),
              {
                name: selectedMealType,
                items: [{ category: "", id: "", name: "", quantity: "", unit: "Grams" }],
              },
            ],
          }));
          setAvailableMealTypes((prev) =>
            prev.filter((opt) => opt !== selectedMealType)
          );
          setSelectedMealType("");
        }}
      >
        Create
      </button>
    </div>
  </div>
)}


      {/* 🟦 Weekly Form */}
      {(selectedPlan === "weekly"
        || Object.keys(dayMenus).length > 0
        || selectedDay
        || remainingDays.length < 7) && (

          <div className="p-4 border rounded-lg shadow bg-gray-50 mt-6">
            <h2 className="text-xl font-semibold text-green-700 mb-4">Weekly Plan</h2>
            <div className="p-3 border rounded bg-gray-50">
              {/* ✅ Show saved weekly menus */}
              {Object.keys(dayMenus).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-blue-600" />
                    Added Weekly Menus
                  </h3>

                  <div className="space-y-4">
                    {Object.entries(dayMenus).map(([day, meals]) => (
                      <div
                        key={day}
                        className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm"
                      >
                        {/* Day heading */}
                        <h4 className="text-lg font-bold text-blue-800 mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-700" />
                          {day}
                        </h4>

                        {/* Meals */}
                      {(Array.isArray(meals) ? meals : Object.values(meals || {})).map((meal, i) => (
                          <div
                            key={i}
                            className="mb-3 bg-white border rounded-lg shadow-sm p-3"
                          >
                            <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                              <Utensils className="w-4 h-4 text-green-600" />
                              {meal.name}
                            </h5>

                            <ul className="space-y-1 text-sm text-gray-700">
                           {(Array.isArray(meal.items) ? meal.items : []).map((item, j) => (
                                <li
                                  key={j}
                                  className="flex items-center gap-2 border-b last:border-none py-1"
                                >
                                  <span className="text-gray-500">{j + 1}.</span>
                                  <span className="font-medium text-gray-800">{item.category}</span>
                                  <span>- {item.name}</span>
                                  <span className="ml-auto text-gray-600">
                                    {item.quantity} {item.unit}
                                  </span>
                                </li>
                              ))}
                            </ul>

                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* ✅ Step 1: Select a day */}
              {remainingDays.length > 0 && (
                <div className="flex gap-4 mb-4 flex-wrap">
                  {remainingDays.map((day) => (
                    <label key={day} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="day"
                        value={day}
                        checked={selectedDay === day}
                        onChange={() => setSelectedDay(day)}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              )}

              {/* ✅ Step 2: Add meals + items for selected day */}
              {selectedDay && (
                <div>
                  <h4 className="font-medium mb-4">Selected Day: {selectedDay}</h4>

                  {(mealTypesByDay[selectedDay] || []).map((meal, mealIndex) => (
                    <div key={mealIndex} className="mb-4 p-3 border rounded bg-white">
                      <h2 className="font-medium mb-2">{meal.name}</h2>

                      {meal.items.map((item, idx) => (
                        <div key={idx} className="flex gap-2 mb-2 items-end">
                          {/* Category */}

                          <select
                            value={item.category}
                            onChange={(e) => {
                              const updated = { ...mealTypesByDay };
                              updated[selectedDay][mealIndex].items[idx].category = e.target.value;
                              setMealTypesByDay(updated);
                            }}
                            className="w-40 border px-2 py-1 rounded text-sm h-9"
                          >
                            <option value="">Category</option>
                            {categoryOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>

                          {/* Item */}
                          <select
                            value={item.id || ""}
                            onChange={(e) =>
                              handleItemChange(selectedDay, mealIndex, idx, e.target.value)
                            }
                            className="border px-2 py-1 rounded w-[250px] h-9"
                          >
                            <option value="">Select Item</option>

                            {(() => {
                              // 🟢 Debug log for category mapping
                              console.log("Dropdown Debug:", item.category, categoryMapping[item.category]);

                              return segmentItems
                                .filter(
                                  (seg) =>
                                    categoryMapping[item.category] &&
                                    seg.category.toLowerCase() === categoryMapping[item.category].toLowerCase()
                                )
                                .map((seg) => (
                                  <option key={seg.id} value={seg.id}>
                                    {seg.name}
                                  </option>

                                ));
                            })()}
                          </select>

                          {/* Quantity */}
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = { ...mealTypesByDay };
                              updated[selectedDay][mealIndex].items[idx].quantity = e.target.value;
                              setMealTypesByDay(updated);
                            }}
                            placeholder="Qty"
                            className="border px-2 py-1 rounded w-20"
                          />

                          {/* Unit */}
                          <select
                            value={item.unit}
                            onChange={(e) => {
                              const updated = { ...mealTypesByDay };
                              updated[selectedDay][mealIndex].items[idx].unit = e.target.value;
                              setMealTypesByDay(updated);
                            }}
                            className="border px-2 py-1 rounded w-30"
                          >
                            {unitOptions.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>

                          <button
                            type="button"
                            aria-label="Remove item"
                            className="ml-2 p-1 rounded hover:bg-red-50 self-center"
                            onClick={() => {
                              const updated = { ...mealTypesByDay };
                              updated[selectedDay][mealIndex].items =
                                updated[selectedDay][mealIndex].items.filter((_, i) => i !== idx);
                              setMealTypesByDay(updated);
                            }}
                          >
                            <Trash2 className="w-5 h-5 text-red-600" strokeWidth={2.5} />
                          </button>


                        </div>
                      ))}

                      <div className="flex justify-between mt-2">
                        {/* Add item */}
                        <button
                          type="button"
                          className="text-sm bg-blue-500 text-white px-3 py-1 rounded"
                          onClick={() => {
                            const updated = { ...mealTypesByDay };
                            updated[selectedDay][mealIndex].items.push({
                              name: "",
                              category: "",
                              quantity: "",
                              unit: "Grams",
                            });
                            setMealTypesByDay(updated);
                          }}
                        >
                          + Item
                        </button>

                      </div>

                    </div>
                  ))}

                  {/* Add meal type + Add Day on right */}
                  <div className="flex items-center justify-between mb-3">
                    {/* Meal type input + Create button */}
                    <div className="flex gap-2">
                      <select
                        value={selectedMealType}
                        onChange={(e) => setSelectedMealType(e.target.value)}
                        className="border px-2 py-1 rounded text-sm"
                      >
                        <option value="">-- Select Meal Type --</option>
                        {availableMealTypes.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        className="bg-green-500 text-white px-3 py-1 rounded"
                        onClick={() => {
                          if (!selectedMealType.trim()) return;

                          setMealTypesByDay((prev) => ({
                            ...prev,
                            [selectedDay]: [
                              ...(prev[selectedDay] || []),
                              { name: selectedMealType, items: [{ name: "", category: "", quantity: "", unit: "Grams" }] },
                            ],
                          }));


                          setAvailableMealTypes((prev) => prev.filter((opt) => opt !== selectedMealType)); // remove from dropdown for that day
                          setSelectedMealType("");
                        }}

                      >
                        Create
                      </button>
                    </div>

                    {/* Add Day button on far right */}
                    {mealTypesByDay[selectedDay] && mealTypesByDay[selectedDay].length > 0 && (
                      <button
                        type="button"
                        className="bg-blue-600 text-white px-4 py-1 rounded"
                        onClick={() => {
                          if (selectedDay && mealTypesByDay[selectedDay]) {
                            setDayMenus((prev) => ({
                              ...prev,
                              [selectedDay]: mealTypesByDay[selectedDay],
                            }));
                          }
                          setRemainingDays((prev) => prev.filter((d) => d !== selectedDay));
                          setSelectedDay(null);
                        }}
                      >
                        Add Day
                      </button>
                    )}

                  </div>


                </div>
              )}


            </div>
          </div>
        )}

      {/* 🟩 Monthly Form */}
      {(selectedPlan === "monthly" || Object.keys(monthMenus).length > 0) && (
        <div className="p-4 border rounded-lg shadow bg-gray-50 mt-6">
          <h2 className="text-xl font-semibold text-purple-700 mb-4">Monthly Plan</h2>
          <div className="p-3 border rounded bg-gray-50">
            {/* Preview */}
            {Object.keys(monthMenus).map((date) => (
              <div
                key={date}
                className="mb-4 border rounded-lg p-4 bg-gradient-to-r from-green-50 to-green-100 shadow-sm"
              >
                {/* Date heading */}
                <h4 className="text-lg font-bold text-green-800 mb-2 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-green-700" />
                  Day {date}
                </h4>

                {/* Items */}
                <div className="bg-white border rounded-lg shadow-sm p-3">
                  {monthMenus[date].map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-2 items-center">
                      {/* Category */}
                      <select
                        value={item.category}
                        onChange={(e) => {
                          const updated = { ...monthMenus };
                          updated[date][idx].category = e.target.value;
                          setMonthMenus(updated);
                        }}
                        className="w-32 border px-2 py-1 rounded text-sm h-9"
                      >
                        <option value="">Category</option>
                        {categoryOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>

                      {/* Item */}
                      <select
                        value={item.id || ""}
                        onChange={(e) => {
                          const selectedId = parseInt(e.target.value);
                          const selectedItem = segmentItems.find(g => g.id === selectedId);
                          const updated = { ...monthMenus };
                          updated[date][idx].id = selectedItem ? selectedItem.id : null;
                          updated[date][idx].name = selectedItem ? selectedItem.name : "";
                          setMonthMenus(updated);
                        }}
                        className="border px-2 rounded w-[400px] h-9"
                      >
                        <option value="">Select Item</option>
                        {segmentItems
                          .filter(
                            (seg) =>
                              categoryMapping[item.category] &&
                              seg.category.toLowerCase() === categoryMapping[item.category].toLowerCase()
                          )
                          .map((seg) => (
                            <option key={seg.id} value={seg.id}>
                              {seg.name}
                            </option>
                          ))}
                      </select>

                      {/* Quantity */}
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = { ...monthMenus };
                          updated[date][idx].quantity = e.target.value;
                          setMonthMenus(updated);
                        }}
                        placeholder="Qty"
                        className="border px-2 py-1 rounded w-20"
                      />

                      {/* Unit */}
                      <select
                        value={item.unit}
                        onChange={(e) => {
                          const updated = { ...monthMenus };
                          updated[date][idx].unit = e.target.value;
                          setMonthMenus(updated);
                        }}
                        className="border px-2 py-1 rounded w-35"
                      >
                        {unitOptions.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>

                      {/* Trash Button */}
                      <button
                        type="button"
                        className="ml-1 p-1 rounded hover:bg-red-50"
                        onClick={() =>
                          setMonthTempItems((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        <Trash2 className="w-4 h-4 text-red-600" strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}

                </div>
              </div>
            ))}


            {/* Date picker */}
            {/* Select Date Dropdown - INLINE with label */}
            <div className="flex items-center gap-2 mb-3">
              <label className="font-medium text-gray-700 ml-2">Select Date:</label>
              <select
                value={monthSelectedDates[0] || ""}
                onChange={(e) => {
                  setMonthSelectedDates([e.target.value]);
                  setMonthTempItems([
                    { category: "", name: "", quantity: "", unit: "Grams" },
                  ]);
                }}
                className="border px-2 py-1 rounded w-60"
              >
                <option value="">-- Choose Day --</option>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Items for selected date */}
            {monthSelectedDates.length > 0 && (
              <div className="border rounded p-4 bg-gray-50 shadow-sm">   {/* 👈 Added wrapper */}
                {monthTempItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    {/* Category */}
                    <select
                      value={item.category}
                      onChange={(e) => {
                        const updated = [...monthTempItems];
                        updated[idx].category = e.target.value;
                        setMonthTempItems(updated);
                      }}
                      className="w-32 border px-2 py-1 rounded text-sm h-9"
                    >
                      <option value="">Category</option>
                      {categoryOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>

                    {/* Item */}
                    {/* Item */}
                    <select
                      value={item.id || ""}
                      onChange={(e) => {
                        const selectedId = parseInt(e.target.value);
                        const selectedItem = segmentItems.find((g) => g.id === selectedId);
                        const updated = [...monthTempItems];
                        updated[idx].id = selectedItem ? selectedItem.id : null;
                        updated[idx].name = selectedItem ? selectedItem.name : "";
                        setMonthTempItems(updated);
                      }}
                      className="border px-2 rounded w-[400px] h-9"
                    >
                      <option value="">Select Item</option>
                      {segmentItems
                        .filter(
                          (seg) =>
                            categoryMapping[item.category] &&
                            seg.category.toLowerCase() === categoryMapping[item.category].toLowerCase()
                        )
                        .map((seg) => (
                          <option key={seg.id} value={seg.id}>
                            {seg.name}
                          </option>

                        ))}
                    </select>


                    {/* Qty */}
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...monthTempItems];
                        updated[idx].quantity = e.target.value;
                        setMonthTempItems(updated);
                      }}
                      placeholder="Qty"
                      className="border px-2 py-1 rounded w-20"
                    />

                    {/* Unit */}
                    <select
                      value={item.unit}
                      onChange={(e) => {
                        const updated = [...monthTempItems];
                        updated[idx].unit = e.target.value;
                        setMonthTempItems(updated);
                      }}
                      className="border px-2 py-1 rounded w-35"
                    >
                      {unitOptions.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>

                    {/* Trash Button */}
                    <button
                      type="button"
                      className="ml-1 p-1 rounded hover:bg-red-50"
                      onClick={() =>
                        setMonthTempItems((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      <Trash2 className="w-4 h-4 text-red-600" strokeWidth={2.5} />
                    </button>
                  </div>
                ))}

                {/* Add item + Add Day */}
                <div className="flex justify-between mt-3">
                  <button
                    type="button"
                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    onClick={() =>
                      setMonthTempItems([
                        ...monthTempItems,
                        { category: "", name: "", quantity: "", unit: "Grams" },
                      ])
                    }
                  >
                    + Item
                  </button>

                  <button
                    type="button"
                    className="text-sm bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                    onClick={() => {
                      const date = monthSelectedDates[0];
                      setMonthMenus((prev) => ({
                        ...prev,
                        [date]: monthTempItems,
                      }));
                      setMonthSelectedDates([]);
                      setMonthTempItems([]);
                    }}
                  >
                    Add Day
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
      {/* Dropdown to add another type after one is already selected */}
      {selectedPlan && (
        <div className="mt-6 flex gap-2">
          <label className="font-medium">Add Another Type:</label>
          <select
            value=""
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="">-- Choose Another --</option>
            {["daily", "weekly", "monthly"]
              .filter((type) => type !== selectedPlan) // 🔴 Hide already selected
              .map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
          </select>
        </div>
      )}


      {/* Footer */}
      <div className="mt-4 flex justify-end space-x-3">
        {/* <button
  onClick={onCancel}
  className="px-5 py-0.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-base font-medium"
  disabled={loading}
>
  Cancel
</button> */}

        {/* Save Full Plan Button */}
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={handleFinalSave}
            className="bg-purple-700 text-white px-6 py-2 rounded hover:bg-purple-800"
          >
            Save Plan
          </button>
        </div>

      </div>
    </div>
  );
};

const DietPlanner = () => {
  const [userInfoList, setUserInfoList] = useState([]);
  const [selectedUserIndex, setSelectedUserIndex] = useState(null);
  const [expandedUserIndex, setExpandedUserIndex] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingSegmentId, setEditingSegmentId] = useState(null);
  const [editingPlanIndex, setEditingPlanIndex] = useState(null);
  const [eaterTypes, setEaterTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [segments, setSegments] = useState([]);
  const [formInputs, setFormInputs] = useState({ type: '', subType: '', dietType: '' });
  const newlyCreatedRef = useRef(null); // To scroll to new segment
  const [newlyCreatedSegmentId, setNewlyCreatedSegmentId] = useState(null); // Track which segment to scroll to

  const selectedEaterType = eaterTypes.find(type => type.name === formInputs.type);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [expandedSegment, setExpandedSegment] = useState(null);
  const [expandedSegmentForPlan, setExpandedSegmentForPlan] = useState(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const [groceryItems, setGroceryItems] = useState([]);
  const [groceryItemsLoading, setGroceryItemsLoading] = useState(false);
  // NEW: State for detailed plan view
  const [detailedPlanView, setDetailedPlanView] = useState({});
  const [planDetailsLoading, setPlanDetailsLoading] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [expandedPlanDetails, setExpandedPlanDetails] = useState({});
  const [segmentDetailsLoading, setSegmentDetailsLoading] = useState(new Set());

  // 🔹 Form states for Add/Edit Plan
  const [mealTypesByDay, setMealTypesByDay] = useState({});
  const [dayMenus, setDayMenus] = useState({});
  const [monthMenus, setMonthMenus] = useState({});

  // Fetch segments on component mount using GET API
  useEffect(() => {
    fetchSegments();
    fetchEaterTypes();
    fetchGroceryItems(); // Add this line
  }, []);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTypeDropdown && !event.target.closest('.relative')) {
        setShowTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTypeDropdown]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormInputs({ ...formInputs, [name]: value });
  };
  const combinationExists = (combo) => {
    const dietMapping = {
      'Veg': 'Vegetarian',
      'Non-Veg': 'Non-Vegetarian'
    };

    const categoryForAPI = combo.subType ? `${combo.eaterType} - ${combo.subType}` : combo.eaterType;
    const mappedDiet = dietMapping[combo.dietType];

    return segments.some(segment =>
      segment.category === categoryForAPI &&
      segment.diet === mappedDiet
    );
  };
  const handleEditPlan = (segmentId, planIndex) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment || !segmentHasPlans(segment)) return;

    const plans = getSegmentPlans(segment);
    const planObj = plans[planIndex];
    if (!planObj) return;

    // pass the raw plan object to the child form — let the child populate itself
    setEditingPlan(planObj);
    setEditingSegmentId(segmentId);
    setEditingPlanIndex(planIndex);
    setExpandedSegmentForPlan(segmentId);
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

      if (result.error === false) {
        setGroceryItems(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching grocery items:', error);
    } finally {
      setGroceryItemsLoading(false);
    }
  };

  // NEW: Function to bind items to plan and get detailed information
  // NEW: Function to bind items to plan and get detailed information
  const bindItemsToPlan = async (plan) => {
    try {
      setPlanDetailsLoading(true);
      const token = localStorage.getItem('authToken');

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Create the exact body structure as required by the API
      // Send plan as an object (not an array)
      const requestBody = {
        plan: plan   // <-- send object, not [plan]
      };

      console.log('Sending to /segment/bind-items (object):', JSON.stringify(requestBody, null, 2));


      const response = await fetch(`${API_BASE_URL}/segment/detail`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('API Response:', result);

      if (result.error === false) {
        return result.data || result;
      } else {
        throw new Error(result.message || 'Failed to bind items to plan');
      }
    } catch (error) {
      console.error('Error binding items to plan:', error);
      throw error;
    } finally {
      setPlanDetailsLoading(false);
    }
  };
  // NEW: Handler for viewing detailed plan
  const handleViewDetailedPlan = async (segmentId, planIndex) => {
    const detailKey = `${segmentId}-${planIndex}`;

    try {
      const segment = segments.find(s => s.id === segmentId);
      if (!segment || !segment.plan) {
        console.error('Plan not found for segment:', segmentId);
        return;
      }

      const plans = Array.isArray(segment.plan) ? segment.plan : [segment.plan];
      if (!plans[planIndex]) {
        console.error('Plan not found at index:', planIndex);
        return;
      }

      const plan = plans[planIndex];
      const detailedPlan = await bindItemsToPlan(plan);

      setDetailedPlanView(prev => ({
        ...prev,
        [detailKey]: detailedPlan
      }));


      setExpandedCategoriesBySegment({});


      return detailedPlan;
    } catch (error) {
      console.error(`Failed to load plan details for ${segmentId}-${planIndex}:`, error);
      setDetailedPlanView(prev => ({
        ...prev,
        [detailKey]: { error: error.message }
      }));
      throw error;
    }
  };
  const getAllowedUnits = (itemName) => {
    return ['Grams', 'Kg', 'Ml', 'L', 'Pcs'];
  };

  const fetchSegments = async () => {
    try {
      setSegmentsLoading(true);


      const token = localStorage.getItem('authToken');

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch(`${API_BASE_URL}/segment`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error === false) {
        setSegments(result.data || []);
        console.log('Segments fetched successfully:', result.data);
      }
    } catch (error) {
      console.error('Error fetching segments:', error);
    } finally {
      setSegmentsLoading(false);
    }
  };

  // Fetch Eater Types
  const fetchEaterTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/master/eater-type`, {
        headers: {
          'Authorization': localStorage.getItem('authToken')
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.error === false && Array.isArray(result.data)) {
          setEaterTypes(result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching eater types:', err);
    }
  };

  // Fetch Eater Roles  

  const fetchSegmentData = async (category, diet) => {
    try {
      setLoading(true);


      const token = localStorage.getItem('authToken');

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch(`${API_BASE_URL}/segment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: category,
          diet: diet
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching segment data:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };
  const handleSavePlan = async (plan) => {
    const user = userInfoList[selectedUserIndex];

    console.log('User object:', user);
    console.log('User segment ID:', user.segmentId);

    if (!user.segmentId) {
      alert('No segment ID found for this user. Please recreate the user.');
      return;
    }

    // Validate segment ID is a valid number or string
    if (user.segmentId === null || user.segmentId === undefined || user.segmentId === '') {
      alert('Invalid segment ID. Please recreate the user.');
      return;
    }

    const planType = plan.formType === 'per-day' ? 'Day' : plan.formType === 'per-week' ? 'Week' : 'Month';
    let planData;

    if (plan.formType === 'per-week') {
      // Keep existing weekly structure
      planData = {
        name: `Week Plan`,
        type: 'Week'
      };

      plan.items.forEach(item => {
        const groceryItem = groceryItems.find(g => g.name === item.name);
        if (groceryItem) {
          planData[groceryItem.id] = Number(item.quantity)
            || 0;
        }
      });
    } else {
      // New structure for Day/Month
      const itemsObj = {};

      plan.items.forEach(item => {
        const groceryItem = groceryItems.find(g => g.name === item.name);
        if (groceryItem) {
          itemsObj[groceryItem.id] = item.quantity.toString();

        }
      });

      planData = {
        name: `${planType} Plan`,
        [planType]: itemsObj,
        type: planType
      };
    }

    // Add days if it's a weekly plan
    if (plan.formType === 'per-week' && plan.days) {
      planData.days = plan.days;
    }

    console.log('Final plan data to send:', planData);

    try {
      const result = await savePlanToSegment(user.segmentId, planData);

      // Update local state only if API call was successful
      const updatedList = [...userInfoList];
      updatedList[selectedUserIndex].plans.push({
        ...plan,
        userType: user.type,
        role: user.role,
        dietType: user.dietType,
        apiResponse: result
      });
      setUserInfoList(updatedList);

      // Refresh segments to show updated plans
      fetchSegments();

      setSuccessMessage('Plan saved successfully!');
      await fetchSegments();
    } catch (error) {
      console.error('Failed to save plan:', error);
      setSuccessMessage(`Failed to save plan: ${error.message}`);
    }
  }; const segmentHasPlans = (segment) => {
    if (!segment || !segment.plan) return false;

    // Case 1: plan is an array
    if (Array.isArray(segment.plan)) {
      return segment.plan.length > 0;
    }

    // Case 2: nested array inside plan.plan
    if (segment.plan.plan && Array.isArray(segment.plan.plan)) {
      return segment.plan.plan.length > 0;
    }

    // Case 3: plan is an object (type-based or daily/weekly/monthly/daily only)
    if (typeof segment.plan === "object") {
      const keys = Object.keys(segment.plan);
      if (keys.length === 0) return false;

      // If type is present, it's a plan
      if (segment.plan.type) return true;

      // Otherwise check if any sub-key has data
      return keys.some((k) => {
        const v = segment.plan[k];
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === "object") return Object.keys(v).length > 0;
        return Boolean(v);
      });
    }

    return false;
  };

  const getSegmentPlans = (segment) => {
    if (!segment || !segment.plan) return [];

    // Case 1: array directly
    if (Array.isArray(segment.plan)) return segment.plan;

    // Case 2: nested array
    if (segment.plan.plan && Array.isArray(segment.plan.plan)) return segment.plan.plan;

    // Case 3: object -> wrap in array so UI can iterate
    if (typeof segment.plan === "object" && Object.keys(segment.plan).length > 0) {
      return [segment.plan];
    }

    return [];
  };


  const savePlanToSegment = async (segmentId, planData) => {
    try {
      setLoading(true);


      const token = localStorage.getItem('authToken');

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // IMPORTANT: Wrap planData array in a "plan" property
      const requestBody = {
        plan: planData  // This creates {"plan": [planData]}
      };

      // Debug logging
      console.log('=== API Call Debug Info ===');
      console.log('Segment ID:', segmentId);
      console.log('Original Plan Data:', JSON.stringify(planData, null, 2));
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));
      console.log('API URL:', `${API_BASE_URL}/segment/${segmentId}/plan`);

      const response = await fetch(`${API_BASE_URL}/segment/${segmentId}/plan`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody) // Send {"plan": [planData]}
      });

      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);

      // Get response body regardless of status
      let responseBody;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }

      console.log('Response body:', responseBody);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }

        let errorMessage = `API Error: ${response.status} - ${response.statusText}`;

        if (typeof responseBody === 'object' && responseBody.message) {
          errorMessage += ` - ${responseBody.message}`;
        } else if (typeof responseBody === 'string') {
          errorMessage += ` - ${responseBody}`;
        }

        throw new Error(errorMessage);
      }

      console.log('✅ Plan saved successfully');
      return responseBody;
    } catch (error) {
      console.error('❌ Error saving plan:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const handleUserCreation = async (customInputs = null) => {
    const inputs = customInputs || formInputs;

    const { type, subType, dietType } = inputs;

    const isSubTypeRequired = selectedEaterType && selectedEaterType.sub && selectedEaterType.sub.length > 0;

    if (!type || !dietType || (isSubTypeRequired && !subType)) {
      alert('Please fill all required fields');
      return;
    }

    const dietMapping = {
      'veg': 'Vegetarian',
      'non-veg': 'Non-Vegetarian'
    };

    const categoryForAPI = subType ? `${type} - ${subType}` : type;
    const segmentData = await fetchSegmentData(categoryForAPI, dietMapping[dietType]);

    if (!segmentData) return;

    const matchingSegment = segments.find(segment =>
      segment.category === categoryForAPI &&
      segment.diet === dietMapping[dietType]
    );

    let segmentId = null;
    if (matchingSegment) {
      segmentId = matchingSegment.id;
      console.log('Found matching segment ID:', segmentId);
    }

    const newUser = {
      ...inputs,
      plans: [],
      segmentData,
      segmentId,
      matchingSegment
    };

    console.log('Created user with segment ID:', segmentId);
    setUserInfoList(prev => [...prev, newUser]);

    await fetchSegments();

    // ✅ Wait for the DOM to re-render
    requestAnimationFrame(() => {
      setNewlyCreatedSegmentId(segmentId);
    });



    if (!customInputs) {
      setFormInputs({ type: '', subType: '', dietType: '' });
    }

  };

  const [successMessage, setSuccessMessage] = useState('');

  const handleSaveSegmentPlan = async (planData) => {
    const segment = segments.find(
      (s) => s.id === (editingSegmentId || expandedSegmentForPlan)
    );
    if (!segment) {
      alert("No segment selected");
      return;
    }

    let segmentPlanData;

    // 🟢 NEW FLOW: weekly + monthly combined
    if (planData?.plan) {
      // Directly forward the plan as-is (daily, weekly, monthly only)
      segmentPlanData = planData.plan;
    }
    // 🟠 OLD FLOWS (keep as fallback so older plans still work)
    else if (
      planData.formType === "per-week" ||
      planData.type === "Week" ||
      planData["1x"] ||
      planData["2x"] ||
      planData.weeklyPlanGroups
    ) {
      if (planData["1x"] || planData["2x"]) {
        segmentPlanData = {
          type: "Week",
          "1x": planData["1x"] || {},
          "2x": planData["2x"] || {},
        };
      } else if (planData.weeklyPlanGroups) {
        const freqObj = {};
        (planData.weeklyPlanGroups || []).forEach((group) => {
          (group.days || []).forEach((day) => {
            const dayKey = day.toLowerCase();
            const dayItems = {};
            (group.items || []).forEach((item) => {
              const groceryItem = groceryItems.find((g) => g.name === item.name);
              if (groceryItem && item.quantity) {
                dayItems[groceryItem.id] = item.quantity.toString();
              }
            });
            freqObj[dayKey] = { ...(freqObj[dayKey] || {}), ...dayItems };
          });
        });
        segmentPlanData = { type: "Week", "1x": freqObj, "2x": {} };
      }
    } else if (Array.isArray(planData) && planData[0]?.type === "Day") {
      segmentPlanData = planData[0];
    } else if (planData.formType === "per-month") {
      const itemsObj = {};
      (planData.items || []).forEach((item) => {
        const groceryItem = groceryItems.find((g) => g.name === item.name);
        if (groceryItem && item.quantity) {
          itemsObj[groceryItem.id] = item.quantity.toString();
        }
      });
      segmentPlanData = { type: "Month", month: itemsObj };
    } else {
      const itemsObj = {};
      (planData.items || []).forEach((item) => {
        const groceryItem = groceryItems.find((g) => g.name === item.name);
        if (groceryItem && item.quantity) {
          itemsObj[groceryItem.id] = item.quantity.toString();
        }
      });
      segmentPlanData = { type: "Day", day: itemsObj };
    }

    console.log("📤 Final plan data to send for segment:", segmentPlanData);

    try {
      const result = await savePlanToSegment(segment.id, segmentPlanData);

      if (editingPlan) {
        setSuccessMessage(`Plan updated successfully for ${segment.category}`);
      } else {
        setSuccessMessage(`Plan saved successfully for ${segment.category}`);
      }

      setTimeout(() => setSuccessMessage(""), 4000);

      // Reset edit state
      setEditingPlan(null);
      setEditingSegmentId(null);
      setEditingPlanIndex(null);

      await fetchSegments();

      // Collapse after save
      setExpandedSegment(null);
      setExpandedSegmentForPlan(null);
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Optional: reopen saved plan for view
      setTimeout(() => {
        const updatedSegment = segments.find((s) => s.id === segment.id);
        if (updatedSegment && segmentHasPlans(updatedSegment)) {
          const plans = getSegmentPlans(updatedSegment);
          plans.forEach((plan, planIndex) => {
            handleViewDetailedPlan(segment.id, planIndex);
          });
        }
      }, 200);
    } catch (error) {
      console.error("❌ Failed to save segment plan:", error);
    }
  };


  const handleViewPlan = (userIndex) => {
    setExpandedUserIndex(expandedUserIndex === userIndex ? null : userIndex);
  };

  const toggleSegmentExpansion = async (segmentId) => {
    const isExpanding = expandedSegment !== segmentId;

    if (isExpanding) {
      // Expanding - load plan details
      setExpandedSegment(segmentId);

      const segment = segments.find(s => s.id === segmentId);
      if (segment && segmentHasPlans(segment)) {
        const plans = getSegmentPlans(segment);
        if (plans.length > 0) {
          // Add loading state for this segment
          setSegmentDetailsLoading(prev => new Set([...prev, segmentId]));

          try {
            // Load all plans for this segment
            await Promise.all(
              plans.map((plan, planIndex) => handleViewDetailedPlan(segmentId, planIndex))
            );
          } catch (error) {
            console.error('Error loading plan details:', error);
          } finally {
            // Remove loading state for this segment
            setSegmentDetailsLoading(prev => {
              const newSet = new Set(prev);
              newSet.delete(segmentId);
              return newSet;
            });
          }
        }
      }
    } else {
      // Collapsing - clear the expansion
      setExpandedSegment(null);
    }
  };


  // ADD THESE MISSING FUNCTIONS:
  const handleRetry = () => {
    fetchSegments();
  };

  // Component to display detailed plan with item names
  const DetailedPlanView = ({ segmentId, planIndex, plan }) => {
    const detailKey = `${segmentId}-${planIndex}`;
    const detailedPlan = detailedPlanView[detailKey];
    const isSegmentLoading = segmentDetailsLoading.has(segmentId);

    // Show loading state
    if (isSegmentLoading && !detailedPlan) {
      return (
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          Loading plan details...
        </div>
      );
    }

    // Show error state
    if (detailedPlan && detailedPlan.error) {
      return (
        <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
          Error: {detailedPlan.error}
          <button
            onClick={() => handleViewDetailedPlan(segmentId, planIndex)}
            className="ml-2 text-blue-500 underline"
          >
            Retry
          </button>
        </div>
      );
    }

    // Show no data state
    if (!detailedPlan) {
      return (
        <div className="text-sm text-gray-500">
          No plan details available
          <button
            onClick={() => handleViewDetailedPlan(segmentId, planIndex)}
            className="ml-2 text-blue-500 underline"
          >
            Load Details
          </button>
        </div>
      );
    }

    // Extract the plan from the API response
    const planData = detailedPlan?.data?.plan || detailedPlan?.plan || null;


    if (!planData)
      return <div className="text-sm text-red-500">No plan data found</div>;

    return (
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-8">
        {/* ✅ DAILY PLAN */}
        {planData?.daily && (
          <div>
            <h3 className="text-xl font-semibold text-blue-700 mb-3">
              📅 Daily Plan
            </h3>
            {Object.entries(planData.daily).map(([meal, mealObj], i) => (
              <div key={meal} className="mb-5">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  {i + 1}. {meal.charAt(0).toUpperCase() + meal.slice(1)}
                </h4>
                <div className="bg-gray-50 rounded-lg border p-2">
                  {Object.entries(mealObj).map(([category, items]) => (
                    <div key={category} className="mb-3">
                      <h6 className="font-semibold text-sm text-gray-700">
                        {category === "food"
                          ? "Grocery"
                          : category === "dailie"
                            ? "Veg/Meat/Dairy"
                            : category === "housekeeping"
                              ? "Housekeeping"
                              : category}
                      </h6>
                      <ul className="divide-y divide-gray-200">
                        {Object.entries(items).map(([itemName, details], idx) => (
                          <li
                            key={itemName}
                            className="flex justify-between items-center px-4 py-2 text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-gray-500 w-6 text-right">
                                {idx + 1}.
                              </span>
                              <span className="font-medium text-gray-800">
                                {itemName}
                              </span>
                            </div>
                            <span className="text-gray-700 font-semibold">
                              {details.qty} {details.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}  

        {/* ✅ WEEKLY PLAN */}
        {planData?.weekly && (
          <div>
            <h3 className="text-xl font-semibold text-green-700 mb-3">
              🗓 Weekly Plan
            </h3>
            {Object.entries(planData.weekly).map(([day, meals]) => (
              <details key={day} className="mb-4 border rounded-lg">
                <summary className="px-4 py-2 font-bold cursor-pointer bg-green-50 text-green-900 hover:bg-green-100 rounded-t-lg">
                  {day}
                </summary>
                <div className="p-3 space-y-3">
                  {Object.entries(meals).map(([meal, mealObj]) => (
                    <div
                      key={meal}
                      className="border rounded-md bg-white shadow-sm"
                    >
                      <h5 className="px-3 py-2 text-sm font-semibold bg-gray-100 rounded-t-md">
                        {meal.charAt(0).toUpperCase() + meal.slice(1)}
                      </h5>
                      {Object.entries(mealObj).map(([category, items]) => (
                        <div key={category} className="mb-3">
                          <h6 className="font-semibold text-sm text-gray-700 px-3 py-1">
                            {category === "food"
                              ? "Grocery"
                              : category === "dailie"
                                ? "Veg/Meat/Dairy"
                                : category === "housekeeping"
                                  ? "Housekeeping"
                                  : category}
                          </h6>
                          <ul className="divide-y divide-gray-200">
                            {Object.entries(items).map(
                              ([itemName, details], idx) => (
                                <li
                                  key={itemName}
                                  className="flex justify-between items-center px-4 py-2 text-sm"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-500 w-6 text-right">
                                      {idx + 1}.
                                    </span>
                                    <span className="font-medium text-gray-800">
                                      {itemName}
                                    </span>
                                  </div>
                                  <span className="text-gray-700 font-semibold">
                                    {details.qty} {details.unit}
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}

        {/* ✅ MONTHLY PLAN */}
        {planData?.monthly && (
          <div>
            <h3 className="text-xl font-semibold text-purple-700 mb-3">
              📆 Monthly Plan
            </h3>
            {Object.entries(planData.monthly).map(([date, mealObj]) => (
              <details key={date} className="mb-4 border rounded-lg">
                <summary className="px-4 py-2 font-bold cursor-pointer bg-purple-50 text-purple-900 hover:bg-purple-100 rounded-t-lg">
                  Day {date}
                </summary>
                <div className="p-3 space-y-3 bg-white">
                  {Object.entries(mealObj).map(([category, items]) => (
                    <div key={category} className="mb-3">
                      <h6 className="font-semibold text-sm text-gray-700 px-3 py-1">
                        {category === "food"
                          ? "Grocery"
                          : category === "dailie"
                            ? "Veg/Meat/Dairy"
                            : category === "housekeeping"
                              ? "Housekeeping"
                              : category}
                      </h6>
                      <ul className="divide-y divide-gray-200">
                        {Object.entries(items).map(([itemName, details], idx) => (
                          <li
                            key={itemName}
                            className="flex justify-between items-center px-4 py-2 text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-gray-500 w-6 text-right">
                                {idx + 1}.
                              </span>
                              <span className="font-medium text-gray-800">
                                {itemName}
                              </span>
                            </div>
                            <span className="text-gray-700 font-semibold">
                              {details.qty} {details.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    );
  };

  const dietTypes = ['Veg', 'Non-Veg'];
  const [allCombinations, setAllCombinations] = useState([]);

  useEffect(() => {
    const dietTypes = ['Veg', 'Non-Veg'];
    const combinations = [];

    eaterTypes.forEach((eater) => {
      const eaterType = eater.name;
      const subTypes = Array.isArray(eater.sub) && eater.sub.length > 0 ? eater.sub : [''];

      subTypes.forEach((sub) => {
        dietTypes.forEach((diet) => {
          combinations.push({
            eaterType,
            subType: sub,
            dietType: diet
          });
        });
      });
    });

    setAllCombinations(combinations);
  }, [eaterTypes]);


  useEffect(() => {
    const combinations = [];

    eaterTypes.forEach((eater) => {
      const eaterType = eater.name;
      const hasSubTypes = Array.isArray(eater.sub) && eater.sub.length > 0;

      const subTypes = hasSubTypes ? eater.sub : [''];

      subTypes.forEach((sub) => {
        ['Veg', 'Non-Veg'].forEach((diet) => {
          combinations.push({
            eaterType,
            subType: sub,
            dietType: diet
          });
        });
      });
    });

  }, [eaterTypes]);
  useEffect(() => {
    if (newlyCreatedSegmentId && newlyCreatedRef.current) {
      newlyCreatedRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setNewlyCreatedSegmentId(null); // Reset after scroll
    }
  }, [newlyCreatedSegmentId]);

  const handleDeleteSegment = async (segmentId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this segment and its plans?');
    if (!confirmDelete) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const response = await fetch(`${API_BASE_URL}/segment/${segmentId}/plan`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: [] }), // ❗ empty array to delete
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.message || 'Failed to delete segment');
      }

      // Refresh the segments list
      fetchSegments();
      setSuccessMessage('Segment deleted successfully!');
    } catch (error) {
      console.error('Failed to delete segment:', error);
      alert(`Failed to delete segment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const [expandedCategoriesBySegment, setExpandedCategoriesBySegment] = useState({});


  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {successMessage && (
        <div className="mb-3 px-4 py-2 bg-green-100 text-green-800 rounded text-sm font-medium">
          {successMessage}
        </div>
      )}
      {/* 
      <div className="bg-sky-50 p-4 rounded shadow mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm text-gray-700">User Type</label>
          <select
            name="type"
            value={formInputs.type}
            onChange={(e) => {
              setFormInputs({ ...formInputs, type: e.target.value, subType: '' });
            }}
            className="w-full border px-3 py-2 rounded"
            disabled={loading}
          >
            <option value="">Select User Type</option>
            {eaterTypes.map((type) => (
              <option key={type.id} value={type.name}>{type.name}</option>
            ))}
          </select>
        </div>

        {selectedEaterType && selectedEaterType.sub && selectedEaterType.sub.length > 0 && (
          <div className="flex-1">
            <label className="block text-sm text-gray-700">Sub Type</label>
            <select
              name="subType"
              value={formInputs.subType}
              onChange={(e) => setFormInputs({ ...formInputs, subType: e.target.value })}
              className="w-full border px-3 py-2 rounded"
              disabled={loading}
            >
              <option value="">Select Sub Type</option>
              {selectedEaterType.sub.map((subType, index) => (
                <option key={index} value={subType}>{subType}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1">
          <label className="block text-sm text-gray-700">Diet Type</label>
          <select
            name="dietType"
            value={formInputs.dietType}
            onChange={handleInputChange}
            className="w-full border px-3 py-2 rounded"
            disabled={loading}
          >
            <option value="">Select</option>
            <option value="veg">Vegetarian</option>
            <option value="non-veg">Non-Vegetarian</option>
          </select>
        </div>
        <button
          onClick={handleUserCreation}
          disabled={loading}
          className={`px-4 py-2 rounded text-white flex items-center space-x-2 ${loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
            }`}
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          <span>{loading ? 'Creating...' : 'Create'}</span>
        </button>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allCombinations.map((combo, index) => (
          <div
            key={index}
            className="border border-gray-300 rounded-lg shadow-sm bg-white px-4 py-2 flex items-center justify-between gap-4 w-full max-w-3xl"
          >
            {/* Info Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700 font-semibold">
              <span>{combo.eaterType}</span>
              {combo.subType && <span>{combo.subType}</span>}

              <span>{combo.dietType}</span>
            </div>

            {/* Create Button */}
            {/* Create Button */}
            {combinationExists(combo) ? (
              <span className="bg-gray-400 text-white px-4 py-1.5 text-sm rounded-md font-medium">
                Exists
              </span>
            ) : (
              <button
                onClick={() =>
                  handleUserCreation({
                    type: combo.eaterType,
                    subType: combo.subType,
                    dietType: combo.dietType.toLowerCase().replace(' ', '-')
                  })
                }
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 text-sm rounded-md font-medium"
              >
                Create
              </button>
            )}
          </div>

        ))}
      </div>




      {segments.length > 0 && (
        <div className="bg-white rounded shadow mb-6 p-4 mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Available Segments & Their Plans</h2>
          <div className="space-y-3">
            {segments.map((segment) => (
              <div key={segment.id}
                ref={segment.id === newlyCreatedSegmentId ? newlyCreatedRef : null}
                className="border border-gray-200 rounded-lg">
                <div
                  className="w-full bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center border-b"
                  onClick={() => toggleSegmentExpansion(segment.id)}
                >
                  {/* Left Info Pills */}
                  <div className="space-y-2 sm:space-y-0 sm:space-x-4 text-sm flex flex-col sm:flex-row sm:items-center">
                    <span className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full font-medium">
                      {segment.category}
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full font-medium 
  bg-green-100 text-gray-800">
                      <span className={`w-4 h-4 flex items-center justify-center border-2 rounded-sm bg-white
    ${segment.diet === 'Vegetarian' ? 'border-green-600' : 'border-red-600'}`}>
                        <span className={`w-2 h-2 rounded-full 
      ${segment.diet === 'Vegetarian' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                      </span>
                      {segment.diet}
                    </span>

                    {/* {segment.plan?.[0] && (() => {
                      const plan = segment.plan[0];
                      const planType = plan.type;
                      const planData = plan[planType];

                      // For Week type, count the number of valid day entries (excluding "type")
                      const count = planType === 'Week'
                        ? Object.keys(plan)
                          .filter(key => key !== 'type' && typeof plan[key] === 'object' && plan[key] !== null)
                          .length
                        : Object.keys(planData || {}).length;

                      return (
                        <span className="bg-orange-100 text-orange-800 px-4 py-1 rounded-full font-medium inline-flex items-center gap-2">
                          {planType}
                          <span className="bg-orange-200 text-orange-900 px-2 py-0.5 rounded-full text-xs font-semibold">
                            {count}
                          </span>
                        </span>
                      );
                    })()} */}

                  </div>

                  {/* Right Action Buttons */}
                  <div className="mt-3 sm:mt-0 flex items-center gap-3">
                    {segmentHasPlans(segment) ? (
                      <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold">
                        ✅ Plan Exists
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedSegmentForPlan(
                            expandedSegmentForPlan === segment.id ? null : segment.id
                          );
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-1 rounded-full transition"
                      >
                        {expandedSegmentForPlan === segment.id ? 'Cancel' : 'Add Plan'}
                      </button>

                    )}

                    {/* 🔴 Red Trash Icon (SVG) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSegment(segment.id);
                      }}
                      className="text-red-600 hover:text-red-800"
                      title="Delete Segment"
                    >
                      <Trash2 size={20} />
                    </button>


                    <span className="text-gray-500 text-lg">
                      {expandedSegment === segment.id ? '🔽' : '▶'}
                    </span>
                  </div>
                </div>


                {expandedSegment === segment.id && segmentHasPlans(segment) && (
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <h4 className="font-medium text-gray-800 mb-3 text-base">Existing Plans:</h4>
                    {getSegmentPlans(segment).map((plan, planIndex) => {
                      const detailKey = `${segment.id}-${planIndex}`;
                      const isDetailedViewOpen = detailedPlanView[detailKey];

                      return (
                        <div key={planIndex} className="mb-4 last:mb-0">
                          <div className="bg-blue-50 p-3 rounded">
                            <div className="flex justify-between items-start mb-2">
                              <div>

                              </div>
                              {planDetailsLoading && (
                                <span className="text-gray-400 text-base">⟳</span>
                              )}
                            </div>

                            <div className="mt-3">
                              {isDetailedViewOpen ? (
                                <div>
                                  {plan.type === "Combined" ? (
                                    <PlanDisplay planData={[plan]} groceryItems={groceryItems} />
                                  ) : (
                                    <DetailedPlanView
                                      segmentId={segment.id}
                                      planIndex={planIndex}
                                      plan={plan}
                                    />
                                  )}

                                  <div className="mt-2 flex justify-end">
                                    <button
                                      onClick={() => handleEditPlan(segment.id, planIndex)}
                                      className="text-base bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 font-medium"
                                    >
                                      Edit Plan
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-base text-gray-500">Loading plan details...</div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {expandedSegment === segment.id && !segmentHasPlans(segment) && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-base text-gray-500 italic">No plans created for this segment yet.</p>
                  </div>
                )}

                {expandedSegmentForPlan === segment.id && (
                  <div className="p-4 border-t-2 border-blue-200 bg-blue-50">
                    <h4 className="font-medium text-blue-800 mb-3 text-base">
                      {editingPlan ? 'Edit Diet Plan' : 'Create New Diet Plan'}
                    </h4>
                    <InlineSegmentDietPlannerForm
                      segment={segment}
                      onSavePlan={(plan) => {
                        handleSaveSegmentPlan(plan);
                        setExpandedSegmentForPlan(null);
                      }}
                      onCancel={() => {
                        setExpandedSegmentForPlan(null);
                        setEditingPlan(null);
                        setEditingSegmentId(null);
                        setEditingPlanIndex(null);
                      }}
                      loading={loading}
                      groceryItems={groceryItems}
                      getAllowedUnits={getAllowedUnits}
                      editingPlan={editingPlan}
                      isEditing={!!editingPlan}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}


      {showModal && selectedUserIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Create Diet Plan</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-800 text-xl"
              >
                ×
              </button>
            </div>
            <DietPlannerForm
              userInfo={userInfoList[selectedUserIndex]}
              onSavePlan={(plan) => {
                handleSavePlan(plan);
                setShowModal(false);
              }}
              loading={loading}
              groceryItems={groceryItems}
              getAllowedUnits={getAllowedUnits}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const PlanDisplay = ({ planData, groceryItems }) => {

  const [expandedDays, setExpandedDays] = useState({});
  const [expandedDates, setExpandedDates] = useState({});
  if (!planData || planData.length === 0) return <p>No plan available</p>;

  const plan = planData[0]; // always array

  const toggleDay = (day) => {
    setExpandedDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const toggleDate = (date) => {
    setExpandedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const getItemDetails = (id, qty) => {
    const gItem = groceryItems.find((g) => g.id.toString() === id.toString());
    return gItem
      ? `${gItem.name} - ${qty} ${gItem.resident || gItem.indent || ""}`
      : `Item ${id} - ${qty}`;
  };

  return (
    <div className="space-y-6">
      {/* WEEKLY */}
      {plan.weekly && (
        <div>
          <h2 className="text-lg font-bold mb-3 text-blue-700">Weekly Plan</h2>
          {Object.entries(plan.weekly).map(([day, meals]) => (
            <div
              key={day}
              className="mb-2 border rounded p-3 bg-gray-50 cursor-pointer"
              onClick={() => toggleDay(day)}
            >
              <h3 className="font-semibold text-green-700 flex justify-between items-center">
                {day}
                <span className="text-gray-500 text-sm">
                  {expandedDays[day] ? "▲" : "▼"}
                </span>
              </h3>

              {expandedDays[day] && (
                <div className="mt-2 ml-4">
                  {Object.entries(meals).map(([mealType, mealData]) => (
                    <div key={mealType} className="mb-2">
                      <h4 className="font-medium">{mealType}</h4>
                      <ul className="list-disc ml-6 text-sm text-gray-700">
                        {Object.entries(mealData.items || {}).map(([id, qty]) => (
                          <li key={id}>{getItemDetails(id, qty)}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MONTHLY */}
      {plan.monthly && (
        <div>
          <h2 className="text-lg font-bold mb-3 text-purple-700">Monthly Plan</h2>
          {Object.entries(plan.monthly).map(([date, dayData]) => (
            <div
              key={date}
              className="mb-2 border rounded p-3 bg-gray-50 cursor-pointer"
              onClick={() => toggleDate(date)}
            >
              <h3 className="font-semibold flex justify-between items-center">
                Date: {date}
                <span className="text-gray-500 text-sm">
                  {expandedDates[date] ? "▲" : "▼"}
                </span>
              </h3>

              {expandedDates[date] && (
                <div className="mt-2 ml-4">
                  <ul className="list-disc ml-6 text-sm text-gray-700">
                    {Object.entries(dayData.items || {}).map(([id, qty]) => (
                      <li key={id}>{getItemDetails(id, qty)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PlanDetails = ({ plan, segmentData }) => {
  return (
    <div>
      <div className="mb-3">
        <h3 className="font-semibold text-lg">{plan.userType} - {plan.role} ({plan.dietType})</h3>
        <p className="text-sm text-gray-700">Plan Frequency: {plan.formType}</p>
        {plan.days && plan.days.length > 0 && (
          <p className="text-sm text-gray-700">Days: {plan.days.join(', ')}</p>
        )}
        {plan.apiResponse && (
          <p className="text-xs text-green-600 mt-1">✓ Saved to server successfully</p>
        )}
      </div>

      <div className="mt-4">
        <h4 className="font-medium text-gray-800 mb-2">Items Required:</h4>
        <div className="overflow-hidden rounded border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plan.items.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SegmentDietPlannerForm = ({ segment, onSavePlan, loading, groceryItems, getAllowedUnits }) => {
  const [formType, setFormType] = useState('per-day');
  const [items, setItems] = useState([{ name: '', category: '', quantity: '', unit: 'Grams' }]);
  const [days, setDays] = useState([]);

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...items];
    newItems[index][name] = value;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { name: '', category: '', quantity: '', unit: 'Grams' }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const toggleDay = (day) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    if (items.some(item => !item.name || !item.quantity)) {
      alert('Please fill all item fields');
      return;
    }
    if (formType === 'per-week' && days.length === 0) {
      alert('Select at least one day');
      return;
    }

    // Validate quantities are numbers
    if (items.some(item => isNaN(Number(item.quantity)) || Number(item.quantity) <= 0)) {
      alert('Please enter valid quantities (numbers greater than 0)');
      return;
    }


    const plan = { formType, items, ...(formType === 'per-week' && { days }) };
    onSavePlan(plan);
    setItems([{ name: '', quantity: '', unit: 'Grams' }]);
    setDays([]);
  };

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Plan Type</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="per-day"
              checked={formType === 'per-day'}
              onChange={() => setFormType('per-day')}
              disabled={loading}
            />
            Per Day
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="per-week"
              checked={formType === 'per-week'}
              onChange={() => setFormType('per-week')}
              disabled={loading}
            />
            Per Week
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="per-month"
              checked={formType === 'per-month'}
              onChange={() => setFormType('per-month')}
              disabled={loading}
            />
            Per Month
          </label>
        </div>
      </div>

      {formType === 'per-week' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Days</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {allDays.map((day) => (
              <label key={day} className="flex items-center">
                <input
                  type="checkbox"
                  checked={days.includes(day)}
                  onChange={() => toggleDay(day)}
                  className="mr-2"
                  disabled={loading}
                />
                {day}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Items Required per Person</label>
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 mb-2 text-sm">
            <select
              name="name"
              value={item.name}
              onChange={(e) => handleItemChange(index, e)}
              className="border p-2 rounded w-[340px] h-9"

              disabled={loading}
            >
              <option value="">Select item</option>
              {groceryItems
                .filter((option) => {
                  if (!item.category) return true;

                  if (item.category === "Veg/Meat/Dairy") {
                    return ["veg", "meat", "dairy", "dailie"].includes(option.category?.toLowerCase());
                  }

                  // 💡 Map "Ration" to "food" for matching
                  const actualCategory = item.category === 'Ration' ? 'food' : item.category?.toLowerCase();
                  return option.category?.toLowerCase() === actualCategory;
                })

                .sort((a, b) => a.name.localeCompare(b.name))
                .map((option) => (
                  <option key={option.id} value={option.name}>
                    {option.name}
                  </option>
                ))
              }


            </select>
            <input
              type="number"
              name="quantity"
              value={item.quantity}
              onChange={(e) => handleItemChange(index, e)}
              placeholder="Qty"
              className="w-1/4 border px-2 py-1 rounded"
              min="1"
              disabled={loading}
            />
            <select
              name="unit"
              value={item.unit}
              onChange={(e) => handleItemChange(index, e)}
              className="w-1/4 border px-2 py-1 rounded"
              disabled={loading}
            >
              {getAllowedUnits(item.name).map(unitOption => (
                <option key={unitOption} value={unitOption}>
                  {unitOption === 'Grams' ? 'Grams' :
                    unitOption === 'Ml' ? 'Ml' :
                      unitOption === 'Pcs' ? 'Pcs' :
                        unitOption === 'Kg' ? 'Kg' :
                          unitOption === 'Liter' ? 'Liter' : unitOption}


                </option>
              ))}
            </select>
            {index > 0 && (
              <button
                onClick={() => removeItem(index)}
                className="bg-red-500 text-white px-2 rounded hover:bg-red-600 disabled:opacity-50"
                disabled={loading}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addItem}
          className="mt-2 bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={loading}
        >
          Add Item
        </button>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={() => {
            setItems([{ name: '', quantity: '', unit: 'Grams' }]);
            setDays([]);
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
          disabled={loading}
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          disabled={loading}
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          <span>{loading ? 'Saving...' : 'Create Plan'}</span>
        </button>
      </div>
    </div>
  );
};

const DietPlannerForm = ({ userInfo, onSavePlan, loading, groceryItems, getAllowedUnits }) => {
  const [formType, setFormType] = useState('per-day');
  const [items, setItems] = useState([{ name: '', category: '', quantity: '', unit: 'Grams' }]);
  const [days, setDays] = useState([]);

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...items];
    newItems[index][name] = value;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { name: '', category: '', quantity: '', unit: 'Grams' }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const toggleDay = (day) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    if (items.some(item => !item.name || !item.quantity)) {
      alert('Please fill all item fields');
      return;
    }
    if (formType === 'per-week' && days.length === 0) {
      alert('Select at least one day');
      return;
    }

    // Validate quantities are numbers
    if (items.some(item => isNaN(Number(item.quantity)) || Number(item.quantity) <= 0)) {
      alert('Please enter valid quantities (numbers greater than 0)');
      return;
    }


    const plan = { formType, items, ...(formType === 'per-week' && { days }) };
    onSavePlan(plan);
    setItems([{ name: '', quantity: '', unit: 'Grams' }]);
    setDays([]);
  };

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div>
      {/* Display user segment data in form */}
      {userInfo.segmentData && (
        <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
          <h4 className="font-medium text-green-800 mb-2">User Segment Data:</h4>
          <p className="text-sm text-green-700">
            {userInfo.type} - {userInfo.role} ({userInfo.dietType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'})
          </p>
          <p className="text-xs text-blue-600">Segment ID: {userInfo.segmentId}</p>
          {userInfo.segmentData.error === false && (
            <p className="text-xs text-green-600 mt-1">✓ Segment data loaded successfully</p>
          )}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Plan Type</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="per-day"
              checked={formType === 'per-day'}
              onChange={() => setFormType('per-day')}
              disabled={loading}
            />
            Per Day
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="per-week"
              checked={formType === 'per-week'}
              onChange={() => setFormType('per-week')}
              disabled={loading}
            />
            Per Week
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="per-month"
              checked={formType === 'per-month'}
              onChange={() => setFormType('per-month')}
              disabled={loading}
            />
            Per Month
          </label>
        </div>
      </div>

      {formType === 'per-week' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Days</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {allDays.map((day) => (
              <label key={day} className="flex items-center">
                <input
                  type="checkbox"
                  checked={days.includes(day)}
                  onChange={() => toggleDay(day)}
                  className="mr-2"
                  disabled={loading}
                />
                {day}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Items Required per Person</label>
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 mb-2 text-sm">
            <select
              name="name"
              value={item.id || ""}
              onChange={(e) => handleItemChange(index, e)}
              className="border p-2 rounded w-[340px] h-9"

              disabled={loading}
            >
              <option value="">Select item</option>
              {groceryItems
                .filter((option) => {
                  if (!item.category) return true;

                  if (item.category === "Veg/Meat/Dairy") {
                    return ["veg", "meat", "dairy", "dailie"].includes(option.category?.toLowerCase());
                  }

                  // 💡 Map "Ration" to "food" for matching
                  const actualCategory = item.category === 'Ration' ? 'food' : item.category?.toLowerCase();
                  return option.category?.toLowerCase() === actualCategory;
                })

                .sort((a, b) => a.name.localeCompare(b.name))
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>

                ))
              }


            </select>
            <input
              type="number"
              name="quantity"
              value={item.quantity}
              onChange={(e) => handleItemChange(index, e)}
              placeholder="Qty"
              className="w-1/4 border px-2 py-1 rounded"
              min="1"
              disabled={loading}
            />
            <select
              name="unit"
              value={item.unit}
              onChange={(e) => handleItemChange(index, e)}
              className="w-1/4 border px-2 py-1 rounded"
              disabled={loading}
            >
              {getAllowedUnits(item.name).map(unitOption => (
                <option key={unitOption} value={unitOption}>
                  {unitOption === 'Grams' ? 'Grams' :
                    unitOption === 'Ml' ? 'Ml' :
                      unitOption === 'Pcs' ? 'Pcs' :
                        unitOption === 'Kg' ? 'Kg' :
                          unitOption === 'Liter' ? 'Liter' : unitOption}
                </option>
              ))}
            </select>
            {index > 0 && (
              <button
                onClick={() => removeItem(index)}
                className="bg-red-500 text-white px-2 rounded hover:bg-red-600 disabled:opacity-50"
                disabled={loading}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addItem}
          className="mt-2 bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={loading}
        >
          Add Item
        </button>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={() => {
            setItems([{ name: '', quantity: '', unit: 'Grams' }]);
            setDays([]);
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
          disabled={loading}
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          disabled={loading}
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          <span>{loading ? 'Saving...' : 'Create Plan'}</span>
        </button>
      </div>
    </div>
  );
};

export default DietPlanner;


import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useRef } from "react";

const Diet = () => {
    const [eaterTypes, setEaterTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [planType, setPlanType] = useState("");
    const [createdPlans, setCreatedPlans] = useState([]);
    const [selectedDays, setSelectedDays] = useState([]);
    const allWeekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const [allItems, setAllItems] = useState([]);
    const [segments, setSegments] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedEater, setSelectedEater] = useState(null);
    const [dietChoices, setDietChoices] = useState({ veg: false, nonVeg: false });
    const [dietChoice, setDietChoice] = useState(""); // "custom" | "both"
    const [selectedSegmentId, setSelectedSegmentId] = useState(null);
    const [segmentDetails, setSegmentDetails] = useState({});
    const [expandedSegmentId, setExpandedSegmentId] = useState(null);
    const [segmentPlanData, setSegmentPlanData] = useState({});
    const [expandedSegments, setExpandedSegments] = useState({});
    const [notification, setNotification] = useState({ show: false, message: "", type: "" });
    const [isEditMode, setIsEditMode] = useState(false);
    const segmentListRef = useRef(null);


    useEffect(() => {
        fetchEaterTypes();
        fetchItems();
        fetchSegments();
    }, []);
    const showNotification = (message, type = "success") => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: "", type: "" });
        }, 4000);
    };
    const fetchSegments = async () => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) throw new Error("Authentication required");

            const response = await fetch(
                "https://rcs-dms.onlinetn.com/api/v1//segment",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const result = await response.json();
            if (!result.error) {
                setSegments(result.data || []);
            } else {
                throw new Error(result.message || "Failed to fetch segments");
            }
        } catch (err) {
            console.error("Error fetching segments:", err);
        }
    };

    const fetchEaterTypes = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("authToken");
            if (!token) throw new Error("Authentication required");

            const response = await fetch(
                "https://rcs-dms.onlinetn.com/api/v1//master/eater-type",
                {
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                }
            );

            const result = await response.json();
            if (response.ok && !result.error) {
                setEaterTypes(result.data || []);
                setError(null);
            } else {
                throw new Error(result.message || "Failed to fetch eater types");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchItems = async () => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) throw new Error("Authentication required");

            const response = await fetch(
                "https://rcs-dms.onlinetn.com/api/v1//segment/items",
                {
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                }
            );

            const result = await response.json();
            if (!result.error) {
                setAllItems(result.data || []);
            } else {
                throw new Error(result.message || "Failed to fetch items");
            }
        } catch (err) {
            console.error("Error fetching items:", err);
        }
    };

const combinedList = Array.isArray(eaterTypes)
    ? eaterTypes.flatMap((item) =>
        Array.isArray(item.sub) && item.sub.length > 0
            ? item.sub.map((sub) => ({
                id: `${item.id}-${sub}`,
                label: `${item.name} - ${sub}`,
            }))
            : [{
                id: `${item.id}`,
                label: item.name,
            }]
    )
    : [];

    const getItemsByCategory = (category) => {
        if (category === "food") return allItems.filter((i) => i.category === "food");
        if (category === "dailie") return allItems.filter((i) => i.category === "dailie");
        if (category === "housekeeping") return allItems.filter((i) => i.category === "housekeeping");
        return [];
    };
    const handleDayToggle = (day) => {
        setSelectedDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const handleCreateWeeklyPlan = () => {
        if (selectedDays.length === 0) return;

        const newPlan = {
            type: "weekly",
            days: selectedDays,
            meals: []
        };

        setCreatedPlans((prev) => [...prev, newPlan]);
        setSelectedDays([]);
    };

    const handleCreatePlan = (type) => {
    let newPlan = { type, meals: [] };

    if (type === "monthly") {
        newPlan.monthlyInfo = {
            monthsSelected: [],
        };
    }

    // If user chooses the "month" plan, create one default items row
    // so the UI shows the items form directly (skip meal-type step).
    if (type === "month") {
        newPlan.meals = [
            {
                // We keep a placeholder type for UI compatibility.
                // This type will be ignored when building payload.
                type: "Items",
                items: [{ category: "", item: "", qty: "", unit: "Grams" }],
            },
        ];
    }

    setCreatedPlans((prev) => [...prev, newPlan]);
};


    const handleCreateSegment = async () => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) throw new Error("Authentication required");

            const payloads = [];

            if (dietChoice === "custom") {
                payloads.push({ category: selectedEater.label, diet: "Non-Vegetarian" });
            } else if (dietChoice === "both") {
                payloads.push(
                    { category: selectedEater.label, diet: "Vegetarian" },
                    { category: selectedEater.label, diet: "Non-Vegetarian" }
                );
            }

            for (const payload of payloads) {
                await fetch("https://rcs-dms.onlinetn.com/api/v1//segment", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
            }

           let lastCreatedCategory = selectedEater?.label || "";

setShowPopup(false);
setDietChoice("");
setSelectedEater(null);

fetchSegments().then(() => {
  setTimeout(() => {
    const el = document.querySelector(`[data-segment="${lastCreatedCategory}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-blue-400"); // highlight
      setTimeout(() => el.classList.remove("ring-2", "ring-blue-400"), 2000);
    }
  }, 300);
});

        } catch (err) {
            console.error("Error creating segment:", err);
        }
    };

    const handleDeletePlan = async (segmentId) => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) throw new Error("Authentication required");

            const response = await fetch(
                `https://rcs-dms.onlinetn.com/api/v1//segment/${segmentId}/plan`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ plan: [] }),
                }
            );

            const result = await response.json();
            if (!result.error) {
                fetchSegments();
            } else {
                console.error("Failed to delete plan:", result.message);
            }
        } catch (err) {
            console.error("Error deleting plan:", err);
        }
    };

    const buildPlanPayload = () => {
        const plan = {};

        createdPlans.forEach((p) => {
            if (p.type === "daily") {
                if (!plan.daily) plan.daily = {};
                p.meals.forEach((meal) => {
                    const items = {};
                    meal.items.forEach((i) => {
                        if (i.item && i.qty) {
                            items[i.item] = i.qty;
                        }
                    });
                    if (Object.keys(items).length > 0) {
                        plan.daily[meal.type] = { items };
                    }
                });
            }

            if (p.type === "weekly") {
                if (!plan.weekly) plan.weekly = {};
                p.days.forEach((day) => {
                    if (!plan.weekly[day]) plan.weekly[day] = {};
                    p.meals.forEach((meal) => {
                        const items = {};
                        meal.items.forEach((i) => {
                            if (i.item && i.qty) {
                                items[i.item] = i.qty;
                            }
                        });
                        if (Object.keys(items).length > 0) {
                            plan.weekly[day][meal.type] = { items };
                        }
                    });
                });
            }

        if (p.type === "monthly") {
                if (!plan.monthly) plan.monthly = {};
                p.datePlans?.forEach((datePlan) => {
                    const items = {};
                    datePlan.meals.forEach((meal) => {
                        meal.items.forEach((i) => {
                            if (i.item && i.qty) {
                                items[i.item] = i.qty;
                            }
                        });
                    });
                    if (Object.keys(items).length > 0) {
                        plan.monthly[datePlan.date] = { items };
                    }
                });
            }

           if (p.type === "month") {
    if (!plan.month) plan.month = {};
    // Flatten all meal items into a single 'items' map (no meal-type keys).
    const flattened = {};
    (p.meals || []).forEach((meal) => {
        (meal.items || []).forEach((i) => {
            if (i.item && i.qty) {
                // If the same item appears multiple times, this keeps the last one.
                // If you want summation behaviour instead, we can change this.
                flattened[i.item] = i.qty;
            }
        });
    });
    if (Object.keys(flattened).length > 0) {
        // Please note: this sets plan.month to { items: { itemId: qty, ... } }
        plan.month = { items: flattened };
    }
}

        });

        return { plan };
    };

const renderPlanItems = (mealData) => {
    if (!mealData || Object.keys(mealData).length === 0) return null;

    // Check if this is a "month" plan structure (has "items" key with item IDs)
 // Detect Month Plan meal structure properly
if (mealData.items || Object.values(mealData).some(v => v?.items)) {
    const itemsToRender = mealData.items
        ? Object.entries(mealData.items)
        : Object.values(mealData)
              .filter(v => v?.items)
              .flatMap(v => Object.entries(v.items));

    return (
        <div className="space-y-2">
            {itemsToRender.map(([itemId, qty], index) => {
                const foundItem = allItems.find((i) => i.id == itemId);
                return (
                    <div
                        key={itemId}
                        className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-gray-800 font-medium">
                                {index + 1}. {foundItem ? foundItem.name : `Item #${itemId}`}
                            </span>
                        </div>
                        <span className="text-gray-900 font-semibold">
                            {qty} {foundItem?.resident || ""}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}


    // Otherwise, handle daily/weekly structure (nested categories)
    return (
        <div className="space-y-4">
            {Object.entries(mealData).map(([category, items]) => (
                <div key={category} className="space-y-2">
                    <h5 className="text-sm font-semibold text-gray-600">
                        {category === "food" ? "Grocery"
                            : category === "dailie" ? "Veg/Dairy/Meat"
                                : category === "housekeeping" ? "Housekeeping"
                                    : category}
                    </h5>

                    <div className="space-y-2">
                        {Object.entries(items).map(([itemName, itemData], index) => (
                            <div key={itemName} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-800 font-medium">
                                        {index + 1}. {itemName}
                                    </span>
                                </div>
                                <span className="text-gray-900 font-semibold">
                                    {itemData.qty} {itemData.unit}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

    const handleSavePlan = async (segmentId) => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) throw new Error("Authentication required");

            const payload = buildPlanPayload();

            const response = await fetch(
                `https://rcs-dms.onlinetn.com/api/v1//segment/${segmentId}/plan`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const result = await response.json();
            if (!result.error) {
                showNotification(isEditMode ? "Segment plan updated successfully!" : "Segment plan created successfully!", "success");

                setShowForm(false);
                setCreatedPlans([]);
                setSelectedSegmentId(null);
                setExpandedSegmentId(null);  // ✅ Add this line to force UI reset

                fetchSegments();
            } else {
                showNotification("Failed to save plan: " + result.message, "error");
            }
        } catch (err) {
            showNotification("Error saving plan", "error");
            console.error("Error saving plan:", err);
        }
    };
    const fetchSegmentDetail = async (segmentId) => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) throw new Error("Authentication required");

            // If already expanded, collapse it
            if (expandedSegmentId === segmentId) {
                setExpandedSegmentId(null);
                return;
            }

            const segmentResponse = await fetch(
                `https://rcs-dms.onlinetn.com/api/v1//segment`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const segmentResult = await segmentResponse.json();
            const targetSegment = segmentResult.data.find(seg => seg.id === segmentId);

            if (!targetSegment || !targetSegment.plan) {
                alert("No plan found for this segment");
                return;
            }

            const payload = {
                segmentId,
                plan: targetSegment.plan
            };

            const response = await fetch(
                "https://rcs-dms.onlinetn.com/api/v1//segment/detail",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const result = await response.json();
if (!result.error) {

    // 🔍 DEBUG LOG — show exactly what backend sends
    console.log("BACKEND RAW PLAN:", JSON.stringify(result.data.plan, null, 2));

    // ✅ Merge all plan types safely so nothing is dropped
    const mergedPlan = {
        ...(result.data.plan?.daily ? { daily: result.data.plan.daily } : {}),
        ...(result.data.plan?.weekly ? { weekly: result.data.plan.weekly } : {}),
        ...(result.data.plan?.monthly ? { monthly: result.data.plan.monthly } : {}),
        ...(result.data.plan?.month ? { month: result.data.plan.month } : {}),
    };

    // ✅ Save merged result to state
    setSegmentPlanData(prev => ({
        ...prev,
        [segmentId]: {
            ...result.data,
            plan: mergedPlan,
        },
    }));

    setExpandedSegmentId(segmentId);

    // ✅ Log merged result
    console.log("Segment detail merged:", mergedPlan);
}else {
                console.error("API Error:", result.message);
            }
        } catch (err) {
            console.error("Error fetching segment detail:", err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow relative">
            {/* Notification */}
            {notification.show && (
                <span className={`inline-block px-4 py-2 rounded text-white font-medium mb-4 ${notification.type === "success" ? "bg-green-500" : "bg-red-500"
                    }`}>
                    {notification.message}
                </span>
            )}

            {!showForm ? (
                <>
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Eater Types</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {combinedList.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded shadow-sm"
                            >
                                <span className="text-gray-700 font-medium">{entry.label}</span>

                                {segments.some((seg) => seg.category === entry.label) ? (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded">
                                        ✅ Exists
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setSelectedEater(entry);
                                            setShowPopup(true);
                                        }}
                                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Create
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                 <div ref={segmentListRef}>
                        <h2 className="text-2xl font-bold mt-8 mb-6 text-gray-800">Segments</h2>
                        <div className="space-y-3">
                   {segments.map((seg) => {
  // Count how many segments share the same category
  const sameCategoryCount = segments.filter(
    (s) => s.category === seg.category
  ).length;

  // Show diet only if both veg and non-veg exist
  const showDiet = sameCategoryCount > 1;

  return (
    <div key={seg.id} data-segment={seg.category} className="space-y-0">
      {/* Segment Row */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 shadow-sm">
        {/* ✅ Segment Category + Diet Indicator (left side) */}
        <div className="flex items-center gap-3">
          {/* Segment Name */}
          <span className="text-sm font-semibold text-blue-800 bg-blue-50 px-4 py-1.5 rounded-lg border border-blue-200 shadow-sm">
            {seg.category}
          </span>

          {/* Diet badge — show only if both veg & non-veg exist */}
          {showDiet && (
            <span
              className={`text-sm px-4 py-1.5 rounded-lg flex items-center gap-2 font-medium border shadow-sm ${
                seg.diet === "Vegetarian"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  seg.diet === "Vegetarian" ? "bg-green-500" : "bg-red-500"
                }`}
              ></span>
              {seg.diet}
            </span>
          )}
        </div>

        {/* ✅ Action Buttons (unchanged) */}
        <div className="flex items-center gap-2">
          {seg.plan ? (
            <button
              onClick={() => fetchSegmentDetail(seg.id)}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                expandedSegmentId === seg.id
                  ? "bg-green-200 text-green-800"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              ✅ Plan Exists {expandedSegmentId === seg.id ? "▲" : "▼"}
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedSegmentId(seg.id);
                setIsEditMode(false);
                setCreatedPlans([]);
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Plan
            </button>
          )}

          <button
            onClick={() => handleDeletePlan(seg.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button className="text-blue-600 hover:text-blue-800">
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      {/* 🔽 Inline Plan Details (keep your existing plan details block below this) */}
      {expandedSegmentId === seg.id && segmentPlanData[seg.id] && (
        <div className="bg-white border border-gray-200 rounded-lg ml-4 mt-2 shadow-sm">
            <div className="bg-white border border-gray-200 rounded-lg ml-4 mt-2 shadow-sm">
                                            <div className="p-4">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Plan Details</h3>

                                                <div className="space-y-4">
                                                    {/* Daily Plans */}
                                                    {segmentPlanData[seg.id].plan?.daily && (
                                                        <div className="border rounded-lg">
                                                            <button
                                                                onClick={() => setExpandedSegments(prev => ({
                                                                    ...prev,
                                                                    [`${seg.id}-daily`]: !prev[`${seg.id}-daily`]
                                                                }))}
                                                                className="w-full flex justify-between items-center px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                            >
                                                                <span className="font-semibold text-blue-800">Daily Plan</span>
                                                                <span className={`transform transition-transform ${expandedSegments[`${seg.id}-daily`] ? "rotate-180" : "rotate-0"}`}>
                                                                    ▼
                                                                </span>
                                                            </button>

                                                            {expandedSegments[`${seg.id}-daily`] && (
                                                                <div className="p-4 space-y-4">
                                                                    {Object.entries(segmentPlanData[seg.id].plan.daily).map(([mealType, mealData]) => {
                                                                        const formattedLabel = mealType
                                                                            .split(" ")
                                                                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                                                            .join(" ");

                                                                        return (
                                                                            <div key={mealType} className="border-b pb-3 last:border-0">
                                                                                <h4 className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800 mb-3">
                                                                                    {formattedLabel}
                                                                                </h4>
                                                                                {renderPlanItems(mealData)}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Weekly Plans */}
                                                    {segmentPlanData[seg.id].plan?.weekly && (
                                                        <div className="border rounded-lg">
                                                            <button
                                                                onClick={() => setExpandedSegments(prev => ({
                                                                    ...prev,
                                                                    [`${seg.id}-weekly`]: !prev[`${seg.id}-weekly`]
                                                                }))}
                                                                className="w-full flex justify-between items-center px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                                                            >
                                                                <span className="font-semibold text-purple-800">Weekly Plan</span>
                                                                <span className={`transform transition-transform ${expandedSegments[`${seg.id}-weekly`] ? "rotate-180" : "rotate-0"}`}>
                                                                    ▼
                                                                </span>
                                                            </button>

                                                            {expandedSegments[`${seg.id}-weekly`] && (
                                                                <div className="p-4 space-y-4">
                                                                    {Object.entries(segmentPlanData[seg.id].plan.weekly).map(([day, dayData]) => (
                                                                        <div key={day} className="border rounded-lg mb-2">
                                                                            <button
                                                                                onClick={() => setExpandedSegments(prev => ({
                                                                                    ...prev,
                                                                                    [`${seg.id}-weekly-${day}`]: !prev[`${seg.id}-weekly-${day}`]
                                                                                }))}
                                                                                className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg"
                                                                            >
                                                                                <span className="font-semibold text-gray-800">{day}</span>
                                                                                <span className={`transform transition-transform ${expandedSegments[`${seg.id}-weekly-${day}`] ? "rotate-180" : "rotate-0"}`}>▼</span>
                                                                            </button>

                                                                            {expandedSegments[`${seg.id}-weekly-${day}`] && (
                                                                                <div className="p-4 space-y-4">
                                                                                    {Object.entries(dayData).map(([mealType, mealData]) => {
                                                                                        const formattedLabel = mealType
                                                                                            .split(" ")
                                                                                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                                                                            .join(" ");
                                                                                        return (
                                                                                            <div key={mealType} className="border-b pb-3 last:border-0 mb-3">
                                                                                                <h4 className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 mb-3">
                                                                                                    {formattedLabel}
                                                                                                </h4>
                                                                                                {renderPlanItems(mealData)}
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

{/* ✅ Month Plan */}
{segmentPlanData[seg.id]?.plan?.month && (
  <div className="border rounded-lg">
    <button
      onClick={() =>
        setExpandedSegments((prev) => ({
          ...prev,
          [`${seg.id}-month`]: !prev[`${seg.id}-month`],
        }))
      }
      className="w-full flex justify-between items-center px-4 py-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
    >
      <span className="font-semibold text-orange-800">Month Plan</span>
      <span
        className={`transform transition-transform ${
          expandedSegments[`${seg.id}-month`] ? "rotate-180" : "rotate-0"
        }`}
      >
        ▼
      </span>
    </button>

    {expandedSegments[`${seg.id}-month`] && (
      <div className="p-4 space-y-4">
        {/* Flatten structure: directly display month.items */}
        {segmentPlanData[seg.id].plan.month.items ? (
          <div className="space-y-2">
            {Object.entries(segmentPlanData[seg.id].plan.month.items).map(
              ([itemId, qty], i) => {
                const foundItem = allItems.find((x) => x.id == itemId);
                return (
                  <div
                    key={itemId}
                    className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded"
                  >
                    <span className="text-gray-800 font-medium">
                      {i + 1}. {foundItem ? foundItem.name : `Item #${itemId}`}
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {qty} {foundItem?.resident || ""}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        ) : (
          // backward-compatible: handle older structure (month → mealType → items)
          Object.entries(segmentPlanData[seg.id].plan.month || {}).map(
            ([mealType, mealData]) => (
              <div key={mealType} className="border-b pb-3 last:border-0">
                <h4 className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800 mb-3">
                  {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                </h4>
                {mealData?.items && (
                  <div className="space-y-2">
                    {Object.entries(mealData.items).map(([itemId, qty], i) => {
                      const foundItem = allItems.find((x) => x.id == itemId);
                      return (
                        <div
                          key={itemId}
                          className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded"
                        >
                          <span className="text-gray-800 font-medium">
                            {i + 1}.{" "}
                            {foundItem ? foundItem.name : `Item #${itemId}`}
                          </span>
                          <span className="text-gray-900 font-semibold">
                            {qty} {foundItem?.resident || ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          )
        )}
      </div>
    )}
  </div>
)}


{/* ✅ Date-wise (Monthly) Plan */}
{segmentPlanData[seg.id]?.plan?.monthly && (
  <div className="border rounded-lg">
    <button
      onClick={() =>
        setExpandedSegments((prev) => ({
          ...prev,
          [`${seg.id}-monthly`]: !prev[`${seg.id}-monthly`],
        }))
      }
      className="w-full flex justify-between items-center px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
    >
      <span className="font-semibold text-green-800">Date-wise Plan</span>
      <span
        className={`transform transition-transform ${
          expandedSegments[`${seg.id}-monthly`] ? "rotate-180" : "rotate-0"
        }`}
      >
        ▼
      </span>
    </button>

    {expandedSegments[`${seg.id}-monthly`] && (
      <div className="p-4 space-y-4">
        {Object.entries(segmentPlanData[seg.id].plan.monthly || {}).map(
          ([date, dateData]) => (
            <div key={date} className="border-b pb-3 last:border-0">
              <h4 className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800 mb-3">
                Date {date}
              </h4>
              {dateData?.items && (
                <div className="space-y-2">
                  {Object.entries(dateData.items).map(([itemId, qty], i) => {
                    const foundItem = allItems.find((x) => x.id == itemId);
                    return (
                      <div
                        key={itemId}
                        className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded"
                      >
                        <span className="text-gray-800 font-medium">
                          {i + 1}. {foundItem ? foundItem.name : `Item #${itemId}`}
                        </span>
                        <span className="text-gray-900 font-semibold">
                          {qty} {foundItem?.resident || ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )
        )}
      </div>
    )}
  </div>
)}

                                                  
                                                    {/* Footer with Edit Plan button */}
                                                    <div className="flex justify-end mt-6">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedSegmentId(seg.id);
                                                                setIsEditMode(true);

                                                                const planData = segmentPlanData[seg.id]?.plan || {};
                                                                const newPlans = [];
                                                                // ✅ Daily Plan
                                                                if (planData.daily) {
                                                                    const dailyPlan = { type: "daily", meals: [] };

                                                                    Object.entries(planData.daily).forEach(([mealType, mealObj]) => {
                                                                        const items = [];

                                                                        // mealObj looks like { "Grocery": {...}, "Veg/Meat/Dairy": {...} }
                                                                        Object.entries(mealObj || {}).forEach(([category, categoryItems]) => {
                                                                            Object.entries(categoryItems || {}).forEach(([itemName, itemData]) => {
                                                                                const foundItem = allItems.find(item => item.name === itemName);
                                                                                items.push({
                                                                                    category: category === "Grocery" ? "food" : category === "Veg/Meat/Dairy" ? "dailie" : category === "Housekeeping" ? "housekeeping" : category.toLowerCase(),
                                                                                    item: foundItem ? foundItem.id : "",
                                                                                    qty: itemData?.qty || "",
                                                                                    unit: itemData?.unit || "Grams",
                                                                                });
                                                                            });
                                                                        });

                                                                        dailyPlan.meals.push({ type: mealType, items });
                                                                    });

                                                                    newPlans.push(dailyPlan);
                                                                }


                                                                // In the Edit Plan button onClick, replace ONLY the weekly plan section:

                                                                // ✅ Weekly Plan - Each day becomes separate plan
                                                                if (planData.weekly) {
                                                                    Object.entries(planData.weekly).forEach(([day, dayMeals]) => {
                                                                        const weeklyPlan = {
                                                                            type: "weekly",
                                                                            days: [day],  // Each day gets its own plan
                                                                            meals: []
                                                                        };

                                                                        Object.entries(dayMeals || {}).forEach(([mealType, categories]) => {
                                                                            const items = [];
                                                                            Object.entries(categories || {}).forEach(([category, categoryItems]) => {
                                                                                Object.entries(categoryItems || {}).forEach(([itemName, itemData]) => {
                                                                                    const foundItem = allItems.find(item => item.name === itemName);
                                                                                    items.push({
                                                                                        category: category === "Grocery" ? "food" : category === "Veg/Meat/Dairy" ? "dailie" : category === "Housekeeping" ? "housekeeping" : category.toLowerCase(),
                                                                                        item: foundItem ? foundItem.id : "",
                                                                                        qty: itemData?.qty || "",
                                                                                        unit: itemData?.unit || "Grams",
                                                                                    });
                                                                                });
                                                                            });
                                                                            weeklyPlan.meals.push({ type: mealType, items });
                                                                        });

                                                                        newPlans.push(weeklyPlan);  // Each day becomes separate plan
                                                                    });
                                                                }
                                                                // ✅ Monthly Plan
                                                                if (planData.monthly) {
                                                                    const monthlyPlan = { type: "monthly", datePlans: [] };

                                                                    Object.entries(planData.monthly).forEach(([date, categories]) => {
                                                                        const meals = [
                                                                            {
                                                                                type: "default",
                                                                                items: [],
                                                                            },
                                                                        ];

                                                                        Object.entries(categories || {}).forEach(([category, categoryItems]) => {
                                                                            Object.entries(categoryItems || {}).forEach(([itemName, itemData]) => {
                                                                                const foundItem = allItems.find(item => item.name === itemName);
                                                                                meals[0].items.push({
                                                                                    category: category === "Grocery" ? "food" : category === "Veg/Meat/Dairy" ? "dailie" : category === "Housekeeping" ? "housekeeping" : category.toLowerCase(),
                                                                                    item: foundItem ? foundItem.id : "",
                                                                                    qty: itemData?.qty || "",
                                                                                    unit: itemData?.unit || "Grams",
                                                                                });
                                                                            });
                                                                        });

                                                                        monthlyPlan.datePlans.push({ date, meals });
                                                                    });

                                                               newPlans.push(monthlyPlan);
                                                            }

                                                            // ✅ Month Plan
                                                         // ✅ FIXED Month Plan Handling
if (planData.month) {
  const monthPlan = { type: "month", meals: [] };
  const mergedItems = [];

  // Handle both new & old backend formats
  if (planData.month.items) {
    Object.entries(planData.month.items).forEach(([itemId, qty]) => {
      const foundItem = allItems.find((i) => i.id == itemId);
      mergedItems.push({
        category: foundItem?.category || "",
        item: foundItem ? foundItem.id : "",
        qty,
        unit: foundItem?.unit || "Grams",
      });
    });
  } else {
    Object.entries(planData.month).forEach(([mealKey, mealObj]) => {
      Object.entries(mealObj.items || {}).forEach(([itemId, qty]) => {
        const foundItem = allItems.find((i) => i.id == itemId);
        mergedItems.push({
          category: foundItem?.category || "",
          item: foundItem ? foundItem.id : "",
          qty,
          unit: foundItem?.unit || "Grams",
        });
      });
    });
  }

  monthPlan.meals.push({
    type: "Items",
    items: mergedItems.length
      ? mergedItems
      : [{ category: "", item: "", qty: "", unit: "Grams" }],
  });

  newPlans.push(monthPlan);
}
                                                            setCreatedPlans(newPlans);
                                                                setShowForm(true);
                                                            }}
                                                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow hover:bg-yellow-600"
                                                        >
                                                            ✏️ Edit Plan
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
        </div>
      )}
    </div>
  );
})}

                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {isEditMode
                                ? `Update Diet Plan for "${segments.find(s => s.id === selectedSegmentId)?.category || "this segment"}"`
                                : `Create Diet Plan for "${segments.find(s => s.id === selectedSegmentId)?.category || "this segment"}"`}
                        </h2>

                        <button
                            onClick={() => {
                                setShowForm(false);
                                setIsEditMode(false);
                            }}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            ← Back
                        </button>
                    </div>


                    {createdPlans.map((plan, planIndex) => (
                        <div key={planIndex} className="border rounded-lg p-4 bg-gray-50 mb-6">
                       <h3 className="text-lg font-semibold mb-4 capitalize">
    {plan.type === "monthly" ? "Date Wise Plan" : `${plan.type} Plan`}
</h3>

                            {plan.type === "weekly" && (
                                <div className="mb-4">
                                    <p className="font-medium text-gray-600">Days: {plan.days.join(", ")}</p>
                                </div>
                            )}

                            {plan.type === "monthly" && (
                                <div className="mb-4">
                                    {(plan.datePlans || []).map((datePlan, datePlanIndex) => (
                                        <div key={datePlanIndex} className="mb-6 p-4 border rounded bg-white">
                                            <h4 className="text-md font-semibold text-gray-700 mb-3">
                                                Date: {datePlan.date}
                                            </h4>

                                            {(datePlan.meals || []).map((meal, mealIndex) => (
                                                <div key={mealIndex} className="mb-4">
                                                    <h5 className="font-semibold text-gray-700 mb-2">
                                                        {meal.type === "default" ? "Meal" : meal.type}
                                                    </h5>

                                                    {(meal.items || []).map((item, itemIndex) => {
                                                        const availableItems = getItemsByCategory(item.category);
                                                        const selectedItem = availableItems.find((i) => i.id == item.item);

                                                        return (
                                                            <div key={itemIndex} className="flex items-center gap-3 mb-3">
                                                                <select
                                                                    className="border rounded px-3 py-2 w-50"
                                                                    value={item.category}
                                                                    onChange={(e) => {
                                                                        const updated = [...createdPlans];
                                                                        updated[planIndex].datePlans[datePlanIndex].meals[mealIndex].items[itemIndex].category =
                                                                            e.target.value;
                                                                        setCreatedPlans(updated);
                                                                    }}
                                                                >
                                                                    <option value="">Category</option>
                                                                    <option value="food">Grocery</option>
                                                                    <option value="dailie">Veg/Meat/Dairy</option>
                                                                    <option value="housekeeping">Housekeeping</option>
                                                                </select>

                                                                <select
                                                                    className="border rounded px-3 py-2 w-96"
                                                                    value={item.item}
                                                                    onChange={(e) => {
                                                                        const updated = [...createdPlans];
                                                                        updated[planIndex].datePlans[datePlanIndex].meals[mealIndex].items[itemIndex].item =
                                                                            e.target.value;
                                                                        setCreatedPlans(updated);
                                                                    }}
                                                                >
                                                                    <option value="">Select Item</option>
                                                                    {availableItems.map((f) => (
                                                                        <option key={f.id} value={f.id}>
                                                                            {f.name}
                                                                        </option>
                                                                    ))}
                                                                </select>

                                                                <input
                                                                    type="number"
                                                                    placeholder="Qty"
                                                                    className="border rounded px-3 py-2 w-24"
                                                                    value={item.qty}
                                                                    onChange={(e) => {
                                                                        const updated = [...createdPlans];
                                                                        updated[planIndex].datePlans[datePlanIndex].meals[mealIndex].items[itemIndex].qty =
                                                                            e.target.value;
                                                                        setCreatedPlans(updated);
                                                                    }}
                                                                />
                                                         <span className="px-3 py-2 border rounded bg-gray-100 w-24 text-center">
    {selectedItem ? selectedItem.resident : "—"}
</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = [...createdPlans];
                                                                        updated[planIndex].datePlans[datePlanIndex].meals[mealIndex].items.splice(itemIndex, 1);
                                                                        setCreatedPlans(updated);
                                                                    }}
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}

                                                    <button
                                                        onClick={() => {
                                                            const updated = [...createdPlans];
                                                            updated[planIndex].datePlans[datePlanIndex].meals[mealIndex].items.push({
                                                                category: "",
                                                                item: "",
                                                                qty: "",
                                                                unit: "",
                                                            });
                                                            setCreatedPlans(updated);
                                                        }}
                                                        className="px-3 py-1 bg-blue-500 text-white rounded"
                                                    >
                                                        + Add Item
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ))}

                                    <div className="mt-6">
                                        <label className="block font-medium text-gray-700 mb-2">Select Date (1 - 28)</label>
                                        <select
                                            className="border rounded px-3 py-2"
                                            value=""
                                            onChange={(e) => {
                                                const selectedDate = e.target.value;
                                                if (selectedDate) {
                                                    const updated = [...createdPlans];

                                                    if (!updated[planIndex].datePlans) {
                                                        updated[planIndex].datePlans = [];
                                                    }

                                                    const existing = updated[planIndex].datePlans.find(
                                                        (dp) => dp.date === selectedDate
                                                    );
                                                    if (!existing) {
                                                        updated[planIndex].datePlans.push({
                                                            date: selectedDate,
                                                            meals: [
                                                                {
                                                                    type: "default",
                                                                    items: [
                                                                        { category: "", item: "", qty: "", unit: "Grams" }
                                                                    ],
                                                                },
                                                            ],
                                                        });
                                                        setCreatedPlans(updated);
                                                    }
                                                }
                                            }}
                                        >
                                            <option value="">-- Select Date --</option>
                                            {[...Array(28)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {(plan.meals || []).map((meal, mealIndex) => (
                                <div key={mealIndex} className="mb-6">
                                    <h4 className="text-md font-bold text-gray-700 mb-3 capitalize">
                                        {meal.type.includes('-') ? (
                                            <span>
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                                                    {meal.type.split('-')[0]}
                                                </span>
                                                {meal.type.split('-')[1]}
                                            </span>
                                        ) : (
                                            meal.type
                                        )}
                                    </h4>

                                    {(meal.items || []).map((item, itemIndex) => {
                                        const availableItems = getItemsByCategory(item.category);
                                        const selectedItem = availableItems.find((i) => i.id == item.item);

                                        return (
                                            <div key={itemIndex} className="flex items-center gap-3 mb-3">
                                                <select
                                                    className="border rounded px-3 py-2 w-50"
                                                    value={item.category}
                                                    onChange={(e) => {
                                                        const updated = [...createdPlans];
                                                        updated[planIndex].meals[mealIndex].items[itemIndex].category = e.target.value;
                                                        setCreatedPlans(updated);
                                                    }}
                                                >
                                                    <option value="">Category</option>
                                                    <option value="food">Grocery</option>
                                                    <option value="dailie">Veg/Meat/Dairy</option>
                                                    <option value="housekeeping">Housekeeping</option>
                                                </select>

                                                <select
                                                    className="border rounded px-3 py-2 w-96"
                                                    value={item.item}
                                                    onChange={(e) => {
                                                        const updated = [...createdPlans];
                                                        updated[planIndex].meals[mealIndex].items[itemIndex].item = e.target.value;
                                                        setCreatedPlans(updated);
                                                    }}
                                                >
                                                    <option value="">Select Item</option>
                                                    {availableItems.map((f) => (
                                                        <option key={f.id} value={f.id}>{f.name}</option>
                                                    ))}
                                                </select>

                                                <input
                                                    type="number"
                                                    placeholder="Qty"
                                                    className="border rounded px-3 py-2 w-24"
                                                    value={item.qty}
                                                    onChange={(e) => {
                                                        const updated = [...createdPlans];
                                                        updated[planIndex].meals[mealIndex].items[itemIndex].qty = e.target.value;
                                                        setCreatedPlans(updated);
                                                    }}
                                                />
<span className="px-3 py-2 border rounded bg-gray-100 w-24 text-center">
    {selectedItem ? selectedItem.resident : "—"}
</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = [...createdPlans];
                                                        updated[planIndex].meals[mealIndex].items.splice(itemIndex, 1);
                                                        setCreatedPlans(updated);
                                                    }}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}

                                    <button
                                        onClick={() => {
                                            const updated = [...createdPlans];
                                            updated[planIndex].meals[mealIndex].items.push({
                                                category: "",
                                                item: "",
                                                qty: "",
                                                unit: "",
                                            });
                                            setCreatedPlans(updated);
                                        }}
                                        className="px-3 py-1 bg-blue-500 text-white rounded"
                                    >
                                        + Item
                                    </button>
                                </div>
                            ))}

                     {plan.type !== "monthly" && plan.type !== "month" && (
                                <div className="mt-4">
                                    <label className="block font-medium text-gray-700 mb-2">Add Meal Type</label>
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const updated = [...createdPlans];
                                                updated[planIndex].meals.push({
                                                    type: e.target.value,
                                                    items: [
                                                        { category: "", item: "", qty: "", unit: "Grams" }
                                                    ],
                                                });

                                                setCreatedPlans(updated);
                                                e.target.value = "";
                                            }
                                        }}
                                        className="border rounded px-3 py-2 w-60"
                                    >
                                        <option value="">-- Select --</option>
                                        {["morning", "midday", "evening", "evening snack"]
                                            .filter((meal) => !plan.meals.some((m) => m.type === meal))
                                            .map((meal) => (
                                                <option key={meal} value={meal}>
                                                    {meal
                                                        .split(" ")
                                                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                                        .join(" ")}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    ))}

                    {planType === "weekly" && (() => {
                        const remainingDays = allWeekDays.filter(
                            (day) => !createdPlans.some((p) => p.type === "weekly" && p.days.includes(day))
                        );

                        if (remainingDays.length === 0) return null;

                        return (
                            <div className="border rounded-lg p-4 bg-gray-50 mb-6">
                                <h3 className="text-lg font-semibold mb-4">Select Days</h3>
                                <div className="flex flex-wrap gap-4 mb-4">
                                    {remainingDays.map((day) => (
                                        <label key={day} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedDays.includes(day)}
                                                onChange={() => handleDayToggle(day)}
                                            />
                                            {day}
                                        </label>
                                    ))}
                                    <button
                                        onClick={handleCreateWeeklyPlan}
                                        className="ml-auto px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Create
                                    </button>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="mb-6">
                        <label className="block font-medium text-gray-700 mb-2">Add Plan Type</label>
                       <select
    value=""
    onChange={(e) => {
        if (e.target.value === "daily" || e.target.value === "monthly" || e.target.value === "month") {
            handleCreatePlan(e.target.value);
        } else if (e.target.value === "weekly") {
            setPlanType(e.target.value);
        }
    }}
    className="border rounded px-3 py-2 w-60"
>
                            <option value="">-- Select --</option>
                           {["daily", "weekly", "monthly", "month"]
    .filter((type) => !createdPlans.some((p) => p.type === type))
    .map((type) => (
        <option key={type} value={type}>
            {type === "monthly" ? "Date Wise" : type === "month" ? "Month" : type.charAt(0).toUpperCase() + type.slice(1)}
        </option>
    ))}
                        </select>
                    </div>

                    <div className="mt-6 p-4 bg-white rounded-lg flex justify-end">
                        <button
                            onClick={() => handleSavePlan(selectedSegmentId)}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
                        >
                            {isEditMode ? "Update" : "Save"}
                        </button>
                    </div>
                </>
            )}

            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h3 className="text-lg font-bold mb-4">Diet Plan Categories</h3>

                        <label className="flex items-center gap-2 mb-2">
                            <input
                                type="radio"
                                name="dietChoice"
                                value="custom"
                                checked={dietChoice === "custom"}
                                onChange={(e) => setDietChoice(e.target.value)}
                            />
                            Common
                        </label>

                        <label className="flex items-center gap-2 mb-4">
                            <input
                                type="radio"
                                name="dietChoice"
                                value="both"
                                checked={dietChoice === "both"}
                                onChange={(e) => setDietChoice(e.target.value)}
                            />
                            Veg / Non-Veg
                        </label>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowPopup(false)}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateSegment}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Diet;
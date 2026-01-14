import React, { useState, useEffect } from 'react';

const DietPlan = () => {
    const [dietData, setDietData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [expandedSegments, setExpandedSegments] = useState({});

    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    });

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError('Authentication required. Please login first.');
            setLoading(false);
            return;
        }
        fetchDietPlan();
    }, [selectedDate]);


    const fetchDietPlan = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem('authToken');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`https://rcs-dms.onlinetn.com/api/v1//segment/diet-roll/${selectedDate}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (response.ok && !result.error) {
                setDietData(result.data);

                if (result.user) {
                    setUserRole(result.user.role);
                    setUserInfo(result.user);
                }

                setError(null);
            } else {
                throw new Error(result.message || `Error: ${response.status}`);
            }

        } catch (err) {
            setError(err.message);
            console.error('Failed to fetch diet plan:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderDietItems = (items) => {
        if (!items || Object.keys(items).length === 0) return null;

        return (
            <div className="space-y-2">
                {Object.values(items).map((item, index) => (
                   <div className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded">
  {/* Left: No. + Item */}
  <div className="flex items-center gap-2">
    <span className="text-gray-800 font-medium">
      {index + 1}. {item.name}
    </span>
  </div>

  {/* Right: Quantity + Unit */}
  <div className="flex items-center gap-2">
   {(() => {
  const { value, unit } = formatQuantity(item.qty, item.unit);
  return (
    <>
      <span className="text-gray-900 font-semibold">{value}</span>
<span className="px-2 py-0.5 text-sm font-semibold rounded">{unit}</span>
    </>
  );
})()}
  </div>
</div>

                ))}
            </div>
        );
    };


    const getDietTypeColor = (diet) => {
        return diet === 'Vegetarian' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
    };

    const getCategoryColor = (category) => {
        if (category.includes('Class A')) return 'bg-blue-100 text-blue-800';
        if (category.includes('Class B')) return 'bg-purple-100 text-purple-800';
        return 'bg-gray-100 text-gray-800';
    };
const formatQuantity = (qty, unit) => {
  if (qty == null || !unit) return { value: qty, unit };

  let value = qty;

  // Convert Kg → g
  if (unit.toLowerCase() === "kg") {
    value = qty * 1000;
    unit = "Grams";
  }

  // Format value to 2 decimal places
  value = Number(value).toFixed(2); // keeps 2 decimals

  return { value, unit };
};

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-6 bg-white">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading diet plan...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-6 bg-white">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">!</span>
                        </div>
                        <h3 className="text-red-800 font-semibold">Error Loading Diet Plan</h3>
                    </div>
                    <p className="text-red-700 mb-4">{error}</p>
                    <button
                        onClick={fetchDietPlan}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!dietData) {
        return (
            <div className="max-w-7xl mx-auto p-6 bg-white">
                <div className="text-center py-12">
                    <p className="text-gray-500">No diet data available</p>
                </div>
            </div>
        );
    }

    const toggleMealVisibility = (segmentKey, mealType) => {
        setExpandedSegments((prev) => ({
            ...prev,
            [segmentKey]: {
                ...prev[segmentKey],
                [mealType]: !prev[segmentKey]?.[mealType],
            },
        }));
    };


    return (
        <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
            {/* Header Section */}
    {/* Header Navbar Style */}
<div className="w-full shadow-md px-6 py-4 mb-6" style={{ backgroundColor: "#1D7CB6" }}>
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
    {/* Left: Title */}
    <h1 className="text-2xl sm:text-3xl font-bold text-white">Diet Plan</h1>

    {/* Right: Date Picker */}
    <div className="flex items-center gap-3 mt-3 sm:mt-0">
      <label
        htmlFor="datePicker"
        className="text-sm font-medium text-white whitespace-nowrap"
      >
        Select Date:
      </label>
      <input
        id="datePicker"
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="rounded-md px-3 py-2 text-sm border border-white/40 bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        max={new Date().toISOString().split("T")[0]} // restrict to today or earlier
      />
    </div>
  </div>
</div>



            {/* Diet Segments */}
            <div className="grid gap-6">
                {Object.entries(dietData).map(([segmentKey, segmentData]) => (
                    <div
                        key={segmentKey}
                        className={`bg-white rounded-2xl border shadow-sm transition-all duration-300 ${expandedSegments[segmentKey] ? "ring-2 ring-blue-200" : ""
                            }`}
                    >
                        {/* Segment Header */}
                        <button
                            onClick={() =>
                                setExpandedSegments((prev) => ({
                                    ...prev,
                                    [segmentKey]: !prev[segmentKey],
                                }))
                            }
                            className="w-full flex justify-between items-center px-6 py-4 bg-gray-100 hover:bg-gray-200 rounded-t-2xl transition-colors"
                        >
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-blue-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
  </svg>

  {(() => {
    // Extract parts: example "Class A - Labour - Vegetarian"
    const parts = segmentKey.split(" - ");
    const diet = parts[parts.length - 1];
    const baseName = parts.slice(0, -1).join(" - ");

    // Check how many plans share the same base
    const sameBaseCount = Object.keys(dietData).filter(k =>
      k.startsWith(baseName)
    ).length;

    // If multiple plans exist, show full name (with diet)
    // else, show only the base segment name
    if (sameBaseCount > 1) {
      return segmentKey;
    } else {
      return baseName || segmentKey;
    }
  })()}
</span>

                            <span
                                className={`text-xl transform transition-transform duration-300 ${expandedSegments[segmentKey] ? "rotate-180" : "rotate-0"
                                    }`}
                            >
                                ⌄
                            </span>
                        </button>

                        {/* Meals always expanded inside segment */}
                        {expandedSegments[segmentKey] && (
                            <div className="p-6 space-y-6">
                              {Object.entries(segmentData)
  .filter(([key]) => key !== "segment" && key !== "persons")
  .map(([mealType, mealData]) => {
    if (!mealData || Object.keys(mealData).length === 0) return null;

    // Capitalize every word for display
    const formattedLabel = mealType
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return (
      <div key={mealType} className="space-y-3 border-b pb-4 last:border-0">
        <h4 className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
          {formattedLabel}
        </h4>
        {renderDietItems(mealData)}
      </div>
    );
  })}

                            </div>
                        )}
                    </div>

                ))}
            </div>

            {/* Summary Footer */}
            <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
                        <p className="text-gray-600">Total Segments: {Object.keys(dietData).length}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Last Updated</p>
                        <p className="font-medium text-gray-900">
                            {new Date().toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DietPlan;
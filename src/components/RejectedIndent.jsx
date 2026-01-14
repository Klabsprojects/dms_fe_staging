import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';
import { format } from 'date-fns';

const RejectedIndent = ({ indent, onBack, onSubmitSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [indentDetails, setIndentDetails] = useState([]);
  const [segments, setSegments] = useState([]);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [orderSummaryData, setOrderSummaryData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingOrderPayload, setPendingOrderPayload] = useState(null);
  const [pendingOrderToken, setPendingOrderToken] = useState(null);
  const [groceryItems, setGroceryItems] = useState([]);
  const [enableEdit, setEnableEdit] = useState(false);
  const [groceryItemsLoading, setGroceryItemsLoading] = useState(false);

  useEffect(() => {
    if (indent) {
      fetchRejectedIndentDetails();
      fetchGroceryItems();
    }
  }, [indent]);

  const fetchGroceryItems = async () => {
    try {
      setGroceryItemsLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/segment/items`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        }
      });

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

  const fetchRejectedIndentDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/indent/${indent.id}/detail`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        // Process indent details with editable order
        const processedDetails = (result.data || []).map(item => ({
          ...item,
          editableOrder: parseFloat(item.qty || 0).toFixed(3),
        }));
        setIndentDetails(processedDetails);

        // Extract segments if available
        if (indent.segment || indent.segement) {
          const segs = indent.segment || indent.segement;
          setSegments(segs.map(seg => ({
            id: seg.id,
            persons: seg.persons || 0
          })));
        }
      }
    } catch (err) {
      console.error('Error fetching rejected indent details:', err);
      alert('Failed to load indent details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditableOrderChange = (index, newValue) => {
    const updated = [...indentDetails];
    updated[index].editableOrder = newValue;
    setIndentDetails(updated);
  };

  const handleAddNewItem = () => {
    // Add a new empty row for adding items
    setIndentDetails([
      ...indentDetails,
      {
        id: '',
        name: '',
        required: '0.000',
        stock: '0.000',
        buffer: '0.000',
        qty: '0.000',
        editableOrder: '0.000',
        unit: 'Kg',
        isNew: true // Flag to identify new items
      }
    ]);
  };

  const handleNewItemChange = (index, field, value) => {
    const updated = [...indentDetails];
    
    if (field === 'itemId') {
      const selectedItem = groceryItems.find(item => item.id.toString() === value);
      if (selectedItem) {
        updated[index] = {
          ...updated[index],
          id: selectedItem.id,
          name: selectedItem.name,
          unit: selectedItem.indent || 'Kg',
          stock: selectedItem.stock || '0.000',
          required: '0.000',
          buffer: '0.000',
          qty: '0.000'
        };
      }
    } else if (field === 'editableOrder') {
      updated[index].editableOrder = value;
    }
    
    setIndentDetails(updated);
  };

  const handleRemoveItem = (index) => {
    if (indentDetails.length > 1) {
      const updated = indentDetails.filter((_, i) => i !== index);
      setIndentDetails(updated);
    } else {
      alert('At least one item is required');
    }
  };

  const handleResubmit = () => {
    const token = localStorage.getItem('authToken');
    
    const validItems = indentDetails.filter(item => 
      item.id && parseFloat(item.editableOrder) > 0
    );

    if (validItems.length === 0) {
      alert('Please add at least one item with quantity greater than 0');
      return;
    }

    const cleanedIndentType = (indent.indent_type || '').toLowerCase().replace(/\s+/g, '_');
    
    const payload = {
      date: indent.date,
      indent_type: cleanedIndentType,
      segment: segments,
      items: validItems.map(item => ({
        id: item.id,
        required: parseFloat(item.required || 0).toFixed(3),
        qty: parseFloat(item.editableOrder).toFixed(3)
      }))
    };

    if (cleanedIndentType === 'grocery') {
      payload.from_date = indent.from_date;
      payload.to_date = indent.to_date;
      payload.days = indent.days;
    } else if (cleanedIndentType === 'dailie') {
      payload.orderDate = [indent.date];
      payload.days = indent.days;
    }

    const totalItems = validItems.length;
    const totalPacks = validItems.reduce((sum, item) => 
      sum + parseFloat(item.editableOrder), 0
    );
    const totalResidents = segments.reduce((sum, seg) => 
      sum + (seg.persons || 0), 0
    );

    setPendingOrderPayload(payload);
    setPendingOrderToken(token);
    setOrderSummaryData({
      orderId: indent.date,
      date: new Date(indent.date).toLocaleDateString(),
      segmentNames: segments.map(seg => seg.id),
      totalItems,
      totalPacks,
      totalResidents,
      indentType: cleanedIndentType
    });

    setShowOrderSummary(true);
  };

const confirmSubmitOrder = async () => {
  if (isSubmitting) return;

  try {
    setIsSubmitting(true);

    // Extract only items for resubmit API
    const validItems = indentDetails.filter(item => 
      item.id && parseFloat(item.editableOrder) > 0
    );

    const response = await fetch(`${API_BASE_URL}/indent/${indent.id}/resubmit`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${pendingOrderToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: validItems.map(item => ({
          id: parseInt(item.id),
          qty: parseFloat(item.editableOrder).toFixed(3)
        }))
      })
    });

    const result = await response.json();

    if (response.ok && !result.error) {
      alert('Indent resubmitted successfully!');
      setShowOrderSummary(false);
      if (onSubmitSuccess) onSubmitSuccess();
    } else {
      alert(result.message || 'Failed to resubmit indent');
    }
  } catch (err) {
    console.error('Error resubmitting indent:', err);
    alert('Network error while resubmitting indent');
  } finally {
    setIsSubmitting(false);
  }
};

  const isMealCategory = indent?.indent_type?.toLowerCase() === 'dailie';

  return (
    <div className="bg-white shadow rounded-lg p-4 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
            Resubmit Rejected Indent
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Order Date: {format(new Date(indent.date), 'dd-MMM-yyyy')} • 
            Type: {indent.indent_type === 'grocery' ? 'Grocery' : 
                   indent.indent_type === 'dailie' ? 'Veg/Meat/Dairy' : 
                   indent.indent_type === 'open_indent' ? 'Open Indent' :
                   indent.indent_type}
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition text-sm sm:text-base"
        >
          ← Back to List
        </button>
      </div>

      {/* Rejection Reason Banner */}
      {indent.remarks && (
        <div className="p-3 mb-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
          <div className="flex items-start">
            <svg className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1-1.964-1-2.732 0L3.082 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <strong>Rejection Reason:</strong>
              <p className="mt-1">{indent.remarks}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading indent details...</p>
        </div>
      ) : (
        <>
          {/* Items Table */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-semibold">Items</h3>
              <button
                onClick={handleAddNewItem}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 sm:px-3 py-2 text-left text-xs sm:text-sm">S.No</th>
                    <th className="border border-gray-300 px-2 sm:px-3 py-2 text-left text-xs sm:text-sm">Item Name</th>
             {!enableEdit && (
  <th className="border border-gray-300 px-2 sm:px-3 py-2 text-center text-xs sm:text-sm">
    Required
  </th>
)}

{!enableEdit && (
  <th className="border border-gray-300 px-2 sm:px-3 py-2 text-center text-xs sm:text-sm">
    Stock
  </th>
)}

{!enableEdit && !isMealCategory && (
  <th className="border border-gray-300 px-2 sm:px-3 py-2 text-center text-xs sm:text-sm">
    Buffer
  </th>
)}

                    <th className="border border-gray-300 px-2 sm:px-3 py-2 text-center text-xs sm:text-sm">Previous Order</th>
                   {enableEdit && (
  <th className="border border-gray-300 px-2 sm:px-3 py-2 text-center text-xs sm:text-sm">
    New Order (Edit)
  </th>
)}
{enableEdit && (
  <th className="border border-gray-300 px-2 sm:px-3 py-2 text-center text-xs sm:text-sm">
    Action
  </th>
)}

                  </tr>
                </thead>
                <tbody>
                  {indentDetails.map((item, index) => (
                    <tr key={index} className="hover:bg-white transition-colors duration-150">
                      <td className="border border-gray-300 px-2 sm:px-3 py-2 text-xs sm:text-sm">{index + 1}.</td>
                      <td className="border border-gray-300 px-2 sm:px-3 py-2 font-medium text-xs sm:text-sm">
                        {item.isNew ? (
                          <select
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs sm:text-sm"
                            value={item.id || ''}
                            onChange={(e) => handleNewItemChange(index, 'itemId', e.target.value)}
                          >
                            <option value="">Select Item</option>
                            {groceryItems
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map((groceryItem) => (
                                <option key={groceryItem.id} value={groceryItem.id}>
                                  {groceryItem.name}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <>
                            {item.name}
                            {item.unit && (
                              <span className="ml-2 inline-block bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                {item.unit}
                              </span>
                            )}
                          </>
                        )}
                      </td>
                {!enableEdit && (
  <td className="border border-gray-300 px-2 sm:px-3 py-2 text-right text-xs sm:text-sm">
    {item.required !== undefined ? parseFloat(item.required).toFixed(3) : '–'}
  </td>
)}

{!enableEdit && (
  <td className="border border-gray-300 px-2 sm:px-3 py-2 text-right text-xs sm:text-sm">
    {item.stock !== undefined ? parseFloat(item.stock).toFixed(3) : '–'}
  </td>
)}

{!enableEdit && !isMealCategory && (
  <td className="border border-gray-300 px-2 sm:px-3 py-2 text-right text-xs sm:text-sm">
    {item.buffer !== undefined ? parseFloat(item.buffer).toFixed(3) : '–'}
  </td>
)}

                      <td className="border border-gray-300 px-2 sm:px-3 py-2 text-right text-xs sm:text-sm text-gray-500">
                        {parseFloat(item.qty || 0).toFixed(3)}
                      </td>
                 {enableEdit && (
  <td className="border border-gray-300 px-2 sm:px-3 py-2 text-center">
    <input
      type="number"
      step="0.001"
      value={item.editableOrder}
      onChange={(e) => {
        if (item.isNew) {
          handleNewItemChange(index, 'editableOrder', e.target.value);
        } else {
          handleEditableOrderChange(index, e.target.value);
        }
      }}
      className="w-20 sm:w-24 px-1 sm:px-2 py-1 border border-gray-300 rounded-md text-center text-xs sm:text-sm"
    />
  </td>
)}

{enableEdit && (
  <td className="border border-gray-300 px-2 sm:px-3 py-2 text-center">
    <button
      onClick={() => handleRemoveItem(index)}
      className="text-red-600 hover:text-red-800 font-bold text-lg"
      title="Remove Item"
    >
      ×
    </button>
  </td>
)}

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center gap-2">
  <input
    type="checkbox"
    id="enableEdit"
    checked={enableEdit}
    onChange={(e) => setEnableEdit(e.target.checked)}
    className="w-4 h-4"
  />
  <label htmlFor="enableEdit" className="text-sm font-medium text-gray-700">
    Edit & Resubmit
  </label>
</div>

          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={handleResubmit}
              disabled={loading}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm sm:text-base"
            >
              <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Resubmit Indent</span>
            </button>
          </div>
        </>
      )}

      {/* Order Summary Modal */}
      {showOrderSummary && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Resubmit Confirmation
                </h2>
                <button
                  onClick={() => setShowOrderSummary(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-orange-600">Total Items</p>
                      <p className="text-2xl font-bold text-orange-900">{orderSummaryData?.totalItems}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Total Residents</p>
                      <p className="text-2xl font-bold text-blue-900">{orderSummaryData?.totalResidents}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
              <button
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                onClick={() => setShowOrderSummary(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg flex items-center disabled:opacity-50"
                onClick={confirmSubmitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm Resubmit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RejectedIndent;
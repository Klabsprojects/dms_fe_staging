import { useState } from "react";
import { X, AlertCircle } from "lucide-react";

export default function RequestPopup({
  open,
  onClose,
  onConfirm,
  items = [],
  loading = false,
  userRole = "rcs-store", // "rcs-store" | "supply" | "ind-apr"
    orderDate,
  storeName,
}) {
  const [remarks, setRemarks] = useState("");
  const [isInformed, setIsInformed] = useState(false); // ← ADD THIS

  if (!open) return null;

const handleSubmit = () => {
    if (remarks.trim()) {
      onConfirm(remarks);
      setRemarks("");
      setIsInformed(false);
    }
  };

const handleCancel = () => {
    setRemarks("");
    setIsInformed(false);
    onClose();
  };

  // 🔹 Role-based behavior
// 🔹 Role-based behavior
  const isStore = userRole === "rcs-store";
  const isIndentApprover = userRole === "ind-apr";
  const isDepartment = userRole === "department";
  const showNote = !isStore && !isIndentApprover && !isDepartment; // show note only for supply

  let requestLabel = "Request GRN Reversal";
  if (isStore) requestLabel = "Reversal Dispatch";
  if (isIndentApprover) requestLabel = "Reversal Order";
  if (isDepartment) requestLabel = "Confirm Cancel";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
   
{/* Header */}
<div className="p-4 border-b bg-red-500">
  <div className="flex items-center justify-between">
    {/* Title */}
    <h2 className="text-xl font-semibold text-white">
      {isDepartment ? "GRN Cancel" : requestLabel}
    </h2>
    {/* Date & Store (Right side) */}
    {(orderDate || storeName) && (
      <div className="flex flex-wrap gap-3 text-sm">
        {orderDate && (
          <div className="flex items-center gap-1 px-2 py-1 bg-white border rounded-md text-gray-600">
            <span className="font-medium text-gray-700">Date:</span>
            <span>
              {new Date(orderDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        )}

        {storeName && (
          <div className="flex items-center gap-1 px-2 py-1 bg-white border rounded-md text-gray-600">
            <span className="font-medium text-gray-700">Store:</span>
            <span>{storeName}</span>
          </div>
        )}
      </div>
    )}
  </div>
</div>


        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* ⚠️ Note (for supply role only) */}
          {showNote && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle
                className="text-yellow-600 flex-shrink-0 mt-0.5"
                size={20}
              />
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> These item stocks will be changed upon
                confirmation.
              </p>
            </div>
          )}

          {/* Items Table */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading items...
            </div>
          ) : items.length > 0 ? (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Order Items
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        S.No
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        Item Name
                      </th>
{/* 🔹 Dynamic Column */}
                      {isStore ? (
                        <th className="px-3 py-2 text-right font-medium text-gray-700">
                          Dispatched
                        </th>
                      ) : isIndentApprover ? (
                        <th className="px-3 py-2 text-right font-medium text-gray-700">
                          Ordered
                        </th>
                      ) : isDepartment ? (
                        <th className="px-3 py-2 text-right font-medium text-gray-700">
                          Received
                        </th>
                      ) : (
                        <th className="px-3 py-2 text-right font-medium text-gray-700">
                          Received
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-600">{index + 1}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span className="text-gray-800">{item.name}</span>
                            {item.unit && (
                              <span className="text-xs text-gray-500">
                                Unit: {item.unit}
                              </span>
                            )}
                          </div>
                        </td>
{/* 🔹 Conditional Column Value */}
                        {isStore ? (
                          <td className="px-3 py-2 text-right text-gray-700">
                            {parseFloat(item.disp_qty || 0).toFixed(3)}{" "}
                            {item.unit}
                          </td>
                        ) : isIndentApprover ? (
                          <td className="px-3 py-2 text-right text-gray-700">
                            {parseFloat(item.qty || 0).toFixed(3)} {item.unit}
                          </td>
                        ) : isDepartment || item.grn_qty ? (
                          <td className="px-3 py-2 text-right">
                            {item.grn_qty ? (
                              <span className="text-green-700 font-medium">
                                {parseFloat(item.grn_qty).toFixed(3)} {item.unit}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                Not Received
                              </span>
                            )}
                          </td>
                        ) : (
                          <td className="px-3 py-2 text-right text-gray-700">
                            {item.grn_qty ? (
                              <span className="text-green-700 font-medium">
                                {parseFloat(item.grn_qty).toFixed(3)} {item.unit}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                Not Received
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {/* Remarks Section */}
          <div>
            <label
              htmlFor="remarks"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Remarks <span className="text-red-500">*</span>
            </label>
            <textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter your remarks here..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
{/* Checkbox for Indent Approver & RCS Store ONLY */}
            {(isIndentApprover || isStore) && (
              <div className="flex items-start gap-2 mt-3">
                <input
                  type="checkbox"
                  id="inform-admin"
                  checked={isInformed}
                  onChange={(e) => setIsInformed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="inform-admin" className="text-sm text-gray-700">
                  {isIndentApprover 
                    ? "I have informed the store regarding the order cancellation"
                    : "I have informed the admin regarding the despatch cancellation"
                  }
                </label>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
          >
            Back
          </button>
<button
            onClick={handleSubmit}
            disabled={!remarks.trim() || ((isIndentApprover || isStore) && !isInformed)}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isDepartment ? "Confirm Cancel" : requestLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

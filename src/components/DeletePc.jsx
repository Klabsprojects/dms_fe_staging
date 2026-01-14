import React, { useState, useEffect } from "react";

const DeletePc = ({ open, onClose, onConfirm, pcDocument, remarks }) => {
  const [editableRemarks, setEditableRemarks] = useState("");

  // Initialize remarks when modal opens
  useEffect(() => {
    if (open) {
      setEditableRemarks(remarks || "");
    }
  }, [open, remarks]);

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm(editableRemarks);
  };

  const handleClose = () => {
    setEditableRemarks(""); // Reset on close
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <h2 className="text-lg font-semibold text-gray-800 p-6 pb-2">
          PC Document Details
        </h2>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4">
          {/* Document Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Uploaded Document
            </label>
            <div className="border border-gray-300 rounded-md bg-gray-50 h-72">
              <iframe
                src={`https://rcs-dms.onlinetn.com/public/${pcDocument}`}
                title="PC Document"
                className="w-full h-full rounded-md"
                frameBorder="0"
              />
            </div>
          </div>

          {/* Editable Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks
            </label>
            <textarea
              value={editableRemarks}
              onChange={(e) => setEditableRemarks(e.target.value)}
              placeholder="Enter remarks for PC deletion..."
              rows={2}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Action Buttons - Sticks at bottom */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Delete PC
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePc;

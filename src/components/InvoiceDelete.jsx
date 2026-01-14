import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const InvoiceDelete = ({
  show,
  onClose,
  onConfirm,
  invoiceUrl, // full PDF URL
  title = "Request Invoice Delete",
  message = "Please review the uploaded invoice before submitting your delete request.",
}) => {
  const [remarks, setRemarks] = useState("");

  const handleSubmit = () => {
    if (!remarks.trim()) {
      alert("Please add remarks before submitting.");
      return;
    }
    onConfirm(remarks);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl w-[90%] sm:w-[600px] md:w-[800px] p-6 relative"
            style={{
              height: "85vh", // fixed modal height
              display: "flex",
              flexDirection: "column",
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Title */}
            <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>

            {/* Message */}
            <p className="text-sm text-gray-600 mb-4">{message}</p>

            {/* PDF Viewer */}
            {invoiceUrl ? (
              <div className="flex-1 mb-5">
                <div className="border border-gray-300 rounded-lg overflow-hidden h-full">
                  <iframe
                    src={invoiceUrl}
                    title="Invoice Preview"
                    className="w-full h-full"
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">
                No uploaded invoice found.
              </p>
            )}

            {/* Remarks */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                placeholder="Enter your reason for deletion..."
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Request Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InvoiceDelete;

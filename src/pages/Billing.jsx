// Billing.jsx
import React, { useEffect, useState } from "react";

export default function Billing() {
  const [billingData, setBillingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enteredAmount, setEnteredAmount] = useState("");

  const rawUser = localStorage.getItem("user");
  let userRole = "";

  try {
    userRole = JSON.parse(rawUser || "{}")?.role?.toLowerCase() || "";
  } catch {
    userRole = "";
  }

  const isPayCre = userRole === "pay-cre";
  const isStore = userRole === "rcs-store";

  const [selectedBills, setSelectedBills] = useState([]);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);

  // FIND SELECTED ACCOUNT
  const selectedAccount = selectedBills.length > 0
    ? billingData.find(b => b.id === selectedBills[0])?.acc
    : null;

  useEffect(() => {
    const fetchBillingList = async () => {
      setLoading(true);

      try {
        const token = localStorage.getItem("authToken");

        const response = await fetch(
          "https://rcs-dms.onlinetn.com/api/v1/bill/list",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (response.ok && !result.error) {
          setBillingData(result.data || []);
          setError("");
        } else {
          setError(result.message || "Failed to fetch billing data");
        }
      } catch (err) {
        console.error("Billing API Error:", err);
        setError("Something went wrong while fetching billing data.");
      } finally {
        setLoading(false);
      }
    };

    fetchBillingList();
  }, []);

  // NEW STATES
  const [remarks, setRemarks] = useState("");
  const accountNumber = selectedAccount || "-";
  
  // IFHRMS ECS Details states
  const [totenNo, setTotenNo] = useState("");
  const [tokenDate, setTokenDate] = useState("");
  const [ecsDate, setEcsDate] = useState("");
  const [ecsAmount, setEcsAmount] = useState("");
  const [voucherNo, setVoucherNo] = useState("");
  const [treasuryName, setTreasuryName] = useState("");

  // Calculate total amount of selected bills
  const totalAmount = billingData
    .filter((b) => selectedBills.includes(b.id))
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  // Submit handler with payload
  const handleSubmitPayment = async () => {
    const payload = {
      bills: selectedBills,
      totalAmount: totalAmount,
      accountNumber: accountNumber,
      accountName: billingData.find(b => b.id === selectedBills[0])?.acc_name || "",
      totenNo: totenNo,
      tokenDate: tokenDate,
      ecsDate: ecsDate,
      ecsAmount: ecsAmount,
      voucherNo: voucherNo,
      treasuryName: treasuryName,
      remarks: remarks
    };

    console.log("Payment Payload:", JSON.stringify(payload, null, 2));

    // API call example:
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("https://rcs-dms.onlinetn.com/api/v1/bill/payment", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (response.ok && !result.error) {
        alert("Payment submitted successfully!");
        setShowPaymentPopup(false);
        // Reset form
        setSelectedBills([]);
        setRemarks("");
        setTotenNo("");
        setTokenDate("");
        setEcsDate("");
        setEcsAmount("");
        setVoucherNo("");
        setTreasuryName("");
        setEnteredAmount("");
      } else {
        alert(result.message || "Payment submission failed");
      }
    } catch (error) {
      console.error("Payment submission error:", error);
      alert("Error submitting payment");
    }
  };

  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Billing</h1>
          <p className="text-gray-500 mt-1">
            Manage and view all billing related details here.
          </p>
        </div>

        {selectedBills.length > 0 && (
          <button
            onClick={() => setShowPaymentPopup(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
          >
            Payment
          </button>
        )}
      </div>

      {/* Body */}
      <div className="bg-white p-6 rounded-xl shadow">
        {loading ? (
          <p className="text-gray-600">Loading billing data...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : billingData.length === 0 ? (
          <p className="text-gray-600">No billing data found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">S.No</th>
                  <th className="px-4 py-2 border">Date</th>
                  <th className="px-4 py-2 border">Invoice No</th>
                  <th className="px-4 py-2 border">Indent ID</th>
                  {!isPayCre && <th className="px-4 py-2 border">Type</th>}
                  {!isPayCre && <th className="px-4 py-2 border">Department</th>}
                  <th className="px-4 py-2 border">Store</th>
                  <th className="px-4 py-2 border">Account</th>
                  <th className="px-4 py-2 border">Amount</th>
                  <th className="px-4 py-2 border">Action</th>
                </tr>
              </thead>

              <tbody>
                {billingData.map((bill, index) => {
                  const isSelected = selectedBills.includes(bill.id);
                  const isDisabled =
                    selectedBills.length > 0 &&
                    !isSelected &&
                    bill.acc !== selectedAccount;

                  return (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border">{index + 1}</td>

                      <td className="px-4 py-2 border">
                        {bill.created
                          ? new Date(bill.created).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                          : "-"}
                      </td>

                      <td className="px-4 py-2 border">{bill.invoice || "-"}</td>
                      <td className="px-4 py-2 border">{bill.indent || "-"}</td>

                      {!isPayCre && <td className="px-4 py-2 border">{bill.type || "-"}</td>}
                      {!isPayCre && <td className="px-4 py-2 border">{bill.depatment || "-"}</td>}
                      <td className="px-4 py-2 border">{bill.store || "-"}</td>
                      <td className="px-4 py-2 border">{bill.acc || "-"}</td>

                      <td className="px-4 py-2 border text-right">
                        {bill.amount != null ? `₹ ${Number(bill.amount).toFixed(2)}` : "-"}
                      </td>

                      {/* ACTION COLUMN */}
                      <td className="px-4 py-2 border text-center">
                        <div className="flex items-center justify-center gap-3">

                          {/* UPDATED CHECKBOX – Hidden for RCS-STORE */}
                          {!isStore && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isDisabled}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBills([...selectedBills, bill.id]);
                                } else {
                                  setSelectedBills(
                                    selectedBills.filter((id) => id !== bill.id)
                                  );
                                }
                              }}
                              className={`w-4 h-4 ${isDisabled ? "opacity-40 cursor-not-allowed" : ""
                                }`}
                            />
                          )}

                          {/* File Icon */}
                          {bill.invoice_file ? (
                            <button
                              onClick={() => {
                                const fileUrl = `https://rcs-dms.onlinetn.com/public/pdf/${bill.invoice_file}`;
                                window.open(fileUrl, "_blank");
                              }}
                              className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors"
                              title="Invoice"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="#f97316"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 12h6m-6 4h6"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAYMENT POPUP WITH FIXED HEADER AND FOOTER */}
      {showPaymentPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] flex flex-col">

            {/* FIXED HEADER */}
            <div className="flex justify-between items-center bg-blue-600 p-4 rounded-t-xl flex-shrink-0">
              <h2 className="text-xl font-bold text-white">Payment Summary</h2>

              <div className="bg-white text-blue-700 px-3 py-1 rounded-lg text-sm font-medium shadow">
                {new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="overflow-y-auto p-6 flex-1">
              <div className="space-y-4">

                {/* INVOICE + AMOUNT IN ONE LINE */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between items-center border p-3 rounded-lg bg-gray-50">
                    <span className="font-medium text-gray-700">Invoices Selected:</span>
                    <span className="text-lg font-semibold">{selectedBills.length}</span>
                  </div>

                  <div className="flex justify-between items-center border p-3 rounded-lg bg-gray-50">
                    <span className="font-medium text-gray-700">Total Amount:</span>
                    <span className="text-lg font-semibold text-gray-900">₹ {totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* ACCOUNT DETAILS SECTION */}
                <h3 className="text-lg font-semibold text-gray-800 mt-4">Account Details</h3>

                <div className="grid grid-cols-2 gap-4 mt-2">

                  {/* CODE (acc) */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Code:</label>
                    <input
                      type="text"
                      className="border rounded-lg px-3 py-2 w-full bg-gray-100"
                      value={billingData.find(b => b.id === selectedBills[0])?.acc || "-"}
                      readOnly
                    />
                  </div>

                  {/* NAME (acc_name) */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Name:</label>
                    <input
                      type="text"
                      className="border rounded-lg px-3 py-2 w-full bg-gray-100"
                      value={billingData.find(b => b.id === selectedBills[0])?.acc_name || "-"}
                      readOnly
                    />
                  </div>
                </div>

                {/* IFHRMS ECS DETAILS SECTION */}
                <h3 className="text-lg font-semibold text-gray-800 mt-4">IFHRMS ECS Details</h3>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  {/* Toten No */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Toten No.:</label>
                    <input
                      type="text"
                      className="border rounded-lg px-3 py-2 w-full"
                      placeholder="Enter toten number"
                      value={totenNo}
                      onChange={(e) => setTotenNo(e.target.value)}
                    />
                  </div>

                  {/* Token Date */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Token Date:</label>
                    <input
                      type="date"
                      className="border rounded-lg px-3 py-2 w-full"
                      value={tokenDate}
                      onChange={(e) => setTokenDate(e.target.value)}
                       max={new Date().toISOString().split("T")[0]}  // ADD THIS
                    />
                  </div>

                  {/* ECS Date */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">ECS Date:</label>
                    <input
                      type="date"
                      className="border rounded-lg px-3 py-2 w-full"
                      value={ecsDate}
                      
                      onChange={(e) => setEcsDate(e.target.value)}
                       max={new Date().toISOString().split("T")[0]}  // ADD THIS
                    />
                  </div>

                  {/* ECS Amount */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">ECS Amount:</label>
                    <input
                      type="number"
                      className="border rounded-lg px-3 py-2 w-full"
                      placeholder="Enter ECS amount"
                      value={ecsAmount}
                      onChange={(e) => setEcsAmount(e.target.value)}
                    />
                  </div>

                  {/* Voucher No */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Voucher No.:</label>
                    <input
                      type="text"
                      className="border rounded-lg px-3 py-2 w-full"
                      placeholder="Enter voucher number"
                      value={voucherNo}
                      onChange={(e) => setVoucherNo(e.target.value)}
                    />
                  </div>

                  {/* Name of Treasury */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Name of Treasury:</label>
                    <input
                      type="text"
                      className="border rounded-lg px-3 py-2 w-full"
                      placeholder="Enter treasury name"
                      value={treasuryName}
                      onChange={(e) => setTreasuryName(e.target.value)}
                    />
                  </div>
                </div>

                {/* REMARKS */}
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Remarks</label>
                  <textarea
                    className="border rounded-lg px-3 py-2 w-full h-24 resize-none"
                    placeholder="Enter remarks..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>

              </div>
            </div>

            {/* FIXED FOOTER */}
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl flex-shrink-0">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
                onClick={() => setShowPaymentPopup(false)}
              >
                Cancel
              </button>

              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow"
                onClick={handleSubmitPayment}
              >
                Submit
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
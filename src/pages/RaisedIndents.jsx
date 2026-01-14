import React, { useState, useMemo, useEffect } from "react";
import { API_BASE_URL } from '../services/api';

export default function RaisedIndnets({ title = "Raised Indents" }) {
  const [query, setQuery] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // Fetch API Data (Pending Indents Only)
useEffect(() => {
  const fetchIndents = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(`${API_BASE_URL}/indent/list`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.message || "Failed to fetch indents");
      }

      // Only Pending indents + normalized indentType
      const pendingIndents = (result.data || [])
        .filter((indent) => indent.status === "Pending")
        .map((indent) => ({
          ...indent,
          indentType: indent.indent_type || "open",
        }));

      setData(pendingIndents);

    } catch (err) {
      console.error("Indent Fetch Error:", err);
      setError("Network or authorization error while fetching indents");
    } finally {
      setLoading(false);
    }
  };

  fetchIndents();
}, []);


  // Filter based on search
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;

    return data.filter((row) => {
      return (
        String(row.id).includes(q) ||
        row.indent_type.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q) ||
        String(row.segment?.[0]?.persons || "").includes(q)
      );
    });
  }, [data, query]);

  return (
    <div className="p-4 bg-white rounded-2xl shadow-sm">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-semibold">{title}</h1>

        <div className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Order ID, type, unit, etc."
            className="px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead>
            <tr className="text-left">
              <th className="px-3 py-2">S.No</th>
              <th className="px-3 py-2">Order ID</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2">Store</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                  No pending indents found.
                </td>
              </tr>
            ) : (
              filtered.map((row, index) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">{index + 1}</td>
                  <td className="px-3 py-3 font-medium">{row.id}</td>
                  <td className="px-3 py-3 capitalize">{row.indent_type}</td>
                  <td className="px-3 py-3">
                    {row.segment?.[0]?.persons || "-"}
                  </td>
                  <td className="px-3 py-3">-</td> {/* No store info in API */}
                  <td className="px-3 py-3">{row.date}</td>
                  <td className="px-3 py-3">{row.status}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button className="px-2 py-1 border rounded text-sm">
                        View
                      </button>
                      <button className="px-2 py-1 border rounded text-sm">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 text-sm text-gray-600">
        Showing <strong>{filtered.length}</strong> of{" "}
        <strong>{data.length}</strong> pending items
      </div>
    </div>
  );
}

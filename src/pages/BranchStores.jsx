import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

const BranchStores = () => {
  const [branches, setBranches] = useState([]);
  const [storeRows, setStoreRows] = useState([]);
  const [storeMap, setStoreMap] = useState({});
  const [isStoreLogin, setIsStoreLogin] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBranches();
    fetchStores();
  }, []);

  /* ---------------- STORE MASTER (UNCHANGED) ---------------- */
  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}master/stores`, {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (!result.error && result.data) {
        setStoreMap(result.data);
      }
    } catch (err) {
      console.error('Store master fetch failed', err);
    }
  };

  /* ---------------- USER / BRANCH FETCH ---------------- */
  const fetchBranches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}user`, {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      /* ---------- ROLE CHECK (NEW, SAFE) ---------- */
      if (result.user?.role === 'rcs-store') {
        setIsStoreLogin(true);

        const rows = [];

        if (result.data) {
          Object.keys(result.data).forEach(department => {
            Object.keys(result.data[department]).forEach(unitType => {
              Object.keys(result.data[department][unitType]).forEach(unitName => {
                rows.push({
                  department,
                  unitType,
                  unitName,
                  details: result.data[department][unitType][unitName],
                });
              });
            });
          });
        }

        setStoreRows(rows);
        setLoading(false);
        return; // 🔒 DO NOT TOUCH EXISTING FLOW BELOW
      }

      /* ---------- EXISTING LOGIC (UNCHANGED) ---------- */
      const branchList = [];
      if (result.data) {
        Object.keys(result.data).forEach(branchType => {
          Object.keys(result.data[branchType]).forEach(branchName => {
            const users = result.data[branchType][branchName];
            const uniqueBranches = new Map();

            users.forEach(user => {
              if (!uniqueBranches.has(user.store)) {
                uniqueBranches.set(user.store, {
                  branchType: user.branch_type,
                  branchName: user.branch,
                  location: user.location,
                  district: user.district,
                  storeCode: user.store,
                });
              }
            });

            branchList.push(...uniqueBranches.values());
          });
        });
      }

      setBranches(branchList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const safeLower = v => (v ?? '').toString().toLowerCase();
  const filteredBranches = branches.filter(b =>
    safeLower(b.branchName).includes(searchTerm.toLowerCase()) ||
    safeLower(b.branchType).includes(searchTerm.toLowerCase()) ||
    safeLower(b.location).includes(searchTerm.toLowerCase()) ||
    safeLower(b.district).includes(searchTerm.toLowerCase()) ||
    safeLower(b.storeCode).includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-lg font-medium text-slate-600 animate-pulse">
          Loading…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-lg font-semibold text-red-600">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-gray-800">
            Branch Stores
          </h1>
          <div className="text-sm font-medium text-gray-600">
            Total Units:{' '}
            <span className="ml-1 rounded-full bg-gray-100 px-3 py-1 text-gray-800">
              {isStoreLogin ? storeRows.length : filteredBranches.length}
            </span>
          </div>
        </div>

        {/* ================== RCS STORE TABLE ================== */}
        {isStoreLogin ? (
          <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 text-left">Department</th>
                  <th className="px-6 py-4 text-left">Unit Type</th>
                  <th className="px-6 py-4 text-left">Unit Name</th>
                  <th className="px-6 py-4 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {storeRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">{row.department}</td>
                    <td className="px-6 py-4">{row.unitType}</td>
                    <td className="px-6 py-4">{row.unitName}</td>
                    <td className="px-6 py-4 text-center">
                      <button
  onClick={() => setSelectedUser(row.details)}
  className="inline-flex items-center justify-center rounded-full p-2
             text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition"
  title="View Details"
>
  <Eye size={18} />
</button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ================== EXISTING TABLE (UNCHANGED) ================== */
          <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-slate-700 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 text-left">Unit Type</th>
                    <th className="px-6 py-4 text-left">Unit Name</th>
                    <th className="px-6 py-4 text-left">Location</th>
                    <th className="px-6 py-4 text-left">District</th>
                    <th className="px-6 py-4 text-left">Store</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredBranches.map((branch, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {branch.branchType}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {branch.branchName}
                      </td>
                      <td className="px-6 py-4">{branch.location}</td>
                      <td className="px-6 py-4">{branch.district}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {storeMap[branch.storeCode] || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================== DETAILS POPUP ================== */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-xl mx-4 rounded-2xl bg-white shadow-xl">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  Unit Details
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">

                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium text-gray-800">
                      {selectedUser.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Designation</p>
                    <p className="font-medium text-gray-800">
                      {selectedUser.designation}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Contact</p>
                    <p className="font-medium text-gray-800">
                      {selectedUser.contact}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Mobile</p>
                    <p className="font-medium text-gray-800">
                      {selectedUser.mobile}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">District</p>
                    <p className="font-medium text-gray-800">
                      {selectedUser.district}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-medium text-gray-800">
                      {selectedUser.location}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-gray-500">Address</p>
                    <p className="font-medium text-gray-800 leading-relaxed">
                      {selectedUser.address}
                    </p>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BranchStores;

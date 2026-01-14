import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../services/api';
import {
  Building2,
  MapPin,
  User,
  LocateFixed,
  Phone,
  Save,
  X,
  Map as MapIcon,
  Pencil,
  Key,
  Eye,
  Map,
  BadgeInfo,
  AtSign
} from 'lucide-react';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.js";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});



const Stores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showMapping, setShowMapping] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [errors, setErrors] = useState({});
  const [showMap, setShowMap] = useState(true);
  const [mapPosition, setMapPosition] = useState([13.0827, 80.2707]); // Default to Chennai
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.L) {
      // Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_BASE_URL}/user/stores`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (response.ok && !result.error) {
          setStores(result.data || []);
        } else {
          setError(result.message || 'Failed to fetch stores');
        }
      } catch (err) {
        setError('Network error occurred while fetching stores');
        console.error('Error fetching stores:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  const formatStoresCount = (count) => {
    return `${count} Customer${count === 1 ? "" : "s"}`;
  };

  const toggleRowExpansion = (storeId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(storeId)) {
      newExpandedRows.delete(storeId);
    } else {
      newExpandedRows.add(storeId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleMappingToggle = () => {
    setShowMapping(!showMapping);
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-8"></div>
              <div className="h-5 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2"></path>
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No stores found</h3>
      <p className="text-gray-500">There are no stores configured in your account.</p>
    </div>
  );

  const ErrorState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading stores</h3>
      <p className="text-gray-500 mb-4">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  const handleStoreUpdate = async () => {
    const token = localStorage.getItem('authToken');

    // Validate all fields
    const newErrors = {};

    if (!editValues.name.trim()) newErrors.name = 'Store name is required';
    if (!editValues.district.trim()) newErrors.district = 'District is required';
    if (!editValues.manager.trim()) newErrors.manager = 'Manager name is required';
    if (!editValues.address.trim()) newErrors.address = 'Address is required';

    // Validate location coordinates
    if (!editValues.location.trim()) {
      newErrors.location = 'Location coordinates are required';
      alert('Please select a location on the map before saving!');
      return;
    } else {
      // Validate coordinate format (lat,lng)
      const coords = editValues.location.split(',');
      if (coords.length !== 2) {
        newErrors.location = 'Invalid location format';
        alert('Please select a valid location on the map!');
        return;
      }

      const lat = parseFloat(coords[0].trim());
      const lng = parseFloat(coords[1].trim());

      if (isNaN(lat) || isNaN(lng)) {
        newErrors.location = 'Invalid coordinates';
        alert('Please select a valid location on the map!');
        return;
      }

      // Check if coordinates are within reasonable bounds
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        newErrors.location = 'Coordinates out of range';
        alert('Please select a valid location on the map!');
        return;
      }
    }

    if (!editValues.contact.trim()) {
      newErrors.contact = 'Contact number is required';
    } else if (!/^\d{10}$/.test(editValues.contact.trim())) {
      newErrors.contact = 'Enter a valid 10-digit contact number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({}); // Clear errors
    const payload = {
      name: editValues.name,
      brand: editValues.brand,
      type: editValues.type,
      district: editValues.district,
      manager: editValues.manager,
      contact: editValues.contact,
      location: editValues.location,
      address: editValues.address,
      username: editValues.username, // now just store_id
      registration_id: editValues.registration_id, // ADD THIS
    };
    try {
      const response = await fetch(`${API_BASE_URL}/user/${editingStoreId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        alert('Store updated successfully');
        setEditingStoreId(null);
        setShowMap(true);

        // Reload list
        const res = await fetch(`${API_BASE_URL}/user/stores`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setStores(data.data || []);
      } else {
        alert(result.message || 'Update failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating store');
    }
  };

  const toggleMapView = () => {
    setShowMap(!showMap);
    if (!showMap) {
      // Parse existing location if available
      if (editValues.location) {
        const coords = editValues.location.split(',');
        if (coords.length === 2) {
          const lat = parseFloat(coords[0]);
          const lng = parseFloat(coords[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            setMapPosition([lat, lng]);
          }
        }
      }
    }
  };


  // Initialize map when showMap becomes true
  useEffect(() => {
    if (editingStoreId && typeof window !== "undefined" && L) {
      setTimeout(() => {
        const mapContainer = document.getElementById("location-map");
        if (mapContainer && !mapRef.current) {
          let initialPosition = mapPosition;

          // ✅ If location exists, use it
          if (editValues.location) {
            const coords = editValues.location.split(",");
            if (coords.length === 2) {
              const lat = parseFloat(coords[0]);
              const lng = parseFloat(coords[1]);
              if (!isNaN(lat) && !isNaN(lng)) {
                initialPosition = [lat, lng];
                setMapPosition([lat, lng]);
              }
            }
          } else {
            // ✅ If no location in response, use GPS
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                initialPosition = [latitude, longitude];
                setMapPosition([latitude, longitude]);
                setEditValues((prev) => ({
                  ...prev,
                  location: `${latitude},${longitude}`,
                }));
              });
            }
          }

          // ✅ Initialize Map
          const map = L.map("location-map").setView(initialPosition, 13);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
          }).addTo(map);

          const marker = L.marker(initialPosition, { draggable: true }).addTo(map);

          // ✅ Add Search control
          const geocoder = L.Control.geocoder({
            defaultMarkGeocode: false,
          })
            .on("markgeocode", function (e) {
              const { center } = e.geocode;
              map.setView(center, 15);
              marker.setLatLng(center);
              setMapPosition([center.lat, center.lng]);
              setEditValues((prev) => ({
                ...prev,
                location: `${center.lat},${center.lng}`,
              }));
            })
            .addTo(map);

          // ✅ Marker drag event
          marker.on("dragend", async (e) => {
            const position = e.target.getLatLng();
            setMapPosition([position.lat, position.lng]);
            setEditValues((prev) => ({
              ...prev,
              location: `${position.lat},${position.lng}`,
            }));
          });

          // ✅ Map click event
          map.on("click", async (e) => {
            marker.setLatLng(e.latlng);
            setMapPosition([e.latlng.lat, e.latlng.lng]);
            setEditValues((prev) => ({
              ...prev,
              location: `${e.latlng.lat},${e.latlng.lng}`,
            }));
          });

          mapRef.current = map;
          markerRef.current = marker;
        }
      }, 100);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [editingStoreId, editValues.location]);


  const [showAddStore, setShowAddStore] = useState(false);
  const [newStore, setNewStore] = useState({
    name: "",
    brand: "",
    type: "",
    district: "",
    manager: "",
    contact: "",
    address: "",
    username: "",      // now represents store_id
    registration_id: "", // NEW FIELD
  });
  // For Add Store map
  const [addMapPosition, setAddMapPosition] = useState([13.0827, 80.2707]); // Default Chennai
  const addMapRef = useRef(null);
  const addMarkerRef = useRef(null);

  const handleAddStore = async () => {
    try {
      const token = localStorage.getItem("authToken");

const res = await fetch(`${API_BASE_URL}user/store`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newStore,
          username: newStore.username, // ✅ send as-is
          location: newStore.location,
        }),
      });

      const result = await res.json();

      if (res.ok && !result.error) {
        alert("✅ Store added successfully!");

        // Reset form
        setNewStore({
          name: "",
          brand: "",    // ✅ renamed from society
          type: "",
          district: "",
          manager: "",
          contact: "",
          address: "",
          username: "", // ✅ reset username field
        });

        setShowAddStore(false);

        // refresh stores list
        const reload = await fetch(`${API_BASE_URL}/user/stores`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const reloadData = await reload.json();
        setStores(reloadData.data || []);
      } else {
        alert(result.message || "Failed to add store");
      }
    } catch (error) {
      console.error("Error adding store:", error);
      alert("Error adding store. Please try again.");
    }
  };



  const [districts, setDistricts] = useState([]);
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const token = localStorage.getItem("authToken"); // or however you store your token
        const res = await fetch(`${API_BASE_URL}/master/district`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed with status ${res.status}`);
        }

        const data = await res.json();
        setDistricts(data.data || []); // ✅ use only "data" array
      } catch (error) {
        console.error("Failed to fetch districts:", error);
        setDistricts([]);
      }
    };

    fetchDistricts();
  }, []);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/user/${selectedStoreId}/password/reset`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ new: newPassword }),
      });

      if (!res.ok) throw new Error("Failed to reset password");

      alert("Password reset successfully!");
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Failed to reset password");
    }
  };
  const [viewingStore, setViewingStore] = useState(null);


  // Initialize Add Store map
  useEffect(() => {
    if (showAddStore) {
      setTimeout(() => {
        if (!addMapRef.current) {
          const map = L.map("add-store-map").setView(addMapPosition, 13);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
          }).addTo(map);

          // Marker
          const marker = L.marker(addMapPosition, { draggable: true }).addTo(map);

          // GPS location
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
              const { latitude, longitude } = pos.coords;
              map.setView([latitude, longitude], 14);
              marker.setLatLng([latitude, longitude]);
              setAddMapPosition([latitude, longitude]);
              setNewStore((prev) => ({ ...prev, location: `${latitude},${longitude}` }));
            });
          }

          // Drag marker
          marker.on("dragend", (e) => {
            const { lat, lng } = e.target.getLatLng();
            setAddMapPosition([lat, lng]);
            setNewStore((prev) => ({ ...prev, location: `${lat},${lng}` }));
          });

          // Click on map
          map.on("click", (e) => {
            marker.setLatLng(e.latlng);
            setAddMapPosition([e.latlng.lat, e.latlng.lng]);
            setNewStore((prev) => ({ ...prev, location: `${e.latlng.lat},${e.latlng.lng}` }));
          });

          // Search control
          const geocoder = L.Control.geocoder({
            defaultMarkGeocode: false,
          })
            .on("markgeocode", function (e) {
              const { center } = e.geocode;
              map.setView(center, 15);
              marker.setLatLng(center);
              setAddMapPosition([center.lat, center.lng]);
              setNewStore((prev) => ({ ...prev, location: `${center.lat},${center.lng}` }));
            })
            .addTo(map);

          addMapRef.current = map;
          addMarkerRef.current = marker;
        }
      }, 100);
    }

    return () => {
      if (addMapRef.current) {
        addMapRef.current.remove();
        addMapRef.current = null;
        addMarkerRef.current = null;
      }
    };
  }, [showAddStore]);
  useEffect(() => {
    if (viewingStore && viewingStore.location && typeof window !== "undefined" && L) {
      setTimeout(() => {
        const mapContainer = document.getElementById("view-store-map");
        if (mapContainer) {
          const coords = viewingStore.location.split(",");
          if (coords.length === 2) {
            const lat = parseFloat(coords[0]);
            const lng = parseFloat(coords[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
              const map = L.map("view-store-map").setView([lat, lng], 13);

              L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap contributors",
              }).addTo(map);

              L.marker([lat, lng]).addTo(map)
                .bindPopup(viewingStore.name || "Store Location")
                .openPopup();
            }
          }
        }
      }, 100);
    }

    return () => {
      const mapContainer = document.getElementById("view-store-map");
      if (mapContainer && mapContainer._leaflet_id) {
        mapContainer._leaflet_id = null;
      }
    };
  }, [viewingStore]);



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {showMapping ? 'Store Mapping' : showAddStore ? 'Add Store' : 'RCS Stores'}
            </h1>

            {!loading && stores.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 flex items-center space-x-2 text-sm font-medium text-gray-900">
                  <span className="text-gray-500">Total Stores:</span>
                  <span>{stores.length}</span>
                </div>

                {/* Mapping Button */}
                {/* {!showAddStore && (
          <button
            onClick={() => setShowMapping(!showMapping)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {showMapping ? '<< Back to Stores' : 'Mapping >>'}
          </button>
        )} */}

                {/* Add / Back Button */}
                {showAddStore ? (
                  <button
                    onClick={() => setShowAddStore(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    ← Back
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAddStore(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Add Store
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {showAddStore ? (
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">Add New Store</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Type Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newStore.type}
                    onChange={(e) => setNewStore({ ...newStore, type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300"
                  >
                    <option value="">-- Select Type --</option>
                    <option value="DCCWS">DCCWS</option>
                    <option value="PCS">PCS</option>
                  </select>
                </div>

                {/* Store Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                  <input
                    type="text"
                    value={newStore.name}
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300"
                  />
                </div>
           

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Store ID</label>
                    <input
                      type="text"
                      value={newStore.username}
                      onChange={(e) => setNewStore({ ...newStore, username: e.target.value })}
                      placeholder="Enter store ID"
                      className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300"
                    />
             
                </div>
              </div>
              {/* Row 2: Brand + District */}
              <div className="grid grid-cols-5 gap-6 mt-6">
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={newStore.brand}
                    onChange={(e) => setNewStore({ ...newStore, brand: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <select
                    value={newStore.district || ""}
                    onChange={(e) => setNewStore({ ...newStore, district: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300"
                  >
                    <option value="">-- Select District --</option>
                    {districts.map((district, index) => (
                      <option key={index} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
         {/* Row 3: Registration ID + Store Official Name + Contact */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Registration ID</label>
    <input
      type="text"
      value={newStore.registration_id || ""}
      onChange={(e) => setNewStore({ ...newStore, registration_id: e.target.value })}
      className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300"
    />
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Store Official Name</label>
    <input
      type="text"
      value={newStore.manager || ""}
      onChange={(e) => setNewStore({ ...newStore, manager: e.target.value })}
      className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300"
    />
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
    <input
      type="text"
      inputMode="numeric"
      maxLength={10}
      value={newStore.contact || ""}
      onChange={(e) => {
        const input = e.target.value.replace(/\D/g, "");
        if (input.length <= 10) {
          setNewStore({ ...newStore, contact: input });
        }
      }}
      className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300"
    />
  </div>
</div>
              {/* Row 4: Address Full Width */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={newStore.address || ""}
                  onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300"
                />
              </div>
              {/* Map for selecting store location */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Location
                </label>
                <div
                  id="add-store-map"
                  className="h-64 w-full border border-gray-300 rounded-lg"
                  style={{ zIndex: 1 }}
                ></div>
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Selected coordinates:</strong> {newStore.location || "None selected"}
                </div>
              </div>
              {/* Buttons */}
              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={() => setShowAddStore(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStore}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  Save Store
                </button>
              </div>
            </div>
          ) : editingStoreId ? (
            <div className="p-6 w-full bg-white border border-gray-200 shadow-sm rounded-md">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Update <span className="text-indigo-600">"{editValues.name}"</span> Profile
              </h2>

              {/* ===== Row 1: Type + Store Name + Username ===== */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={editValues.type || ""}
                    onChange={(e) => setEditValues({ ...editValues, type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300"
                  >
                    <option value="">-- Select Type --</option>
                    <option value="DCCWS">DCCWS</option>
                    <option value="PCS">PCS</option>
                  </select>
                </div>

                {/* Store Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                  <input
                    type="text"
                    value={editValues.name}
                    onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>


                {/* Store ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store ID</label>
                  <input
                    type="text"
                    value={editValues.username || ""}
                    onChange={(e) => setEditValues({ ...editValues, username: e.target.value })}
                    placeholder="Enter store ID"
                    className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300"
                  />
                </div>

              </div>

              {/* ===== Row 2: Brand + District ===== */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={editValues.brand}
                    onChange={(e) => setEditValues({ ...editValues, brand: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300`}
                  />
                </div>


                {/* District */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <select
                    value={editValues.district || ""}
                    onChange={(e) => setEditValues({ ...editValues, district: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300"
                  >
                    <option value="">-- Select District --</option>
                    {districts.map((district, index) => (
                      <option key={index} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

     {/* ===== Row 3: Registration ID + Manager + Contact ===== */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
  {/* Registration ID */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Registration ID</label>
    <input
      type="text"
      value={editValues.registration_id || ""}
      onChange={(e) => setEditValues({ ...editValues, registration_id: e.target.value })}
      className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300"
    />
  </div>

  {/* Manager */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Store Official Name</label>
    <input
      type="text"
      value={editValues.manager}
      onChange={(e) => setEditValues({ ...editValues, manager: e.target.value })}
      className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300`}
    />
  </div>

  {/* Contact */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
    <input
      type="text"
      inputMode="numeric"
      maxLength={10}
      value={editValues.contact}
      onChange={(e) => {
        const input = e.target.value.replace(/\D/g, "");
        if (input.length <= 10) {
          setEditValues({ ...editValues, contact: input });
        }
      }}
      className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300`}
    />
  </div>
</div>
              {/* ===== Row 4: Address (full width) ===== */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={editValues.address}
                  onChange={(e) => setEditValues({ ...editValues, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 border-gray-300"
                />
              </div>


              {/* Map Section */}

              <div className="mt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-2">
                    <MapIcon size={16} />
                    Interactive Location Selector
                  </h3>
                  <p className="text-sm text-blue-700">
                    Click on the map or drag the marker to select location. District will auto-populate based on selected location.
                  </p>
                </div>

                <div
                  id="location-map"
                  className="h-48 w-full border border-gray-300 rounded-lg"
                  style={{ height: '200px', zIndex: 1 }}
                ></div>

                {/* <div className="mt-3 text-sm text-gray-600">
                                    <strong>Selected coordinates:</strong> {editValues.location || 'None selected'}
                                    {editValues.district && (
                                        <span className="ml-4">
                                            <strong>Detected district:</strong> {editValues.district}
                                        </span>
                                    )}
                                </div> */}
              </div>
              <button
                type="button"
                onClick={toggleMapView}
                className={`px-3 py-2 border rounded-md transition-colors ${showMap ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                title="Toggle map view"
              >
                <MapIcon size={18} />
              </button>

              {/* Buttons */}
              <div className="mt-8 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setEditingStoreId(null);
                    setShowMap(false);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                >
                  <X size={18} /> Cancel
                </button>
                <button
                  onClick={handleStoreUpdate}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                >
                  <Save size={18} /> Save
                </button>
              </div>
            </div>
          ) : viewingStore ? (   // ✅ NEW VIEW MODE
            <div className="p-6 bg-white border rounded-lg shadow-sm relative">
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 px-4 py-3 rounded-md bg-gray-100 border-b">
                  <h2 className="text-2xl font-bold text-gray-800">Store Details</h2>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingStore(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition text-base font-semibold"
                    >
                      ← Back
                    </button>

                    <button
                      onClick={() => {
                        setEditingStoreId(viewingStore.id);
                        setEditValues({
                          name: viewingStore.name || '',
                          brand: viewingStore.brand || '',
                          type: viewingStore.type || '',
                          district: viewingStore.district || '',
                          manager: viewingStore.manager || '',
                          contact: viewingStore.contact || '',
                          location: viewingStore.location || '',
                          address: viewingStore.address || '',
                          username: viewingStore.username || '',
                          registration_id: viewingStore.registration_id || '', // ADD THIS LINE
                        });
                        setViewingStore(null);
                        setShowMap(false);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
                      title="Edit Store"
                    >
                      <Pencil size={16} />
                      <span className="text-sm font-medium">Edit</span>
                    </button>
                  </div>
                </div>


                {/* Info Rows */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-500 w-40">Type:</span>
                    <span className="text-gray-900 font-medium">{viewingStore.type || "N/A"}</span>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-sm text-gray-500 w-40">Store Name:</span>
                    <span className="text-gray-900 font-medium">{viewingStore.name || "N/A"}</span>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-sm text-gray-500 w-40">Store ID:</span>
                    <span className="text-gray-900 font-medium">{viewingStore.username || "N/A"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-500 w-40">Registration ID:</span>
                    <span className="text-gray-900 font-medium">{viewingStore.registration_id || "N/A"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-500 w-40">Brand:</span>
                    <span className="text-gray-900 font-medium">{viewingStore.brand || "N/A"}</span>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-sm text-gray-500 w-40">District:</span>
                    <span className="text-gray-900 font-medium">{viewingStore.district || "N/A"}</span>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-sm text-gray-500 w-40">Store Official Name:</span>
                    <span className="text-gray-900 font-medium">{viewingStore.manager || "N/A"}</span>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-sm text-gray-500 w-40">Contact:</span>
                    <span className="text-gray-900 font-medium">{viewingStore.contact || "N/A"}</span>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-sm text-gray-500 w-40">Address:</span>
                    <span className="text-gray-900 font-medium">{viewingStore.address || "N/A"}</span>
                  </div>
                </div>

                {/* Map Section */}
                {viewingStore.location && (
                  <div className="mt-6">
                    <label className="block text-sm text-gray-500 mb-2">Store Location</label>
                    <div
                      id="view-store-map"
                      className="h-64 w-full border border-gray-300 rounded-lg"
                      style={{ zIndex: 1 }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          ) : loading ? (
            <div className="p-6">
              <LoadingSkeleton />
            </div>
          ) : error ? (
            <ErrorState />
          ) : stores.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-1">S.No</div>
                    <div className="col-span-2">Store Name</div>
                    <div className="col-span-1">Store ID</div>
                    <div className="col-span-2">District</div>
                    <div className="col-span-2">Manager</div>
                    <div className="col-span-1">Contact</div>
                    <div className="col-span-2">Servicing</div>
                    <div className="col-span-1">Action</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                  {stores.map((store, index) => (
                    <React.Fragment key={store.id}>
                      <div className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                        <div className="grid grid-cols-12 gap-4 items-center">

                          {/* Serial Number */}
                          <div className="col-span-1">
                            <span className="text-sm font-medium text-gray-900">
                              {index + 1}
                            </span>
                          </div>

                          {/* Store Name */}
                          <div className="col-span-2">
                            <div className="text-sm font-medium text-gray-900">{store.name}</div>
                          </div>

                          {/* Username */}
                          <div className="col-span-1">
                            <span className="text-sm text-gray-900 font-medium">{store.username}</span>
                          </div>

                          {/* District */}
                          <div className="col-span-2">
                            <span className="text-sm text-gray-800">
                              {store.district || <span className="italic text-gray-400">N/A</span>}
                            </span>
                          </div>

                          {/* Manager */}
                          <div className="col-span-2">
                            <span className="text-sm text-gray-800">
                              {store.manager || <span className="italic text-gray-400">N/A</span>}
                            </span>
                          </div>

                          {/* Contact */}
                          <div className="col-span-1">
                            <span className="text-sm text-gray-800">
                              {store.contact || <span className="italic text-gray-400">N/A</span>}
                            </span>
                          </div>

                          {/* Servicing (Toggle) */}
                          <div className="col-span-2">
                            <button
                              onClick={() => toggleRowExpansion(store.id)}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer"
                            >
                              {formatStoresCount(store.mapping?.length || 0)}
                              <svg
                                className={`w-4 h-4 ml-2 transition-transform ${expandedRows.has(store.id) ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>

                          {/* Action */}
                          <div className="col-span-1 flex items-center gap-3">
                            {/* View Icon */}
                            <button
                              onClick={() => setViewingStore(store)}
                              className="text-green-600 hover:text-green-800 transition"
                              title="View Store"
                            >
                              <Eye size={18} />
                            </button>

                            {/* Edit Icon */}
                            {/* <button
                              onClick={() => {
                                if (editingStoreId === store.id) {
                                  setEditingStoreId(null);
                                  setShowMap(false);
                                } else {
                                  setEditingStoreId(store.id);
                                  setEditValues({
                                    name: store.name,
                                    brand: store.brand || '',
                                    type: store.type || '',
                                    district: store.district || '',
                                    manager: store.manager || '',
                                    contact: store.contact || '',
                                    location: store.location || '',
                                    address: store.address || '',
                                    username: store.username || '',
                                  });
                                  setShowMap(false);
                                }
                              }}
                              className="text-yellow-600 hover:text-yellow-800 transition"
                              title="Edit Store"
                            >
                              <Pencil size={18} />
                            </button> */}

                            {/* Change Password Icon */}
                            <button
                              onClick={() => {
                                setSelectedStoreId(store.id);
                                setShowPasswordModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 transition"
                              title="Reset Password"
                            >
                              <Key size={18} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Row */}
                      {expandedRows.has(store.id) &&
                        store.mapping &&
                        store.mapping.length > 0 && (
                          <div className="overflow-hidden transition-all duration-300 ease-out">
                            <div className="bg-gradient-to-br from-slate-50 to-gray-50 border-t border-gray-200/60">
                              {/* Header row with subtle styling */}
                              <div className="px-6 py-3 bg-white/40 backdrop-blur-sm border-b border-gray-200/40">
                                <div className="flex text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  <div className="w-1/3 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
                                    Department
                                  </div>
                                  <div className="w-1/3 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full opacity-60"></div>
                                    Branch Type
                                  </div>
                                  <div className="w-1/3 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-amber-400 rounded-full opacity-60"></div>
                                    Branch
                                  </div>
                                </div>
                              </div>

                              {/* Data rows with enhanced styling */}
                              <div className="px-6 py-2 space-y-1">
                                {store.mapping.map((mapping, idx) => (
                                  <div
                                    key={idx}
                                    className="group flex text-sm text-gray-700 py-3 px-4 rounded-lg 
                                                                                     bg-white/60 backdrop-blur-sm border border-gray-100/50
                                                                                     hover:bg-white/80 hover:border-gray-200/80 hover:shadow-sm
                                                                                     transition-all duration-200 ease-out
                                                                                     transform hover:translate-x-1"
                                    style={{
                                      animationDelay: `${idx * 50}ms`,
                                      animation: 'slideInUp 0.4s ease-out forwards'
                                    }}
                                  >
                                    <div className="w-1/3 font-medium text-gray-800 flex items-center gap-3">
                                      <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-blue-500 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"></div>
                                      {mapping.department || (
                                        <span className="text-gray-400 italic font-normal">No department</span>
                                      )}
                                    </div>
                                    <div className="w-1/3 text-gray-600 flex items-center gap-3">
                                      <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"></div>
                                      {mapping.type || (
                                        <span className="text-gray-400 italic">No branch type</span>
                                      )}
                                    </div>
                                    <div className="w-1/3 text-gray-600 flex items-center gap-3">
                                      <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-amber-500 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"></div>
                                      {mapping.branch || (
                                        <span className="text-gray-400 italic">No branch</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Bottom gradient fade */}
                              <div className="h-2 bg-gradient-to-b from-transparent to-gray-50/50"></div>
                            </div>
                          </div>
                        )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </>

          )}
        </div>




        {/* Footer */}
        {!loading && stores.length > 0 && !showMapping && (
          <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
            <div>
              Showing {stores.length} of {stores.length} stores
            </div>
            <div className="flex items-center space-x-2">
              <span>Last updated:</span>
              <span className="font-medium">{new Date().toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Reset Password</h2>

            {/* New Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-indigo-500 border-gray-300"
              />
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-indigo-500 border-gray-300"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordReset}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Stores;
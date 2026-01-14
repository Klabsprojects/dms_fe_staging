import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';

const MastersPage = () => {
  const [activeTab, setActiveTab] = useState('eater-type');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingInventory, setEditingInventory] = useState(false);
  const [departmentName, setDepartmentName] = useState('');
  const [departmentLogo, setDepartmentLogo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Eater Type State
  const [eaterTypes, setEaterTypes] = useState([]);
  const [newEaterType, setNewEaterType] = useState({
    name: '',
    hasSub: false,
    sub: []
  });
  const [subTypeName, setSubTypeName] = useState('');
  const [departmentNameTamil, setDepartmentNameTamil] = useState('');
  //Edit
  const [editingEaterTypeIndex, setEditingEaterTypeIndex] = useState(null);
  const [editEaterType, setEditEaterType] = useState({ name: '', hasSub: false, sub: [] });

  // Accounts Head State
  const [accountsData, setAccountsData] = useState([]);
  const [editingAccountIndex, setEditingAccountIndex] = useState(null);
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ code: '', name: '' });
  const [editAccount, setEditAccount] = useState({ code: '', name: '' });
  // Items List State
  const [itemsData, setItemsData] = useState([]);
  const [tempItemChanges, setTempItemChanges] = useState({});
  const [selectAllRequired, setSelectAllRequired] = useState(false);

  // Inventory Master State
  const [inventoryMaster, setInventoryMaster] = useState({
    stock: '',
    order: '',
    groceryIndent: '',
    vegMeatDairyIndent: '',
    id: null
  });
// Items Selection State
const [itemsSelectionTab, setItemsSelectionTab] = useState('lowest-cost');
const [brandWiseItems, setBrandWiseItems] = useState([]);
const [highestCostItems, setHighestCostItems] = useState([]);
const [showItemSelectionPopup, setShowItemSelectionPopup] = useState(false);
const [currentSelectionSection, setCurrentSelectionSection] = useState('');
const [availableItemsForSelection, setAvailableItemsForSelection] = useState([]);
const [selectedItemsInPopup, setSelectedItemsInPopup] = useState([]);
const [loadingItemsPopup, setLoadingItemsPopup] = useState(false);
  // Fetch data when component mounts or tab changes
// Fetch data when component mounts or tab changes
// Fetch data when component mounts or tab changes
  useEffect(() => {
    if (activeTab === 'eater-type') {
      fetchEaterTypes();
    } else if (activeTab === 'inventory-master') {
      fetchInventoryMaster();
    } else if (activeTab === 'accounts-head') {
      fetchAccountsData();
    } else if (activeTab === 'items-list') {
      fetchItemsData();
      fetchAccountsData(); // Also fetch accounts for dropdown
    } else if (activeTab === 'items-selection') {
      fetchItemGroups(); // Fetch item groups when tab is opened
    }
  }, [activeTab]);
  // Reset Select All when search filter changes
  useEffect(() => {
    setSelectAllRequired(false);
  }, [searchQuery]);


  // Fetch Eater Types
  const fetchEaterTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/master/eater-type`, {
        headers: {
          'Authorization': localStorage.getItem('authToken')
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Eater Types Response:', result);

        if (result.error === false && Array.isArray(result.data)) {
          setEaterTypes(result.data);
        } else {
          console.warn('Unexpected data format:', result);
          setEaterTypes([]);
        }
      } else {

      }
    } catch (err) {
      console.error('Error fetching eater types:', err);
      setError('Network error while fetching eater types');
      setEaterTypes([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Inventory Master
  const fetchInventoryMaster = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/master/inventory`, {
        headers: {
          'Authorization': localStorage.getItem('authToken')
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Inventory Master Response:', result);

        if (result.error === false && Array.isArray(result.data) && result.data.length > 0) {
          const inventoryData = result.data[0]; // Get first item from array
          setInventoryMaster({
            stock: inventoryData.stock || '',
            order: inventoryData.order || '',
            groceryIndent: inventoryData.groceryIndent || '',
            vegMeatDairyIndent: inventoryData.vegMeatDairyIndent || '',
            id: inventoryData.id || null,
            logo: inventoryData.logo || '' // ✅ ADD THIS LINE if it's missing
          });
          setDepartmentName(inventoryData.banner_name || '');
          setDepartmentNameTamil(inventoryData.banner_name_ta || '');
        }
      } else {

      }
    } catch (err) {
      console.error('Error fetching inventory master:', err);
      setError('Network error while fetching inventory master');
    } finally {
      setLoading(false);
    }
  };
  // Fetch Accounts Data
  const fetchAccountsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}master/dep/accounts`, {
        headers: {
          'Authorization': localStorage.getItem('authToken')
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Accounts Data Response:', result);

        if (result.error === false && result.data && result.data.accounts) {
          // Convert accounts object to array
          const accountsArray = Object.entries(result.data.accounts).map(([code, name]) => ({
            code,
            name
          }));
          setAccountsData(accountsArray);
        } else {
          console.warn('Unexpected accounts data format:', result);
          setAccountsData([]);
        }
      } else {
        setError('Failed to fetch accounts data');
        setAccountsData([]);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Network error while fetching accounts');
      setAccountsData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Items Data
  const fetchItemsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/master/dep/items`, {
        headers: {
          'Authorization': localStorage.getItem('authToken')
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Items Data Response:', result);

        if (result.error === false && result.data && Array.isArray(result.data.items)) {
          // Auto-check "required" if item has an account
          const processedItems = result.data.items.map(item => ({
            ...item,
            required: item.account ? 1 : (item.required || 0)
          }));
          setItemsData(processedItems);
        } else {
          console.warn('Unexpected items data format:', result);
          setItemsData([]);
        }
      } else {
        setError('Failed to fetch items data');
        setItemsData([]);
      }
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Network error while fetching items');
      setItemsData([]);
    } finally {
      setLoading(false);
    }
  };
  // Add Eater Type
  const handleAddEaterType = async (e) => {
    e.preventDefault();
    if (!newEaterType.name.trim()) {
      setError('Please enter eater type name');
      return;
    }

    // If hasSub is true but no sub items, show error
    if (newEaterType.hasSub && newEaterType.sub.length === 0) {
      setError('Please add at least one sub type');
      return;
    }

    const nameExists = eaterTypes.some(
      (et) => et.name.trim().toLowerCase() === newEaterType.name.trim().toLowerCase()
    );

    if (nameExists) {
      setError('Eater type with this name already exists.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        name: newEaterType.name
      };

      // Only add sub array if hasSub is true and there are sub items
      if (newEaterType.hasSub && newEaterType.sub.length > 0) {
        payload.sub = newEaterType.sub;
      }

      const response = await fetch(`${API_BASE_URL}/master/eater-type`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('authToken')
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.error === false) {
        setSuccess('Eater type added successfully!');
        setNewEaterType({ name: '', hasSub: false, sub: [] });
        setSubTypeName('');
        fetchEaterTypes();
      } else {
        setError(result.message || 'Failed to add eater type');
      }
    } catch (err) {
      setError('Network error while adding eater type');
    } finally {
      setLoading(false);
    }
  };

  // Update Inventory Master
  const handleUpdateInventoryMaster = async (e) => {
    e.preventDefault();

    if (!inventoryMaster.stock) {
      setError('Please fill in all fields');
      return;
    }

    if (isNaN(Number(inventoryMaster.stock))) {
      setError('Please enter valid numbers');
      return;
    }

    if (!inventoryMaster.id) {
      setError('Inventory ID not found. Please refresh and try again.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        stock: parseInt(inventoryMaster.stock),
        groceryIndent: parseInt(inventoryMaster.groceryIndent),
        vegMeatDairyIndent: parseInt(inventoryMaster.vegMeatDairyIndent)
      };

      const response = await fetch(`${API_BASE_URL}/master/dep/${inventoryMaster.id}/inventory`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('authToken')
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.error === false) {
        setSuccess('Inventory master updated successfully!');
        setTimeout(() => setSuccess(''), 4000); // ✅ auto-hide success message

        setEditingInventory(false); // Exit edit mode
        fetchInventoryMaster(); // Refresh the data
      } else {
        setError(result.message || 'Failed to update inventory master');
      }
    } catch (err) {
      setError('Network error while updating inventory master');
    } finally {
      setLoading(false);
    }
  };

  const addSubType = () => {
    if (!subTypeName.trim()) {
      setError('Please enter sub type name');
      return;
    }

    if (newEaterType.sub.includes(subTypeName.trim())) {
      setError('Sub type already exists');
      return;
    }

    setNewEaterType(prev => ({
      ...prev,
      sub: [...prev.sub, subTypeName.trim()]
    }));
    setSubTypeName('');
    setError('');
  };

  const removeSubType = (index) => {
    setNewEaterType(prev => ({
      ...prev,
      sub: prev.sub.filter((_, i) => i !== index)
    }));
  };

  // Clear messages
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

useEffect(() => {
    fetchInventoryMaster(); // always fetch on load
  }, []);

  // Fetch item groups when inventory master is loaded (for Items Selection tab)
  useEffect(() => {
    if (inventoryMaster.id) {
      fetchItemGroups();
    }
  }, [inventoryMaster.id]);

  const uploadLogoImmediately = async (file) => {
    if (!inventoryMaster.id) {
      setError("Inventory ID not found.");
      return;
    }

    const formData = new FormData();
    formData.append("logo", file);

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // ✅ CORRECT: POST method for upload
      const response = await fetch(`${API_BASE_URL}/master/dep/${inventoryMaster.id}/upload`, {
        method: 'PUT',  // ✅ POST not PUT!
        headers: {
          'Authorization': localStorage.getItem('authToken'),
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.error === false) {
        setSuccess("Logo uploaded successfully!");
        fetchInventoryMaster(); // ✅ Refresh to get updated logo path
        setDepartmentLogo(null); // Clear file input
      } else {
        setError(result.message || "Logo upload failed");
      }
    } catch (err) {
      setError("Network error during logo upload");
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleSaveDepartmentProfile = async () => {
    if (!inventoryMaster.id) {
      setError("Inventory ID not found.");
      return;
    }

    // Validate required fields
    if (!departmentName.trim() || !departmentNameTamil.trim()) {
      setError('Please fill in both department names');
      return;
    }

    const payload = {
      banner_name: departmentName,
      banner_name_ta: departmentNameTamil,
      logo: inventoryMaster.logo // ✅ Send existing logo path
    };

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // ✅ CORRECT profile endpoint
      const response = await fetch(`${API_BASE_URL}/master/dep/${inventoryMaster.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('authToken')
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.error === false) {
        setSuccess('Department profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
        fetchInventoryMaster();
      } else {
        setError(result.message || 'Failed to update department profile');
      }
    } catch (err) {
      setError("Network error during profile update");
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete Eater Type (Soft Delete)
  const handleDeleteEaterType = (index) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this eater type?');
    if (!confirmDelete) return;

    try {
      setError('');

      // Remove from local state
      const updatedEaterTypes = eaterTypes.filter((_, i) => i !== index);
      setEaterTypes(updatedEaterTypes);

      setSuccess('Eater type deleted successfully!');
      setEditingEaterTypeIndex(null);
      setEditEaterType({ name: '', hasSub: false, sub: [] });
    } catch (error) {
      console.error('Failed to delete eater type:', error);
      setError('Failed to delete eater type');
    }
  };
  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.code.trim() || !newAccount.name.trim()) {
      setError('Please enter both code and name');
      return;
    }

    const codeExists = accountsData.some(
      (acc) => acc.code.trim().toLowerCase() === newAccount.code.trim().toLowerCase()
    );

    if (codeExists) {
      setError('Account code already exists.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Add to existing accounts
      const updatedAccounts = [...accountsData, newAccount];

      // Convert array to object format for API
      const accountsObject = {};
      updatedAccounts.forEach(account => {
        accountsObject[account.code] = account.name;
      });

      const payload = {
        accounts: accountsObject
      };

      const response = await fetch(`${API_BASE_URL}/master/dep/${inventoryMaster.id}/accounts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('authToken')
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.error === false) {
        setAccountsData(updatedAccounts);
        setSuccess('Account added successfully!');
        setNewAccount({ code: '', name: '' });
        setShowAddAccountForm(false);
        setTimeout(() => setSuccess(''), 3000);
        fetchAccountsData(); // Refresh data
      } else {
        setError(result.message || 'Failed to add account');
      }
    } catch (err) {
      setError('Network error while adding account');
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (!editAccount.code.trim() || !editAccount.name.trim()) {
      setError('Please enter both code and name');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Update local state first
      const updatedAccounts = [...accountsData];
      updatedAccounts[editingAccountIndex] = editAccount;

      // Convert array to object format for API
      const accountsObject = {};
      updatedAccounts.forEach(account => {
        accountsObject[account.code] = account.name;
      });

      const payload = {
        accounts: accountsObject
      };

      const response = await fetch(`${API_BASE_URL}/master/dep/${inventoryMaster.id}/accounts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('authToken')
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.error === false) {
        setAccountsData(updatedAccounts);
        setSuccess('Account updated successfully!');
        setEditingAccountIndex(null);
        setEditAccount({ code: '', name: '' });
        setTimeout(() => setSuccess(''), 3000);
        fetchAccountsData(); // Refresh data
      } else {
        setError(result.message || 'Failed to update account');
      }
    } catch (err) {
      setError('Network error while updating account');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (index) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this account?');
    if (!confirmDelete) return;

    try {
      setLoading(true);
      setError('');

      const updatedAccounts = accountsData.filter((_, i) => i !== index);

      // Convert array to object format for API
      const accountsObject = {};
      updatedAccounts.forEach(account => {
        accountsObject[account.code] = account.name;
      });

      const payload = {
        accounts: accountsObject
      };

      const response = await fetch(`${API_BASE_URL}/master/dep/${inventoryMaster.id}/accounts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('authToken')
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.error === false) {
        setAccountsData(updatedAccounts);
        setSuccess('Account deleted successfully!');
        setEditingAccountIndex(null);
        setEditAccount({ code: '', name: '' });
        fetchAccountsData(); // Refresh data
      } else {
        setError(result.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      setError('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  // ===== ITEMS LIST FUNCTIONS =====
  const handleSaveAllItems = async () => {
    try {
      setLoading(true);
      setError('');

      // Build the complete items object with ALL items that have required=1 and an account
      const itemsObject = {};

      itemsData.forEach(item => {
        const tempChanges = tempItemChanges[item.id] || {};
        const finalRequired = tempChanges.hasOwnProperty('required') ? tempChanges.required : item.required;
        const finalAccount = tempChanges.hasOwnProperty('account') ? tempChanges.account : item.account;

        // Only include items that are required AND have an account selected
        if (finalRequired === 1 && finalAccount) {
          itemsObject[item.id.toString()] = finalAccount;
        }
      });

      const itemsPayload = {
        items: itemsObject
      };

      console.log('Saving all items payload:', itemsPayload); // Debug log

      const response = await fetch(`${API_BASE_URL}/master/dep/${inventoryMaster.id}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('authToken')
        },
        body: JSON.stringify(itemsPayload)
      });

      const result = await response.json();

      if (response.ok && result.error === false) {
        setSuccess('All items saved successfully!');
        setTimeout(() => setSuccess(''), 3000);

        // Clear all temp changes
        setTempItemChanges({});

        fetchItemsData(); // Refresh data
      } else {
        setError(result.message || 'Failed to save items');
      }
    } catch (err) {
      setError('Network error while saving items');
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAllRequired = (checked) => {
    setSelectAllRequired(checked);
    const newTempChanges = {};

    itemsData
      .filter(item => {
        const term = searchQuery.toLowerCase();

        // Match frontend display category logic
        const displayCategory =
          item.category === "food"
            ? "grocery"
            : item.category === "dailie"
              ? "veg,meat,dairy"
              : item.category?.toLowerCase();

        return (
          item.name?.toLowerCase().includes(term) ||
          displayCategory?.includes(term)
        );
      })
      .forEach(item => {
        newTempChanges[item.id] = {
          ...tempItemChanges[item.id],
          required: checked ? 1 : 0
        };
      });

    setTempItemChanges(prev => ({ ...prev, ...newTempChanges }));
  };
  // Fetch Items for Selection Popup
const fetchItemsForSelection = async () => {
  try {
    setLoadingItemsPopup(true);
    const response = await fetch(`${API_BASE_URL}/master/dep/items`, {
      headers: {
        'Authorization': localStorage.getItem('authToken')
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.error === false && result.data && Array.isArray(result.data.items)) {

      // 🔥 Remove items already selected in brand-wise section
const alreadySelectedIds = [
  ...brandWiseItems.map(i => i.id)
];

        const filteredItems = result.data.items.filter(
          item => !alreadySelectedIds.includes(item.id)
        );

        setAvailableItemsForSelection(filteredItems);
      }
    }
  } catch (err) {
    console.error('Error fetching items for selection:', err);
    setError('Failed to load items');
  } finally {
    setLoadingItemsPopup(false);
  }
};

// Handle Add Items to Section
const handleAddItemsToSection = () => {
  if (selectedItemsInPopup.length === 0) {
    setError('Please select at least one item');
    return;
  }

  const selectedItems = availableItemsForSelection.filter(item => 
    selectedItemsInPopup.includes(item.id)
  );

  // Only Brand Wise section now
  setBrandWiseItems(prev => [...prev, ...selectedItems]);

  // Reset popup state
  setShowItemSelectionPopup(false);
  setSelectedItemsInPopup([]);
  setCurrentSelectionSection('');
  setSuccess('Items added successfully!');
  setTimeout(() => setSuccess(''), 3000);
};
// Handle Remove Item from Section
const handleRemoveItemFromSection = (itemId) => {
  setBrandWiseItems(prev => prev.filter(item => item.id !== itemId));
};

// Fetch Item Groups from API
// Fetch Item Groups from API
const fetchItemGroups = async () => {
  if (!inventoryMaster.id) {
    console.warn('Inventory master ID not available yet');
    return;
  }

  try {
    setLoading(true);
    const response = await fetch(`${API_BASE_URL}/master/dep/item-group`, {
      headers: {
        'Authorization': localStorage.getItem('authToken')
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Item Groups Response:', result);

      if (result.error === false && result.data) {
        // ✅ API returns full item objects directly in brand_wise array
        const brandWiseItemsData = result.data.brand_wise || [];
        
        // ✅ Set items directly (no need to fetch again)
        setBrandWiseItems(brandWiseItemsData);
        
        console.log('Brand Wise Items Set:', brandWiseItemsData);
      }
    } else {
      console.error('Failed to fetch item groups');
    }
  } catch (err) {
    console.error('Error fetching item groups:', err);
    setError('Failed to load item groups');
  } finally {
    setLoading(false);
  }
};

const [brandOpen, setBrandOpen] = useState(true);
const handleSaveItemGroups = async () => {
  if (!inventoryMaster.id) {
    setError("Department ID not found. Please refresh the page.");
    return;
  }

  try {
    setLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      brand_wise: brandWiseItems.map(i => i.id)
    };

    const response = await fetch(`${API_BASE_URL}/master/dep/${inventoryMaster.id}/item-group`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        "Authorization": localStorage.getItem("authToken")
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok && result.error === false) {
      setSuccess("Item groups saved successfully!");
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.message || "Failed to save item groups");
    }
  } catch (err) {
    console.error("Error saving item groups:", err);
    setError("Network error while saving item groups");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => {
                  setActiveTab('eater-type');
                  clearMessages();
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'eater-type'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Eater Types
              </button>
              <button
                onClick={() => {
                  setActiveTab('inventory-master');
                  clearMessages();
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'inventory-master'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Inventory Master
              </button>
              <button
                onClick={() => { setActiveTab('department-profile'); clearMessages(); }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'department-profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600'
                  }`}
              >
                Department Profile
              </button>
              <button
                onClick={() => { setActiveTab('accounts-head'); clearMessages(); }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'accounts-head'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600'
                  }`}
              >
                Accounts Head
              </button>
              <button
                onClick={() => { setActiveTab('items-list'); clearMessages(); }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'items-list'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600'
                  }`}
              >
                Items List
              </button>
              <button
  onClick={() => { setActiveTab('items-selection'); clearMessages(); }}
  className={`py-4 px-1 border-b-2 font-medium text-sm ${
    activeTab === 'items-selection'
      ? 'border-blue-600 text-blue-600'
      : 'border-transparent text-gray-600'
  }`}
>
  Items Selection
</button>

            </nav>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
            {success}
          </div>
        )}

        {/* Eater Types Tab Content */}
        {activeTab === 'eater-type' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* List - LEFT SIDE */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Existing Eater Types
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600">Loading...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {eaterTypes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8L9 9l4 4" />
                      </svg>
                      <p>No eater types found</p>
                      <p className="text-sm">Add your first eater type using the form</p>
                    </div>
                  ) : (
                    eaterTypes.map((item, index) => (
                      <div key={item.id || item._id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-semibold text-sm">
                              {(index + 1).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <span className="text-gray-900 font-medium flex-1">{item.name}</span>
                          <button
                            className="ml-auto text-blue-600 hover:text-blue-800 text-sm"
                            onClick={() => {
                              setEditingEaterTypeIndex(index);
                              setEditEaterType({
                                name: item.name,
                                hasSub: item.sub && item.sub.length > 0,
                                sub: item.sub || [],
                              });
                              clearMessages();
                            }}
                          >
                            Edit
                          </button>


                        </div>

                        {/* Display sub types if they exist */}
                        {item.sub && item.sub.length > 0 && (
                          <div className="ml-11">
                            <p className="text-xs text-gray-600 mb-1">Sub Types:</p>
                            <div className="flex flex-wrap gap-1">
                              {item.sub.map((subType, subIndex) => (
                                <span key={subIndex} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {subType}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Add Form - RIGHT SIDE */}
            {editingEaterTypeIndex !== null ? (
              // Edit Form
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 transition-all duration-300">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Edit Eater Type
                </h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const updatedList = [...eaterTypes];
                    updatedList[editingEaterTypeIndex] = editEaterType;
                    setEaterTypes(updatedList);
                    setSuccess('Eater type updated!');
                    setEditingEaterTypeIndex(null);
                    setEditEaterType({ name: '', hasSub: false, sub: [] });
                  }}
                  className="space-y-6"
                >
                  {/* Eater Type Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Eater Type Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editEaterType.name}
                      onChange={(e) => setEditEaterType(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                      placeholder="Enter eater type name"
                      required
                    />
                  </div>

                  {/* Has Sub Types Checkbox */}
                  <div>
                    <label className="inline-flex items-center text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={editEaterType.hasSub}
                        onChange={(e) =>
                          setEditEaterType(prev => ({
                            ...prev,
                            hasSub: e.target.checked,
                            sub: e.target.checked ? prev.sub : [],
                          }))
                        }
                        className="mr-2 rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                      />
                      Enable Sub Types
                    </label>
                  </div>

                  {/* Sub Types Section */}
                  {editEaterType.hasSub && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sub Types
                      </label>

                      {editEaterType.sub.map((sub, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg mb-2"
                        >
                          <span className="text-sm text-gray-800">{sub}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditEaterType(prev => ({
                                ...prev,
                                sub: prev.sub.filter((_, index) => index !== i),
                              }))
                            }
                            className="text-red-600 text-xs hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ))}

                      {/* Add New Sub Type */}
                      <div className="flex gap-2 mt-3">
                        <input
                          type="text"
                          value={subTypeName}
                          onChange={(e) => setSubTypeName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                          placeholder="New sub type"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (subTypeName.trim()) {
                              setEditEaterType(prev => ({
                                ...prev,
                                sub: [...prev.sub, subTypeName.trim()],
                              }));
                              setSubTypeName('');
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEaterTypeIndex(null);
                        setEditEaterType({ name: '', hasSub: false, sub: [] });
                      }}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEaterType(editingEaterTypeIndex)}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                    >
                      Save Changes
                    </button>

                  </div>
                </form>
              </div>

            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Add New Eater Type
                </h2>

                <form onSubmit={handleAddEaterType}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Eater Type Name
                    </label>
                    <input
                      type="text"
                      value={newEaterType.name}
                      onChange={(e) => {
                        setNewEaterType(prev => ({ ...prev, name: e.target.value }));
                        clearMessages();
                      }}
                      placeholder="Enter eater type name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      required
                    />
                  </div>

                  {/* Has Sub Types Checkbox */}
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newEaterType.hasSub}
                        onChange={(e) => {
                          setNewEaterType(prev => ({
                            ...prev,
                            hasSub: e.target.checked,
                            sub: e.target.checked ? prev.sub : []
                          }));
                          if (!e.target.checked) {
                            setSubTypeName('');
                          }
                          clearMessages();
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Has Sub Types</span>
                    </label>
                  </div>

                  {/* Sub Types Section */}
                  {newEaterType.hasSub && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sub Types
                      </label>

                      {/* Add Sub Type Input */}
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={subTypeName}
                          onChange={(e) => {
                            setSubTypeName(e.target.value);
                            clearMessages();
                          }}
                          placeholder="Enter sub type name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSubType();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={addSubType}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>

                      {/* Display Sub Types */}
                      {newEaterType.sub.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Added Sub Types:</p>
                          {newEaterType.sub.map((subType, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                              <span className="text-sm">{subType}</span>
                              <button
                                type="button"
                                onClick={() => removeSubType(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Adding...
                      </div>
                    ) : (
                      'Add Eater Type'
                    )}
                  </button>
                </form>
              </div>
            )}

          </div>
        )}


        {/* Inventory Master Tab Content */}
        {activeTab === 'inventory-master' && (
          <div className="max-w-2xl mx-auto">

            {/* Single Inventory Master Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Inventory Master Settings
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600">Loading...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {inventoryMaster.id ? (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">01</span>
                        </div>
                        <button
                          onClick={() => setEditingInventory(!editingInventory)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          {editingInventory ? 'Cancel' : 'Edit'}
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Stock Buffer */}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm font-medium">Stock Buffer:</span>
                          {editingInventory ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={inventoryMaster.stock}
                                onChange={(e) => {
                                  setInventoryMaster(prev => ({ ...prev, stock: e.target.value }));
                                  clearMessages();
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                              />
                              <span className="text-sm text-gray-500">Days</span>
                            </div>
                          ) : (
                            <span className="font-medium">{inventoryMaster.stock} Days</span>
                          )}
                        </div>

                        {/* Segment Grocery Indent */}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm font-medium">Segment Grocery Indent:</span>
                          {editingInventory ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={inventoryMaster.groceryIndent}
                                onChange={(e) => {
                                  setInventoryMaster(prev => ({ ...prev, groceryIndent: e.target.value }));
                                  clearMessages();
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                              />
                              <span className="text-sm text-gray-500">Days</span>
                            </div>
                          ) : (
                            <span className="font-medium">{inventoryMaster.groceryIndent} Days</span>
                          )}
                        </div>

                        {/* Segment Veg/Meat/Dairy Indent */}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm font-medium">Segment Veg/Meat/Dairy Indent:</span>
                          {editingInventory ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={inventoryMaster.vegMeatDairyIndent}
                                onChange={(e) => {
                                  setInventoryMaster(prev => ({ ...prev, vegMeatDairyIndent: e.target.value }));
                                  clearMessages();
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                              />
                              <span className="text-sm text-gray-500">Days</span>
                            </div>
                          ) : (
                            <span className="font-medium">{inventoryMaster.vegMeatDairyIndent} Days</span>
                          )}
                        </div>


                        {/* Save Button - Only show when editing */}
                        {editingInventory && (
                          <div className="pt-3 border-t border-gray-200">
                            <button
                              onClick={handleUpdateInventoryMaster}
                              disabled={loading}
                              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {loading ? (
                                <div className="flex items-center justify-center">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                  Saving...
                                </div>
                              ) : (
                                'Save Change'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8L9 9l4 4" />
                      </svg>
                      <p>No inventory master found</p>
                      <p className="text-sm">Configure your inventory settings</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {/*Department Profile*/}
        {activeTab === 'department-profile' && (
          <div className="flex justify-center">
            <div className="bg-white shadow p-6 rounded-lg border border-gray-200 w-full max-w-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Department Profile</h3>

              <div className="space-y-5">
                {/* Department Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department Name (English) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    placeholder="Enter department name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Department Name (Tamil) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department Name (Tamil) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={departmentNameTamil}
                    onChange={(e) => setDepartmentNameTamil(e.target.value)}
                    placeholder="Enter department name in Tamil"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>


                {/* Logo Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Logo
                  </label>

                  {/* ✅ Logo preview on top */}
                  {inventoryMaster.logo && !departmentLogo && (
                    <div className="flex flex-col items-center mb-4">
                      <img
                        src={`https://rcs-dms.onlinetn.com/public/${inventoryMaster.logo}`}
                        alt="Current Department Logo"
                        className="h-36 w-36 object-contain border border-gray-300 rounded-lg p-2 shadow"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-center">Current Logo</p>
                    </div>
                  )}

                  {/* ✅ Upload input below */}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const selectedFile = e.target.files[0];
                        setDepartmentLogo(selectedFile);
                        if (selectedFile) {
                          uploadLogoImmediately(selectedFile);
                        }
                      }}
                      className="text-sm text-gray-700 file:mr-4 file:py-1 file:px-3 file:border file:rounded-md file:border-gray-300 file:text-sm file:bg-white hover:file:bg-gray-100 cursor-pointer"
                    />
                    {departmentLogo && (
                      <p className="mt-2 text-sm text-gray-600 italic">
                        Selected: {departmentLogo.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Save Button + Helper Text in Same Line */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-sm text-red-500 font-medium">
                    Please logout and login again to see the changes.
                  </p>

                  <button
                    type="button"
                    onClick={handleSaveDepartmentProfile}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Save Profile
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ✅ ACCOUNTS HEAD TAB */}
        {activeTab === 'accounts-head' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* List - LEFT SIDE */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Accounts Head List</h2>
                <button
                  onClick={() => {
                    setShowAddAccountForm(true);
                    setEditingAccountIndex(null);
                    clearMessages();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add New
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600">Loading...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {accountsData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>No accounts found</p>
                      <p className="text-sm">Add your first account head using the button above</p>
                    </div>
                  ) : (
                    accountsData.map((account, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-start mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <span className="text-blue-600 font-semibold text-sm">
                              {(index + 1).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-600 mb-1">Code:</div>
                            <div className="text-gray-900 font-semibold mb-2 break-words">{account.code}</div>
                            <div className="text-sm font-medium text-gray-600 mb-1">Name:</div>
                            <div className="text-gray-700 break-words">{account.name}</div>
                          </div>
                          <button
                            className="ml-2 text-blue-600 hover:text-blue-800 text-sm flex-shrink-0"
                            onClick={() => {
                              setEditingAccountIndex(index);
                              setEditAccount(account);
                              setShowAddAccountForm(false);
                              clearMessages();
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Add/Edit Form - RIGHT SIDE */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {editingAccountIndex !== null ? (
                // Edit Form
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Account Head</h2>
                  <form onSubmit={handleUpdateAccount} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editAccount.code}
                        onChange={(e) => {
                          setEditAccount(prev => ({ ...prev, code: e.target.value }));
                          clearMessages();
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 2056-00-101-AA-36702"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editAccount.name}
                        onChange={(e) => {
                          setEditAccount(prev => ({ ...prev, name: e.target.value }));
                          clearMessages();
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Feeding / Dietary Charges 02 Dhall"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAccountIndex(null);
                          setEditAccount({ code: '', name: '' });
                        }}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(editingAccountIndex)}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                      >
                        Delete
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </>
              ) : showAddAccountForm ? (
                // Add Form
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Account Head</h2>
                  <form onSubmit={handleAddAccount} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newAccount.code}
                        onChange={(e) => {
                          setNewAccount(prev => ({ ...prev, code: e.target.value }));
                          clearMessages();
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 2056-00-101-AA-36702"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newAccount.name}
                        onChange={(e) => {
                          setNewAccount(prev => ({ ...prev, name: e.target.value }));
                          clearMessages();
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Feeding / Dietary Charges 02 Dhall"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddAccountForm(false);
                          setNewAccount({ code: '', name: '' });
                        }}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                        disabled={loading}
                      >
                        {loading ? 'Adding...' : 'Add Account'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                // Empty state when no form is active
                <div className="text-center py-12 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Select an account to edit or click "Add New"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ✅ ITEMS LIST TAB */}
        {activeTab === 'items-list' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Items List</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Manage items, required quantities, and account mapping. Only selected items will be allowed for Open Indent.
                </p>
              </div>

              {/* Search Box */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search by item name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-64"
                />
                <button
                  onClick={handleSaveAllItems}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>


            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col items-center gap-1">
                          {/* <span>Required</span> */}
                          <label className="flex items-center gap-1 text-xs font-normal text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectAllRequired}
                              onChange={(e) => handleSelectAllRequired(e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            Select All
                          </label>
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Name
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {itemsData.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.429M4 13h2.429m0 0L9 9l4 4-1.429 1.429M4 13l2.429 2.429" />
                          </svg>
                          <p>No items found</p>
                        </td>
                      </tr>
                    ) : (
                      itemsData
                        .filter(item => {
                          const term = searchQuery.toLowerCase();

                          // Match frontend display category logic
                          const displayCategory =
                            item.category === "food"
                              ? "grocery"
                              : item.category === "dailie"
                                ? "veg,meat,dairy"
                                : item.category?.toLowerCase();

                          return (
                            item.name?.toLowerCase().includes(term) ||
                            displayCategory?.includes(term)
                          );
                        })
                        .map((item, index) => {
                          const tempChanges = tempItemChanges[item.id] || {};
                          const displayRequired = tempChanges.hasOwnProperty('required') ? tempChanges.required : item.required;
                          const displayAccount = tempChanges.hasOwnProperty('account') ? tempChanges.account : item.account;

                          return (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  checked={displayRequired === 1}
                                  onChange={(e) => {
                                    setTempItemChanges(prev => ({
                                      ...prev,
                                      [item.id]: {
                                        ...prev[item.id],
                                        required: e.target.checked ? 1 : 0
                                      }
                                    }));
                                  }}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <select
                                  value={displayAccount || ''}
                                  onChange={(e) => {
                                    setTempItemChanges(prev => ({
                                      ...prev,
                                      [item.id]: {
                                        ...prev[item.id],
                                        account: e.target.value
                                      }
                                    }));
                                  }}
                                  disabled={displayRequired !== 1}
                                  className={`w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${displayRequired !== 1 ? 'bg-gray-100 cursor-not-allowed' : ''
                                    }`}
                                >
                                  <option value="">Select Account</option>
                                  {accountsData.map((account, idx) => (
                                    <option key={idx} value={account.code}>
                                      {account.code}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                                {item.category === "food"
                                  ? "Grocery"
                                  : item.category === "dailie"
                                    ? "Veg,Meat,Dairy"
                                    : item.category}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {item.name}
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {item.unit}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
{/* ✅ ITEMS SELECTION TAB */}
{activeTab === 'items-selection' && (
  <div className="space-y-6">


    {/* ⭐ Brand Wise Section */}
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">

      {/* Header */}
      <div
        className="p-5 cursor-pointer flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-all"
        onClick={() => setBrandOpen(!brandOpen)}
      >
        <h3 className="text-xl font-bold text-gray-900 tracking-wide">
          Brand Wise Items
        </h3>

        <div className="flex items-center gap-3">

        <button
  onClick={(e) => {
    e.stopPropagation();
    setShowItemSelectionPopup(true);
    fetchItemsForSelection();
  }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm active:scale-95"
          >
            Add Items
          </button>

          {/* ▼ Professional Rotating SVG Arrow */}
          <svg
            className={`w-6 h-6 text-gray-700 transition-transform duration-300 ${
              brandOpen ? "rotate-180" : "rotate-0"
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>

        </div>
      </div>

{brandOpen && (
        <div className="p-5 border-t space-y-3 bg-white">

          <div className="space-y-3">
            {brandWiseItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4 italic">No items added yet</p>
            ) : (
              brandWiseItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 bg-gray-50 border rounded-lg hover:bg-gray-100 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.name}</span>
                    <span className="text-sm text-gray-500">({item.unit})</span>
                  </div>

                  <button
                    onClick={() => handleRemoveItemFromSection(item.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-semibold transition"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
     <div className="mt-6 flex justify-end">
  <button
    onClick={handleSaveItemGroups}
    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow"
  >
    Save Item Groups
  </button>
</div>


  </div>
)}

{/* ✅ ITEM SELECTION POPUP - ENHANCED UI */}
{showItemSelectionPopup && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
      {/* Enhanced Header with Blue Background */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-white">Select Items</h3>
         <p className="text-blue-100 text-sm mt-1">
  Choose items to add to Brand Wise section
</p>
        </div>
        <button
          onClick={() => {
            setShowItemSelectionPopup(false);
            setSelectedItemsInPopup([]);
          }}
          className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search Bar and Select All - Same Line */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search items by name or category..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => {
              const term = e.target.value.toLowerCase();
              if (term) {
                const filtered = availableItemsForSelection.filter(item =>
                  item.name?.toLowerCase().includes(term) ||
                  item.category?.toLowerCase().includes(term)
                );
                setAvailableItemsForSelection(filtered);
              } else {
                fetchItemsForSelection();
              }
            }}
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <label className="flex items-center px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer border border-blue-200 whitespace-nowrap">
          <input
            type="checkbox"
            checked={selectedItemsInPopup.length === availableItemsForSelection.length && availableItemsForSelection.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedItemsInPopup(availableItemsForSelection.map(item => item.id));
              } else {
                setSelectedItemsInPopup([]);
              }
            }}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
          />
          <span className="font-medium text-blue-900 text-sm">Select All</span>
        </label>
      </div>

      {/* Items List */}
      <div className="p-6 overflow-y-auto max-h-[calc(80vh-240px)]">
        {loadingItemsPopup ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <span className="text-gray-600 font-medium">Loading items...</span>
          </div>
        ) : availableItemsForSelection.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.429M4 13h2.429" />
            </svg>
            <p className="text-gray-500 font-medium">No items found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <div className="space-y-2">
            {availableItemsForSelection.map((item) => {
              const isSelected = selectedItemsInPopup.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`flex items-center p-4 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-50 border-2 border-blue-500 shadow-sm' 
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItemsInPopup(prev => [...prev, item.id]);
                      } else {
                        setSelectedItemsInPopup(prev => prev.filter(id => id !== item.id));
                      }
                    }}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-4"
                  />
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {item.name}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        item.category === "food" 
                          ? 'bg-green-100 text-green-800' 
                          : item.category === "dailie"
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.category === "food" ? "Grocery" : item.category === "dailie" ? "Veg/Meat/Dairy" : item.category}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 font-medium ml-4">{item.unit}</span>
                  </div>
                  {isSelected && (
                    <svg className="w-6 h-6 text-blue-600 flex-shrink-0 ml-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Enhanced Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{selectedItemsInPopup.length}</span> items selected
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowItemSelectionPopup(false);
              setSelectedItemsInPopup([]);
            }}
            className="px-5 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddItemsToSection}
            disabled={selectedItemsInPopup.length === 0}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
          >
            Add Selected ({selectedItemsInPopup.length})
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default MastersPage;
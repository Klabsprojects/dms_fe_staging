import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';

const UserManagement = () => {
  // Get current user role from localStorage
  const getCurrentUserRole = () => {
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        return parsed.role || 'user';
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }
    return 'user';
  };

  // State for form fields
  const [formData, setFormData] = useState({
    p_id: null,
    name: '',
    username: '',
    password: '',
    role: '',
    mobile: '',
    count: '',
    branchType: '', // Add this line
  });

  const [currentUserRole] = useState(getCurrentUserRole());

  const newBranch = {
    id: Date.now(),
    name: formData.name,
    branchType: 'Branch',
    details: []
  };
  const [storeOptions, setStoreOptions] = useState([]);

  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [selectedBranchForUser, setSelectedBranchForUser] = useState(null);
  const [addUserForm, setAddUserForm] = useState({
    name: '',
    district: '',
    location: '', // ← newly added field
    contact: '',
    store: '', // <-- New field
    address: '',
    suffix: ''
  });

  const [expandedBranchId, setExpandedBranchId] = useState(null);
  const [expandedTypes, setExpandedTypes] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openBranchForm, setOpenBranchForm] = useState(null); // Add this line
  const [isEditingUser, setIsEditingUser] = useState(false);

  const [showNewUserField, setShowNewUserField] = useState(false);

  const [expandedUsers, setExpandedUsers] = useState({});


  const [isCreatingTypeFromTop, setIsCreatingTypeFromTop] = useState(false);

  const [isAddingBranchUsers, setIsAddingBranchUsers] = useState(false);

  const [editingUsers, setEditingUsers] = useState([]);

  const [expandedResetUser, setExpandedResetUser] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [districtOptions, setDistrictOptions] = useState([]);




  // New state for division rows
  const [divisionRows, setDivisionRows] = useState([]);
  const [divisionGroups, setDivisionGroups] = useState([]);
  // State for editing division groups
  const [editingGroupId, setEditingGroupId] = useState(null);
  // State for users list
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState('createBranch'); // 'createBranch' or 'addUser'
  // Modal state
  const [expandedDepartments, setExpandedDepartments] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  // State for form submission and validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [branchUsers, setBranchUsers] = useState({}); // Store users per branch
  // State for form visibility
  const [showForm, setShowForm] = useState(currentUserRole === 'department' ? true : false);

  const [expandedProfileData, setExpandedProfileData] = useState(null);

  const [editMode, setEditMode] = useState(false);

  const [selectedUserView, setSelectedUserView] = useState(null);
  const [selectedUserEdit, setSelectedUserEdit] = useState(null);
  const [editedUser, setEditedUser] = useState({ name: '', username: '', branch: '' });


  const [showUserFormModal, setShowUserFormModal] = useState(false);
  const [selectedDepartmentName, setSelectedDepartmentName] = useState('');
  const [userForm, setUserForm] = useState({ username: '', password: '', mobile: '', name: '', district: '' });
  const [userFormErrors, setUserFormErrors] = useState({});

  const [newUserName, setNewUserName] = useState('');

  const [expandedReset, setExpandedReset] = useState(null); // currently expanded department
  const [tempPassword, setTempPassword] = useState('');

  const [expandedProfile, setExpandedProfile] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedBranch, setEditedBranch] = useState({});

  const [selectedDepartmentForBranchView, setSelectedDepartmentForBranchView] = useState(null);
  const [branchListForSelectedDept, setBranchListForSelectedDept] = useState([]);

  const handleViewBranchesTableFromDivision = (departmentName) => {
    const departmentData = users[departmentName] || {};
    const branches = [];

    Object.keys(departmentData).forEach((typeName) => {
      if (['username', 'id', 'mobile'].includes(typeName)) return;

      const typeBranches = departmentData[typeName];
      Object.keys(typeBranches).forEach((locationKey) => {
        const branchUsers = typeBranches[locationKey];
        const firstUser = branchUsers?.[0];

        if (firstUser) {
          branches.push({
            branchType: typeName,
            name: firstUser.branch || locationKey,
            district: firstUser.district || '—',
            location: firstUser.location || '—',
            store: firstUser.store || '—',
          });
        }
      });
    });

    setBranchListForSelectedDept(branches);
    setSelectedDepartmentForBranchView({ name: departmentName });
  };

  const handleSaveEditedBranch = async () => {
    const token = localStorage.getItem('authToken');

    let branchType = selectedBranchView?.branch_type ||
      selectedBranchView?.users?.[0]?.branch_type ||
      selectedBranchForUser;

    const branchName = selectedBranchView?.name;

    if (!branchType || !branchName || !token) {
      alert("Missing branch type, branch name, or authentication token");
      return;
    }

    const payload = {
      district: editedBranch.district || selectedBranchView.district || '',
      location: editedBranch.location || selectedBranchView.location || '',
      contact: editedBranch.contact || selectedBranchView.contact || '',
      address: editedBranch.address || selectedBranchView.address || ''
    };

    console.log('Updated branch details:', payload);
    console.log('Branch Type:', branchType);
    console.log('Branch Name:', branchName);

    try {
      // Replace the URL construction part with:
      const baseUrl = 'https://rcs-dms.onlinetn.com/api/v1//branch/';
      const fullUrl = baseUrl + branchType + '/' + branchName;

      console.log('Calling URL with fetch:', fullUrl);

      const response = await fetch(fullUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        setSuccessMessage("Branch updated successfully!");
        setIsEditing(false);
        setSelectedBranchView((prev) => ({
          ...prev,
          ...payload
        }));

        await fetchUsers();
        await fetchBranchDetails();
      } else {
        console.error(result);
        setSuccessMessage("Failed to update branch details");
      }

    } catch (error) {
      console.error("Error saving edited branch:", error);
      alert("Error occurred while saving");
    }
  };

  const [selectedBranchView, setSelectedBranchView] = useState(null);




  // Get the appropriate role for creation based on current user role
  const getTargetRole = () => {
    switch (currentUserRole) {
      case 'rcs-admin':
        return 'department';
      case 'department':
        return 'division';
      case 'division':
        return 'accounts';
      default:
        return 'accounts';
    }
  };
  // Get appropriate labels based on current user role
  const getLabels = () => {
    switch (currentUserRole) {
      case 'rcs-admin':
        return {
          entityName: 'Department',
          entityNamePlural: 'Departments',
          createButtonText: 'Create Department',
          formTitle: 'Create New Department',
          successMessage: 'Department has been created successfully.',
          nameLabel: 'Department Name',
          namePlaceholder: 'Enter department name'
        };
      case 'department':
        return {
          entityName: 'Division',
          entityNamePlural: 'Divisions',
          createButtonText: 'Create Divisons',
          formTitle: 'Create New Division',
          successMessage: 'Division has been created successfully.',
          nameLabel: 'Name',
          namePlaceholder: 'Enter name'
        };
      case 'division':
        return {
          entityName: 'User',
          entityNamePlural: 'Users',
          createButtonText: 'Create User',
          formTitle: 'Create New User',
          successMessage: 'User has been created successfully.',
          nameLabel: 'User Name',
          namePlaceholder: 'Enter user name'
        };
      default:
        return {
          entityName: 'User',
          entityNamePlural: 'Users',
          createButtonText: 'Create User',
          formTitle: 'Create New User',
          successMessage: 'User has been created successfully.',
          nameLabel: 'User Name',
          namePlaceholder: 'Enter user name'
        };
    }
  };

  const labels = getLabels();
  const generateUsernameSuffix = async (branchType, district) => {
    const userInfo = localStorage.getItem('user');
    let departmentShort = 'xx';

    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        const deptName = parsed.name || '';
        const parts = deptName.trim().split(/\s+/);
        departmentShort = parts.slice(0, 2).map(w => w[0].toLowerCase()).join('');
      } catch (err) {
        console.error('Failed to parse department info:', err);
      }
    }

    const typeShort = (branchType || '').substring(0, 3).toLowerCase();
    const districtShort = (district || '').substring(0, 3).toLowerCase();

    const count = await getBranchCountForType(branchType);
    const number = (count + 1).toString().padStart(2, '0');

    return `${departmentShort}${typeShort}${districtShort}${number}`;
  };


  const handleCreateAllBranches = async () => {
    console.log('Button clicked!');
    console.log('divisionGroups:', divisionGroups);
    console.log('formData:', formData);

    if (divisionGroups.length === 0) {
      console.log('No division groups to process');
      setErrors({ general: 'Please create some branch types first before submitting.' });
      return;
    }

    // Create a fake event object for handleSubmit
    const fakeEvent = {
      preventDefault: () => console.log('preventDefault called')
    };

    console.log('About to call handleSubmit');
    await handleSubmit(fakeEvent);
    console.log('handleSubmit completed');
  };
  const parseApiError = (errorResponse) => {
    try {
      // If it's already a string, return it
      if (typeof errorResponse === 'string') {
        return errorResponse;
      }

      // If it has a message property
      if (errorResponse.message) {
        // Handle database errors with specific codes
        if (typeof errorResponse.message === 'object') {
          const { code, errno, sqlMessage, sqlState } = errorResponse.message;

          // Handle specific database error codes
          switch (code) {
            case 'ER_DUP_ENTRY':
              // Extract field name from SQL message if available
              if (sqlMessage && sqlMessage.includes('email')) {
                return 'This email/username is already registered. Please use a different email.';
              } else if (sqlMessage && sqlMessage.includes('mobile')) {
                return 'This mobile number is already registered. Please use a different mobile number.';
              } else {
                return 'This record already exists. Please check your input and try again.';
              }

            case 'ER_NO_REFERENCED_ROW_2':
              return 'Invalid reference data. Please check your input values.';

            case 'ER_DATA_TOO_LONG':
              return 'One or more fields exceed the maximum allowed length.';

            case 'ER_BAD_NULL_ERROR':
              return 'Required field is missing. Please fill all mandatory fields.';

            case 'ER_TRUNCATED_WRONG_VALUE':
              return 'Invalid data format. Please check your input values.';

            default:
              // Return the SQL message if available, otherwise a generic message
              return sqlMessage || `Database error (${code}): Please contact support if this persists.`;
          }
        } else {
          // If message is a string
          return errorResponse.message;
        }
      }

      // Fallback for unknown error structure
      return 'An unexpected error occurred. Please try again.';
    } catch (parseError) {
      console.error('Error parsing API error:', parseError);
      return 'An unexpected error occurred. Please try again.';
    }
  };

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('https://rcs-dms.onlinetn.com/api/v1//master/stores', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        if (!result.error && Array.isArray(result.data)) {
          setStoreOptions(result.data);
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
      }
    };

    fetchStores();
  }, []);


  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  // Add this useEffect after your existing useEffects
  // Load branch data on component mount for department role
  useEffect(() => {
    if (currentUserRole === 'department') {
      fetchBranchDetails();
    }
  }, [currentUserRole]);
  const handleTypeClick = async (departmentName, typeName) => {
    // Remove second level expansion - types are no longer clickable
    return;
  };
  const fetchBranchesByType = async (branchType) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/user/branches?type=${encodeURIComponent(branchType)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.error === false && result.data) {
        // Transform the API response to match your frontend structure
        const transformedBranches = [];

        Object.keys(result.data).forEach(typeKey => {
          if (typeKey === branchType || typeKey === 'undefined') {
            Object.keys(result.data[typeKey]).forEach(locationKey => {
              const branchUsers = result.data[typeKey][locationKey];
              if (branchUsers && branchUsers.length > 0) {
                // Get branch info from the first user (all users in same branch have same branch info)
                const firstUser = branchUsers[0];
                const branch = {
                  id: `${typeKey}-${locationKey}`, // Create unique ID
                  name: firstUser.branch || locationKey,
                  district: firstUser.detail?.location || locationKey,
                  contact: firstUser.detail?.contact || '',
                  suffix: firstUser.username?.split('@')[1] || '',
                  branch_type: firstUser.detail?.branch_type || firstUser.branch_type || typeKey,
                  users: branchUsers // Store all users for this branch
                };
                transformedBranches.push(branch);
              }
            });
          }
        });

        return transformedBranches;
      }
      return [];
    } catch (error) {
      console.error('Error fetching branches:', error);
      return [];
    }
  };
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.error === false) {
        setUsers(result.data);
      } else {
        const errorMessage = parseApiError(result);
        console.error('Failed to fetch users:', errorMessage);
        // You could set an error state here to show to users if needed
        setErrors({ fetch: errorMessage });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrors({ fetch: 'Network error while loading users. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  };
  // Generate division rows when count changes
  useEffect(() => {
    if (currentUserRole === 'department' && formData.count && formData.name) {
      const count = parseInt(formData.count);
      if (count > 0) {
        const rows = Array.from({ length: count }, (_, index) => ({
          id: index + 1,
          name: '',
          address: '',
          roleName: '',
          suffix: ''
        }));
        setDivisionRows(rows);
      } else {
        setDivisionRows([]);
      }
    }
  }, [formData.count, formData.name, currentUserRole]);
  const fetchBranchDetails = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.error === false && result.data) {
        const processedGroups = [];

        // Iterate through each branch type (Child Care, Testing, etc.)
        Object.keys(result.data).forEach(branchType => {
          const branches = [];

          // Iterate through each branch location under this type
          Object.keys(result.data[branchType]).forEach(branchKey => {
            const users = result.data[branchType][branchKey];

            if (users && users.length > 0) {
              const firstUser = users[0];

              // Create branch object with proper field mapping
              const branch = {
                id: `${branchType}-${branchKey}`,
                name: firstUser.branch || branchKey, // Use branch field from user data
                branch: firstUser.branch || branchKey,
                district: firstUser.district || '—', // Get district from user data
                location: firstUser.location || '—', // Get location from user data
                contact: firstUser.contact || '—',
                address: firstUser.address || '—', // Get address from user data
                suffix: firstUser.username?.split('@')[1] || '',
                branch_type: firstUser.branch_type || branchType,
                users: users
              };

              branches.push(branch);
            }
          });

          // Add the branch type group with branches loaded
          if (branches.length > 0) {
            processedGroups.push({
              id: Date.now() + Math.random(),
              name: branchType,
              details: branches
            });
          }
        });

        setDivisionGroups(processedGroups);
      }
    } catch (error) {
      console.error('Error fetching branch details:', error);
    }
  };
  // const [isLoadingUser, setIsLoadingUser] = useState(false);
  // Add this function after fetchUsers
  const fetchBranchesForType = async (typeName) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.error === false && result.data && result.data[typeName]) {
        const branches = [];

        Object.keys(result.data[typeName]).forEach(branchKey => {
          const users = result.data[typeName][branchKey];

          if (users && users.length > 0) {
            const firstUser = users[0];

            // Use branch name from API or location if branch is undefined
            const branchName = branchKey === 'undefined' ? firstUser.location : branchKey;

            branches.push({
              id: `${typeName}-${branchKey}`,
              name: branchName,
              district: firstUser.location || branchKey,
              contact: firstUser.contact || '',
              suffix: firstUser.username?.split('@')[1] || '',
              users: users
            });
          }
        });

        return branches;
      }
      return [];
    } catch (error) {
      console.error('Error fetching branches for type:', error);
      return [];
    }
  };
  const getDepartments = () => {
    if (!users) {
      return [];
    }

    // For rcs-admin, get departments from API structure
    if (currentUserRole === 'rcs-admin') {
      if (typeof users !== 'object') return [];
      return Object.keys(users).filter(key => key !== 'user').map(departmentName => {
        const departmentData = users[departmentName] || {};

        // Filter out both 'username' and 'id' to get actual branch types
        // Filter out both 'username', 'id', and 'mobile' to get actual branch types
        const typeCount = Object.keys(departmentData).filter(key =>
          key !== 'username' && key !== 'id' && key !== 'mobile'
        ).length;

        // Calculate total branches and users only for actual branch types
        let totalBranches = 0;
        let totalUsers = 0;

        Object.entries(departmentData).forEach(([key, branches]) => {
          // Skip username, id, and mobile fields
          if (key !== 'username' && key !== 'id' && key !== 'mobile') {
            if (typeof branches === 'object' && branches !== null && !Array.isArray(branches)) {
              totalBranches += Object.keys(branches).length;
              Object.values(branches).forEach(branchUsers => {
                if (Array.isArray(branchUsers)) {
                  totalUsers += branchUsers.length;
                }
              });
            }
          }
        });

        return {
          id: departmentName,
          name: departmentName,
          typeCount: typeCount,
          totalBranches: totalBranches,
          totalUsers: totalUsers
        };
      });
    }

    // For other roles, use existing logic
    if (!Array.isArray(users)) {
      return [];
    }
    return users.map(user => ({
      id: user.id,
      name: user.name,
      userCount: currentUserRole === 'rcs-admin' ? (user.divisions || 0) : (user.users || 0)
    }));
  };

  // Handle department click
  // Handle department click - Modified to fetch divisions by department ID
  const handleDepartmentClick = async (department) => {
    try {
      // Check if department is already expanded
      const isExpanded = expandedDepartments.find(d => d.id === department.id);

      if (isExpanded) {
        // Collapse - remove from expanded list
        setExpandedDepartments(expandedDepartments.filter(d => d.id !== department.id));
        return;
      }

      if (currentUserRole === 'rcs-admin') {
        const departmentData = users[department.name] || {};
        const types = Object.keys(departmentData)
          .filter(key => key !== 'username' && key !== 'id' && key !== 'mobile') // Exclude username, id, and mobile fields
          .map(typeName => {
            const branches = departmentData[typeName] || {};
            const totalUsers = Object.values(branches).reduce((total, branchUsers) => {
              return total + (Array.isArray(branchUsers) ? branchUsers.length : 0);
            }, 0);

            return {
              id: typeName,
              name: typeName,
              userCount: totalUsers,
              branchCount: Object.keys(branches).length
            };
          });

        setExpandedDepartments([...expandedDepartments, {
          ...department,
          divisions: types
        }]);
      } else {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/user?division=${department.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (result.error === false) {
          setExpandedDepartments([...expandedDepartments, {
            ...department,
            divisions: result.data
          }]);
        } else {
          console.error('Failed to fetch division details:', result.message);
          setErrors({ fetch: 'Failed to load division details' });
        }
      }
    } catch (error) {
      console.error('Network error while fetching details:', error);
      setErrors({ fetch: 'Network error while loading details' });
    }
  };
  // Handle division group row changes
  const handleDivisionGroupRowChange = (groupIndex, rowIndex, field, value) => {
    const updatedGroups = [...divisionGroups];
    updatedGroups[groupIndex].rows[rowIndex][field] = value;
    setDivisionGroups(updatedGroups);
  };
  // Handle division group name changes
  const handleDivisionGroupNameChange = (groupIndex, newName) => {
    const updatedGroups = [...divisionGroups];
    updatedGroups[groupIndex].name = newName;
    setDivisionGroups(updatedGroups);
  };
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const [newUserInfo, setNewUserInfo] = useState({
    salutation: '',
    name: '',
    designation: '',
    contact: '',
  });

  const handleDivisionRowChange = (index, field, value) => {
    const updatedRows = [...divisionRows];
    updatedRows[index][field] = value;

    if (field === 'name') {
      // Extract all characters before the first space
      const firstWord = value.split(' ')[0];
      updatedRows[index].suffix = firstWord.toLowerCase(); // store as lowercase
    }

    setDivisionRows(updatedRows);
  };

  const validateBranchForm = () => {
    const validationErrors = {};

    // Validate name
    if (!addUserForm.name || !addUserForm.name.trim()) {
      validationErrors.name = 'Branch name is required';
    } else if (addUserForm.name.trim().length < 2) {
      validationErrors.name = 'Branch name must be at least 2 characters';
    } else if (addUserForm.name.trim().length > 50) {
      validationErrors.name = 'Branch name must not exceed 50 characters';
    }

    // Validate district
    if (!addUserForm.district || !addUserForm.district.trim()) {
      validationErrors.district = 'District is required';
    } else if (addUserForm.district.trim().length < 2) {
      validationErrors.district = 'District must be at least 2 characters';
    }

    // Validate location
    if (!addUserForm.location || !addUserForm.location.trim()) {
      validationErrors.location = 'Location is required';
    } else if (addUserForm.location.trim().length < 2) {
      validationErrors.location = 'Location must be at least 2 characters';
    }

    // Validate contact
    if (!addUserForm.contact || !addUserForm.contact.trim()) {
      validationErrors.contact = 'Contact number is required';
    } else if (!/^\d{10}$/.test(addUserForm.contact.trim())) {
      validationErrors.contact = 'Contact must be exactly 10 digits';
    }

    // Validate address
    if (!addUserForm.address || !addUserForm.address.trim()) {
      validationErrors.address = 'Address is required';
    } else if (addUserForm.address.trim().length < 5) {
      validationErrors.address = 'Address must be at least 5 characters';
    } else if (addUserForm.address.trim().length > 200) {
      validationErrors.address = 'Address must not exceed 200 characters';
    }

    // Validate suffix
    if (!addUserForm.suffix || !addUserForm.suffix.trim()) {
      validationErrors.suffix = 'Username suffix is required';
    } else if (addUserForm.suffix.trim().length < 3) {
      validationErrors.suffix = 'Username suffix must be at least 3 characters';
    } else if (!/^[a-z0-9]+$/.test(addUserForm.suffix.trim())) {
      validationErrors.suffix = 'Username suffix can only contain lowercase letters and numbers';
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleAddUserFormChange = (field, value) => {
    setAddUserForm(prev => ({ ...prev, [field]: value }));

    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Real-time validation for specific fields
    if (field === 'contact' && value) {
      if (!/^\d*$/.test(value)) {
        setErrors(prev => ({ ...prev, contact: 'Contact can only contain numbers' }));
      } else if (value.length > 10) {
        setErrors(prev => ({ ...prev, contact: 'Contact cannot exceed 10 digits' }));
      }
    }

    if (field === 'suffix' && value) {
      if (!/^[a-z0-9]*$/.test(value)) {
        setErrors(prev => ({ ...prev, suffix: 'Username suffix can only contain lowercase letters and numbers' }));
      }
    }
  };

  // Enhanced create type validation
  const validateCreateType = () => {
    if (!formData.name || !formData.name.trim()) {
      setErrors({ name: 'Type name is required' });
      return false;
    }

    if (formData.name.trim().length < 2) {
      setErrors({ name: 'Type name must be at least 2 characters' });
      return false;
    }

    if (formData.name.trim().length > 30) {
      setErrors({ name: 'Type name must not exceed 30 characters' });
      return false;
    }

    // Check if type name already exists
    const existingType = divisionGroups.find(group =>
      group.name.toLowerCase() === formData.name.trim().toLowerCase()
    );

    if (existingType) {
      setErrors({ name: 'This type name already exists' });
      return false;
    }

    setErrors({});
    return true;
  };
  // Validate form based on current user role
  const validateForm = () => {
    const newErrors = {};

    if (currentUserRole === 'department') {
      // For department role, validate divisionGroups instead of formData
      if (divisionGroups.length === 0) {
        newErrors.general = 'Please create at least one branch type before submitting.';
      }

      // Check if any branch type has branches
      const hasBranches = divisionGroups.some(group => group.details && group.details.length > 0);
      if (!hasBranches) {
        newErrors.general = 'Please add at least one branch to your branch types before submitting.';
      }

      return newErrors; // Skip all other validation for department
    }

    // Original validation for other roles
    if (!formData.name.trim()) newErrors.name = `${labels.nameLabel} is required`;

    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Mobile number must be 10 digits';
    }

    return newErrors;
  };
  const handleSaveBranch = async () => {
    // Clear previous errors
    setErrors({});

    // Validate the form
    if (!validateBranchForm()) {
      return; // Stop if validation fails
    }

    try {
      const token = localStorage.getItem('authToken');
      const userInfo = JSON.parse(localStorage.getItem('user'));

      const branchData = {
        p_id: userInfo.id,
        name: addUserForm.name.trim(),
        branch: addUserForm.name.trim(),
        contact: addUserForm.contact.trim(),
        district: addUserForm.district.trim(),
        location: addUserForm.location.trim(),
        address: addUserForm.address.trim(),
        suffix: addUserForm.suffix.trim(),
        branch_type: selectedBranchForUser,
      };

      const branchResponse = await fetch(`${API_BASE_URL}/user/division`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branchData),
      });

      const branchResult = await branchResponse.json();

      if (branchResponse.ok && branchResult.error === false) {
        // Success
        await fetchUsers();
        await fetchBranchDetails();

        // Reset form
        setAddUserForm({
          name: '',
          district: '',
          location: '',
          contact: '',
          address: '',
          suffix: ''
        });
        setShowAddUserForm(false);
        setErrors({});

        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
      } else {
        setErrors({ general: `Failed to create branch: ${parseApiError(branchResult)}` });
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      setErrors({ general: 'Network error creating branch. Please try again.' });
    }
  };

  // Updated create type handler
  const handleCreateType = async () => {
    if (!validateCreateType()) {
      return;
    }

    try {
      const initialSuffix = await generateUsernameSuffix(formData.name.trim(), '');
      setShowAddUserForm(true);
      setSelectedBranchForUser(formData.name.trim());
      setAddUserForm({
        name: '',
        district: '',
        location: '',
        contact: '',
        address: '',
        suffix: initialSuffix
      });
      setFormData({ ...formData, name: '' });
      setErrors({});
    } catch (error) {
      console.error('Error creating type:', error);
      setErrors({ general: 'Error creating type. Please try again.' });
    }
  };
  const getBranchCountForType = async (typeName) => {
    try {
      // First check locally created branches in divisionGroups
      const localGroup = divisionGroups.find(group => group.name === typeName);
      if (localGroup && localGroup.details) {
        return localGroup.details.length;
      }

      // If not found locally, check API
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.error === false && result.data && result.data[typeName]) {
        // Count how many branches (keys) exist under this type
        return Object.keys(result.data[typeName]).length;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching branch count:', error);
      return 0;
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get parent ID from localStorage
    const getUserParentId = () => {
      const userInfo = localStorage.getItem('user');
      console.log('Raw user info from localStorage:', userInfo);

      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo);
          console.log('Parsed user info:', parsed);
          console.log('User ID found:', parsed.id);

          if (!parsed.id) {
            console.error('User ID is missing from localStorage!');
          }

          return parsed.id || null;
        } catch (error) {
          console.error('Error parsing user info for parent ID:', error);
        }
      } else {
        console.error('No user info found in localStorage!');
      }
      return null;
    };


    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const token = localStorage.getItem('authToken');
      const targetRole = getTargetRole();

      console.log('Current user role:', currentUserRole);
      console.log('Parent ID:', getUserParentId());

      if (currentUserRole === 'department') {
        console.log('Processing department submission...');
        let successCount = 0;
        let errors = [];

        // Process each division group (branch type) separately
        for (const group of divisionGroups) {
          try {
            console.log('Creating branch type:', group.name);

            // First create the branch type (division)
            const branchTypeData = {
              p_id: getUserParentId(),
              name: group.name,
              username: `${group.name.toLowerCase().replace(/\s+/g, '')}@admin`,
              role: targetRole, // 'division'

            };

            const typeResponse = await fetch(`${API_BASE_URL}/user`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(branchTypeData)
            });

            const typeResult = await typeResponse.json();
            console.log('Branch type creation response:', typeResult);

            if (typeResponse.ok && typeResult.error === false) {
              successCount++;
              const createdTypeId = typeResult.data?.id;
              console.log('Branch type created successfully, ID:', createdTypeId);

              // Now create each branch under this type
              if (group.details && group.details.length > 0) {
                for (const branch of group.details) {
                  try {
                    console.log('Creating branch:', branch.name, 'under type:', group.name);

                    const branchData = {
                      p_id: createdTypeId, // Use the created division ID as parent
                      name: branch.name,
                      username: `${branch.suffix}@${group.name.toLowerCase().replace(/\s+/g, '')}`,
                      role: 'accounts',
                      mobile: branch.contact || '0000000000',
                      address: branch.district || ''
                    };

                    const branchResponse = await fetch(`${API_BASE_URL}/user`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(branchData)
                    });

                    const branchResult = await branchResponse.json();
                    console.log('Branch creation response:', branchResult);

                    if (branchResponse.ok && branchResult.error === false) {
                      successCount++;
                      console.log('Branch created successfully');
                    } else {
                      errors.push(`Failed to create branch ${branch.name}: ${parseApiError(branchResult)}`);
                    }
                  } catch (error) {
                    errors.push(`Network error creating branch ${branch.name}: ${error.message}`);
                  }
                }
              }
            } else {
              errors.push(`Failed to create branch type ${group.name}: ${parseApiError(typeResult)}`);
            }
          } catch (error) {
            errors.push(`Network error creating branch type ${group.name}: ${error.message}`);
          }
        }

        // Handle results
        if (successCount > 0) {
          setSubmitSuccess(true);

          // Reset form
          setFormData({
            p_id: null,
            name: '',
            username: '',
            password: '',
            role: '',
            mobile: '',
            count: '',
          });
          setDivisionRows([]);
          setDivisionGroups([]);

          // Refresh users list
          await fetchUsers();

          // Hide success message after 3 seconds
          setTimeout(() => {
            setSubmitSuccess(false);
          }, 3000);
        }

        if (errors.length > 0) {
          setErrors({ general: `Created ${successCount} items. Errors: ${errors.join(', ')}` });
        } else if (successCount === 0) {
          setErrors({ general: 'No branch types found to create.' });
        }
      } else {
        // Original logic for other roles (rcs-admin, division, etc.)
        const submitData = {
          ...formData,
          username: `${formData.username}@${formData.name.toLowerCase().replace(/\s+/g, '')}`,
          role: targetRole,
          p_id: getUserParentId()
        };

        console.log('Creating entity with data:', submitData);
        console.log('Current user role:', currentUserRole);
        console.log('Parent ID being sent:', submitData.p_id);

        const response = await fetch(`${API_BASE_URL}/user`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData)
        });

        const result = await response.json();

        if (response.ok && result.error === false) {
          setSubmitSuccess(true);

          // Reset form
          setFormData({
            p_id: null,
            name: '',
            username: '',
            password: '',
            role: '',
            mobile: '',
            count: '',
          });

          // Refresh users list
          await fetchUsers();

          // Hide success message after 3 seconds
          setTimeout(() => {
            setSubmitSuccess(false);
          }, 3000);
        } else {
          // Enhanced error handling
          const errorMessage = parseApiError(result);
          setErrors({ general: errorMessage });
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  // Handle create button click
  const handleCreateClick = () => {
    setShowForm(true);
  };

  // Handle cancel form
  const handleCancelForm = () => {
    setShowForm(false);
    setFormData({
      p_id: null,
      name: '',
      username: '',
      password: '',
      role: '',
      mobile: '',
      count: '',
    });
    setDivisionRows([]);
    setErrors({});
  };
  const handleSaveBranchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const userInfo = JSON.parse(localStorage.getItem('user'));

      // Get the current branch users for the selected branch type
      const currentUsers = branchUsers[selectedBranchForUser] || [];

      if (currentUsers.length === 0) {
        setErrors({ general: 'No users to save' });
        return;
      }

      // Prepare all users data for single API call
      const usersData = currentUsers.map(user => ({
        p_id: userInfo.id, // Current user ID as parent
        name: user.name,
        username: `${user.name}@${selectedBranchForUser.toLowerCase().replace(/\s+/g, '')}`,
        role: 'Department', // or whatever role is appropriate
        branch_type: selectedBranchForUser,
        branch: user.branch || selectedBranchForUser
      }));

      // Single API call with all users
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ users: usersData })
      });

      const result = await response.json();

      if (response.ok && result.error === false) {
        setSubmitSuccess(true);

        // Refresh the data
        await fetchUsers();
        await fetchBranchDetails();

        // Close the form
        setIsAddingBranchUsers(false);

        console.log(`${usersData.length} users created successfully`);

        // Show success message
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      } else {
        setErrors({ general: `Failed to create users: ${parseApiError(result)}` });
      }

    } catch (error) {
      console.error('Error saving branch users:', error);
      setErrors({ general: 'Network error while saving users. Please try again.' });
    }
  };
  // Handle user form submission for add user to department modal
  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!userForm.username.trim()) errors.username = 'Username is required';
    if (!userForm.password.trim()) errors.password = 'Password is required';
    if (!/^\d{10}$/.test(userForm.mobile)) errors.mobile = 'Valid 10-digit mobile number required';

    if (Object.keys(errors).length > 0) {
      setUserFormErrors(errors);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');

      // Determine the role for the new user being added
      let newUserRole = 'user';
      if (currentUserRole === 'department') {
        newUserRole = 'division';
      } else if (currentUserRole === 'division') {
        newUserRole = 'user';
      }

      // Get parent ID for the modal form submission
      const getModalUserParentId = () => {
        const userInfo = localStorage.getItem('user');
        if (userInfo) {
          try {
            const parsed = JSON.parse(userInfo);
            return parsed.id || null; // Current user's ID becomes parent ID
          } catch (error) {
            console.error('Error parsing user info for parent ID:', error);
          }
        }
        return null;
      };

      const submitData = {
        p_id: getModalUserParentId(), // Set parent ID
        name: selectedDepartmentName,
        username: userForm.username,
        password: userForm.password,
        role: newUserRole,
        mobile: userForm.mobile,
      };

      // Debug logs
      console.log('Creating user/division with data:', submitData);
      console.log('Current user role:', currentUserRole);
      console.log('Parent ID being sent:', submitData.p_id);

      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (response.ok && result.error === false) {
        // Success - refresh users and close modal
        await fetchUsers();
        setShowUserFormModal(false);
        setUserForm({ username: '', password: '', mobile: '' });
        setUserFormErrors({});

        // Show success message
        setSubmitSuccess(true);
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      } else {
        const errorMessage = parseApiError(result);
        setUserFormErrors({ general: errorMessage });
      }
    } catch (error) {
      console.error('Network error:', error);
      setUserFormErrors({ general: 'Network error. Please check your connection and try again.' });
    }
  };
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const [selectedUserForResetPassword, setSelectedUserForResetPassword] = useState(null);
  const [stores, setStores] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (token) {
      fetch('https://rcs-dms.onlinetn.com/api/v1//master/stores', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.data && typeof data.data === 'object') {
            const entries = Object.entries(data.data); // [['CBE', 'Coimbatore'], ...]
            setStores(entries);
          }
        })
        .catch(err => console.error('Error fetching stores:', err));
    }
  }, []);



  const [editedStores, setEditedStores] = useState({});


  const [selectedStore, setSelectedStore] = useState("");


  // Function to save all store mappings
  const saveAllStoreMappings = async () => {
    setLoading(true);
    const results = [];

    try {
      // Process each edited store mapping
      for (const [idx, storeValue] of Object.entries(editedStores)) {
        if (storeValue && branchListForSelectedDept[idx]) {
          const branch = branchListForSelectedDept[idx];
          const success = await saveStoreMapping(branch, storeValue);
          results.push({
            branch: branch.name,
            success,
            store: storeValue
          });
        }
      }

      // Show results
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        alert(`Successfully saved ${successCount} store mapping(s)!`);
        // Clear edited stores after successful save
        setEditedStores({});
      } else {
        alert(`Saved ${successCount} mapping(s). ${failCount} failed. Check console for details.`);
      }

      console.log("Store Mapping Results:", results);

      // ✅ NEW: Refresh users and branches immediately
      await fetchUsers();
      await fetchBranchDetails();

    } catch (error) {
      console.error('Error in batch save:', error);
      alert('An error occurred while saving store mappings.');
    } finally {
      setLoading(false);
    }
  };

  // Function to save individual store mapping (for immediate save on change)
  const handleStoreChange = async (idx, storeValue) => {
    // Update the local state
    setEditedStores({ ...editedStores, [idx]: storeValue });

    // Optionally, save immediately when store is selected
    // Uncomment the following lines if you want immediate save on change
    /*
    if (storeValue && branchListForSelectedDept[idx]) {
      const branch = branchListForSelectedDept[idx];
      await saveStoreMapping(branch, storeValue);
    }
    */
  };

  const saveStoreMapping = async (branch, storeValue) => {
    if (!storeValue) {
      alert('Please select a store before saving.');
      return;
    }

    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) {
      alert('Authorization token not found. Please login again.');
      return false;
    }

    const departmentId = users[selectedDepartmentForBranchView?.name]?.id;

    if (!departmentId) {
      alert("Department ID not found! Please select a department first.");
      return false;
    }

    const safeBranchType = branch.branchType;
    const safeBranchName = branch.name;


    const endpoint = `/user/store-map/${departmentId}/${safeBranchType}/${safeBranchName}`;
    const url = `${API_BASE_URL}${endpoint}`;

    console.log("✅ Calling URL:", url);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          store: storeValue
        })
      });

      const result = await response.json();

      if (response.ok && result.error === false) {
        console.log(`✅ Store mapping saved successfully for ${branch.name}`);
        setSuccessMessage(`Store mapping saved successfully for ${branch.name}`);
        // ✅ Update the local branch list state to show the new store immediately
        setBranchListForSelectedDept(prevList =>
          prevList.map(b =>
            b.name === branch.name
              ? { ...b, store: storeValue }
              : b
          )
        );
        // ✅ Update 'users' object so department view gets the latest store mapping
        setUsers(prevUsers => {
          const updatedUsers = { ...prevUsers };
          const deptName = selectedDepartmentForBranchView?.name;
          const branchType = branch.branchType;
          const branchName = branch.name;

          if (
            updatedUsers[deptName] &&
            updatedUsers[deptName][branchType] &&
            Array.isArray(updatedUsers[deptName][branchType][branchName])
          ) {
            updatedUsers[deptName][branchType][branchName] = updatedUsers[deptName][branchType][branchName].map(user => ({
              ...user,
              store: storeValue
            }));
          }

          return updatedUsers;
        });

        return true;
      } else {
        console.error('❌ Failed to save store mapping:', result.message || result);
        alert(result.message || 'Failed to save store mapping.');
        return false;
      }
    } catch (error) {
      console.error('🚨 Error saving store mapping:', error);
      alert('Network error while saving store mapping.');
      return false;
    }
  };


  useEffect(() => {
    const fetchDistricts = async () => {
      const token = localStorage.getItem('authToken');
      try {
        const response = await fetch(`${API_BASE_URL}/master/district`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        if (result.data && Array.isArray(result.data)) {
          setDistrictOptions(result.data);
        }
      } catch (error) {
        console.error('Error fetching districts:', error);
      }
    };

    fetchDistricts();
  }, []);

  useEffect(() => {
    const generateSuffixOnDistrictChange = async () => {
      if (selectedBranchForUser && addUserForm.district) {
        const newSuffix = await generateUsernameSuffix(selectedBranchForUser, addUserForm.district);
        setAddUserForm(prev => ({ ...prev, suffix: newSuffix }));
      }
    };

    generateSuffixOnDistrictChange();
  }, [addUserForm.district, selectedBranchForUser]);

  const [expandedTypeBranches, setExpandedTypeBranches] = useState({});

  useEffect(() => {
    const msg = localStorage.getItem("successMessage");
    if (msg) {
      setSuccessMessage(msg);
      localStorage.removeItem("successMessage"); // clear after showing

      // auto hide after 2s
      setTimeout(() => setSuccessMessage(""), 2000);
    }
  }, []);


  return (
    <div className="bg-gray-50 min-h-screen py-2 sm:py-4 md:py-6 px-2 sm:px-4 lg:px-8">
      <div className="max-w-full sm:max-w-7xl mx-auto">
        {successMessage && (
          <div className="mb-3 px-4 py-2 bg-green-100 text-green-800 rounded text-sm font-medium">
            {successMessage}
          </div>
        )}


        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* <div>
            <h1 className="text-3xl font-bold text-gray-900">{labels.entityNamePlural} Management</h1>
     
          </div> */}
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline"> {labels.successMessage}</span>
          </div>
        )}


        {currentUserRole === 'department' ? (
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100">
              <h2 className="text-lg font-semibold text-sky-800">Unit Management</h2>
            </div>
            <div className="p-4">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Left: Branches Types Form */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Created Types ({divisionGroups.length})</h3>

                  </div>

                  <div className="space-y-2">
                    {divisionGroups.length > 0 ? (
                      divisionGroups.map((division) => (
                        <div key={division.id} className="bg-gradient-to-r border border-black-200 rounded-lg p-2 mb-2">
                          <div className="flex items-center justify-between">

                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-semibold uppercase">
                                {division.name?.[0] || '?'}
                              </div>
                              <div className="text-sm font-semibold text-gray-800">{division.name}</div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={async () => {
                                  if (expandedBranchId === division.id) {
                                    setExpandedBranchId(null);
                                  } else {
                                    setExpandedBranchId(division.id);
                                  }
                                }}
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition shadow-sm border border-green-200"
                              >
                                Units ({division.details ? division.details.length : 0})
                              </button>
                              {/* +Branch button */}
                              <button
                                onClick={() => {
                                  setShowAddUserForm(true);
                                  setSelectedBranchForUser(division.name);

                                  // Don't generate suffix yet — wait for district selection
                                  setAddUserForm({
                                    name: '',
                                    district: '',
                                    location: '',
                                    contact: '',
                                    address: '',
                                    suffix: ''
                                  });

                                  setSelectedBranchView(null);
                                  setSelectedUserView(null);
                                  setSelectedUserEdit(null);
                                  setSelectedUserForResetPassword(null);
                                }}

                                className="px-4 py-2 text-sm font-medium rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 transition shadow-sm border border-sky-200"
                              >
                                Add Unit
                              </button>
                            </div>
                          </div>

                          {expandedBranchId === division.id && (
                            <div className="mt-3 shadow-sm p-3 text-sm relative space-y-2">
                              {division.details && division.details.length > 0 ? (
                                division.details.map((branchItem, idx) => (
                                  <div key={branchItem.id || `${division.name}-${idx}`} className="w-full">
                                    {/* Row with branch name and Users count */}
                                    <div className="flex items-center justify-between px-4 py-3 rounded-md border bg-gray-50 hover:shadow-sm transition">
                                      {/* Branch Name on the left */}
                                      <div className="text-sm font-semibold text-gray-800">
                                        {branchItem.name}
                                      </div>

                                      {/* Buttons on the right */}
                                      <div className="flex gap-2 ml-auto">
                                        <button
                                          onClick={() =>
                                            setExpandedUsers(prev => ({
                                              ...prev,
                                              [branchItem.id]: !prev[branchItem.id]
                                            }))
                                          }
                                          className="px-4 py-2 text-sm font-medium bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition shadow-sm border border-purple-200"
                                        >
                                          Users ({branchItem.users?.length || 0})
                                        </button>

                                        <button
                                          onClick={() => {
                                            setSelectedBranchView(branchItem);
                                            setSelectedUserEdit(null);
                                            setSelectedUserView(null);
                                            setShowAddUserForm(false);
                                          }}
                                          className="px-4 py-2 text-sm font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition shadow-sm border border-green-200"
                                        >
                                          View Unit
                                        </button>
                                      </div>
                                    </div>


                                    {/* Show users when expanded */}
                                    {expandedUsers[branchItem.id] && (
                                      <div className="bg-white rounded-b-md px-5 py-3 ml-4 mt-1">
                                        {branchItem.users && branchItem.users.length > 0 ? (
                                          <ul className="divide-y divide-gray-200">
                                            {branchItem.users.map((user, uIndex) => (
                                              <li
                                                key={uIndex}
                                                className="flex items-center justify-between text-sm text-gray-700 py-2"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs bg-gray-200 px-2 py-1 rounded-full font-medium text-gray-800">
                                                    {user.name}
                                                  </span>
                                                  <span className="text-xs text-gray-500">{user.username}</span>
                                                </div>

                                                <div className="flex gap-2">
                                                  <button
                                                    onClick={() => {
                                                      setSelectedUserEdit(null); // optional: clear edit if open
                                                      setSelectedUserView(user);
                                                    }}
                                                    className="px-2 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition"
                                                  >
                                                    View
                                                  </button>


                                                  <button
                                                    onClick={() => {
                                                      setSelectedUserForResetPassword(user);  // ✅ Show Reset Form
                                                      setShowAddUserForm(false);              // 🔴 Hide Add Branch
                                                      setSelectedUserEdit(null);
                                                      setSelectedUserView(null);
                                                      setExpandedResetUser(user);
                                                    }}
                                                    className="px-2 py-1 text-xs font-medium text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                                                  >
                                                    Reset Password
                                                  </button>

                                                </div>
                                              </li>


                                            ))}
                                          </ul>
                                        ) : (
                                          <div className="text-xs italic text-gray-400">No users</div>
                                        )}
                                      </div>
                                    )}

                                  </div>


                                ))
                              ) : (
                                <div className="text-center text-gray-500 text-sm py-4">
                                  No Unit found for this type
                                </div>
                              )}
                            </div>

                          )}


                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 text-sm py-4">
                        No Unit created yet
                      </div>
                    )}
                  </div>
                </div>


                {/* RIGHT PANEL STARTS */}

                {selectedUserView && (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-sky-800">User Profile</h3>
                      <button
                        className="text-sm text-red-500 hover:text-red-700 font-medium"
                        onClick={() => {
                          setSelectedUserView(null);
                          setEditMode(false);
                        }}
                      >
                        ✖
                      </button>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {[
                        { label: 'Username', value: selectedUserView.username },
                        { label: 'Branch', value: selectedUserView.branch },
                        { label: 'District', value: selectedUserView.district },
                      ].map((item, index) => (
                        <div key={index} className="grid grid-cols-3 gap-4 py-2 items-center">
                          <div className="text-sm font-medium text-gray-600 border-r border-gray-300 pr-2">
                            {item.label}
                          </div>
                          <div className="col-span-2 text-sm text-gray-800 pl-2">
                            {item.value}
                          </div>
                        </div>
                      ))}

                      {/* Full Name */}
                      <div className="grid grid-cols-3 gap-4 py-2 items-center">
                        <div className="text-sm font-medium text-gray-600 border-r border-gray-300 pr-2">
                          Full Name
                        </div>
                        <div className="col-span-2 pl-2">
                          {editMode ? (
                            <input
                              type="text"
                              value={newUserInfo.name}
                              onChange={(e) =>
                                setNewUserInfo({ ...newUserInfo, name: e.target.value })
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-sky-500 focus:ring-1 focus:ring-sky-100 outline-none"
                              placeholder="Enter full name"
                            />
                          ) : (
                            <div className="text-sm text-gray-800">{selectedUserView.name}</div>
                          )}
                        </div>
                      </div>

                      {/* Designation */}
                      <div className="grid grid-cols-3 gap-4 py-2 items-center">
                        <div className="text-sm font-medium text-gray-600 border-r border-gray-300 pr-2">
                          Designation
                        </div>
                        <div className="col-span-2 pl-2">
                          {editMode ? (
                            <input
                              type="text"
                              value={newUserInfo.designation || ''}
                              onChange={(e) =>
                                setNewUserInfo({ ...newUserInfo, designation: e.target.value })
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-sky-500 focus:ring-1 focus:ring-sky-100 outline-none"
                              placeholder="Enter designation"
                            />
                          ) : (
                            <div className="text-sm text-gray-800">{selectedUserView.designation}</div>
                          )}
                        </div>
                      </div>

                      {/* Mobile */}
                      <div className="grid grid-cols-3 gap-4 py-2 items-center">
                        <div className="text-sm font-medium text-gray-600 border-r border-gray-300 pr-2">
                          Mobile
                        </div>
                        <div className="col-span-2 pl-2">
                          {editMode ? (
                            <input
                              type="tel"
                              value={newUserInfo.contact || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only digits, max 12
                                if (/^\d{0,12}$/.test(value)) {
                                  setNewUserInfo({ ...newUserInfo, contact: value });
                                }
                              }}
                              maxLength={12}
                              pattern="\d{12}"
                              required
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-sky-500 focus:ring-1 focus:ring-sky-100 outline-none"
                              placeholder="Enter up to 12-digit mobile number"
                            />


                          ) : (
                            <div className="text-sm text-gray-800">{selectedUserView.mobile}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      {editMode ? (
                        <>
                          <button
                            onClick={() => setEditMode(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              try {


                                const token = localStorage.getItem('authToken') || localStorage.getItem('token');

                                // 1. PUT request to update the user
                                const response = await fetch(
                                  `https://rcs-dms.onlinetn.com/api/v1//user/${selectedUserView.id}`,
                                  {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({
                                      name: newUserInfo.name,
                                      mobile: String(newUserInfo.contact),   // ✅ send as string
                                      designation: newUserInfo.designation,
                                      salutation: newUserInfo.salutation || '',
                                    }),
                                  }
                                );

                                if (!response.ok) {
                                  const errorData = await response.text();
                                  console.error('API Error:', errorData);
                                  throw new Error(`Failed to update user: ${response.status}`);
                                }

                                // ✅ Save success message in localStorage before reload
                                localStorage.setItem("successMessage", "Changes saved successfully!");

                                // ✅ Refresh the page so updated details load fresh
                                window.location.reload();

                              } catch (error) {
                                console.error('Error updating user:', error);
                                localStorage.setItem("successMessage", "Failed to update user. Please try again.");
                                window.location.reload();
                              }
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Save Changes
                          </button>

                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setNewUserInfo({
                              name: selectedUserView.name,
                              contact: selectedUserView.mobile || '',
                              designation: selectedUserView.designation || '',
                              // salutation: selectedUserView.salutation || '',
                            });
                            setEditMode(true);
                          }}
                          className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {selectedBranchView && (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-sky-800">Unit Details</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-sm text-red-500 hover:text-red-700 font-medium"
                          onClick={() => setSelectedBranchView(null)}
                        >
                          ✖
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-100 text-sm">
                      {[
                        { label: 'Unit Name', key: 'name', editable: false },
                        { label: 'District', key: 'district', editable: true },
                        { label: 'Location', key: 'location', editable: true },
                        { label: 'Admin Contact Number', key: 'contact', editable: true },
                        { label: 'Full Address', key: 'address', editable: true }
                      ].map((item, idx) => {
                        const value =
                          selectedBranchView[item.key] ||
                          (selectedBranchView.users && selectedBranchView.users[0]?.[item.key]) ||
                          '';

                        return (
                          <div key={idx} className="grid grid-cols-3 gap-4 py-2 items-center">
                            <div className="text-sm font-medium text-gray-600 border-r border-gray-300 pr-2">
                              {item.label}
                            </div>
                            <div className="col-span-2 pl-2 text-gray-800">
                              {isEditing && item.editable ? (
                                item.key === "district" ? (
                                  <select
                                    value={editedBranch[item.key] ?? value}
                                    onChange={(e) =>
                                      setEditedBranch((prev) => ({
                                        ...prev,
                                        [item.key]: e.target.value
                                      }))
                                    }
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                  >
                                    <option value="">Select District</option>
                                    {districtOptions.map((district) => (
                                      <option key={district} value={district}>
                                        {district}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                    value={editedBranch[item.key] ?? value}
                                    onChange={(e) =>
                                      setEditedBranch((prev) => ({
                                        ...prev,
                                        [item.key]: e.target.value
                                      }))
                                    }
                                  />
                                )
                              ) : (
                                value || '—'
                              )}

                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom-right button area */}
                    <div className="pt-4 flex justify-end space-x-3">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="text-sm text-gray-600 border border-gray-300 px-4 py-1 rounded hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEditedBranch}
                            className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded"
                          >
                            Save
                          </button>

                        </>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-500 px-4 py-1 rounded"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                  </div>
                )}




                {expandedResetUser && (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-sky-800">
                        Reset Password for <span className="text-blue-600">{expandedResetUser.username}</span>
                      </h3>
                      <button
                        onClick={() => {
                          setExpandedResetUser(null);
                          setResetPassword('');
                        }}
                        className="text-sm text-red-500 hover:text-red-700 font-medium"
                      >
                        ✖
                      </button>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm text-gray-600">New Password</label>
                      <input
                        type="text"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-100 outline-none"
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setExpandedResetUser(null);
                          setResetPassword('');
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={async () => {
                          if (!resetPassword) {
                            alert("Please enter a new password");
                            return;
                          }

                          try {
                            const token = localStorage.getItem('authToken');
                            const userId = expandedResetUser?.id;
                            console.log('Resetting for user ID:', userId);

                            const response = await fetch(`https://rcs-dms.onlinetn.com/api/v1//user/${userId}/password/reset`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({
                                new: resetPassword   // ✅ Confirmed for admin; try this for dept too
                              }),
                            });




                            const result = await response.json();

                            if (response.ok) {
                              console.log('✅ Department password reset successful:', result);
                              setSuccessMessage('Password reset successful');
                            } else {
                              console.error('❌ Department password reset failed:', result);
                              setSuccessMessage(result.message || 'Password reset failed');
                            }
                          } catch (err) {
                            console.error('🚨 Error:', err);
                            alert('Something went wrong');
                          }

                          setExpandedResetUser(null);
                          setResetPassword('');
                        }}


                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Save Password
                      </button>
                    </div>
                  </div>
                )}

                {selectedUser && openBranchForm ? (
                  /* Branch Form Panel - Replaces Create Type section */
                  <div className="bg-white shadow-lg rounded-xl p-4 border border-gray-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-800">
                        {isEditingUser ? 'Edit Branch' : 'Branch Details'}
                      </h3>
                      <button
                        className="text-gray-500 hover:text-red-600"
                        onClick={() => {
                          setSelectedUser(null);
                          setOpenBranchForm(null);
                        }}
                        title="Close"
                      >
                        ✖️
                      </button>
                    </div>

                    <div>
                      <label className="text-sm text-gray-700">Full Name:</label>
                      <input
                        type="text"
                        value={selectedUser.name}
                        readOnly={!isEditingUser}
                        onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                        className={`w-full px-3 py-2 border rounded ${isEditingUser ? 'border-gray-300' : 'bg-gray-100'}`}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-700">District:</label>
                      <input
                        type="text"
                        value={selectedUser.district}
                        readOnly={!isEditingUser}
                        onChange={(e) => setSelectedUser({ ...selectedUser, district: e.target.value })}
                        className={`w-full px-3 py-2 border rounded ${isEditingUser ? 'border-gray-300' : 'bg-gray-100'}`}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-700">Location:</label>
                      <input
                        type="text"
                        value={selectedUser.location}
                        readOnly={!isEditingUser}
                        onChange={(e) => setSelectedUser({ ...selectedUser, location: e.target.value })}
                        className={`w-full px-3 py-2 border rounded ${isEditingUser ? 'border-gray-300' : 'bg-gray-100'}`}
                        placeholder="City/Area/Village/Town"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-700">Admin Contact number:</label>
                      <input
                        type="text"
                        value={selectedUser.contact}
                        readOnly={!isEditingUser}
                        onChange={(e) => setSelectedUser({ ...selectedUser, contact: e.target.value })}
                        className={`w-full px-3 py-2 border rounded ${isEditingUser ? 'border-gray-300' : 'bg-gray-100'}`}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-700">Full Address:</label>
                      <input
                        type="text"
                        value={selectedUser.address}
                        readOnly={!isEditingUser}
                        onChange={(e) => setSelectedUser({ ...selectedUser, address: e.target.value })}
                        className={`w-full px-3 py-2 border rounded ${isEditingUser ? 'border-gray-300' : 'bg-gray-100'}`}
                        placeholder="Enter branch address"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Username Suffix:</label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">&lt;username&gt;@</span>
                        <input
                          type="text"
                          value={selectedUser.suffix}
                          readOnly={!isEditingUser}
                          onChange={(e) => setSelectedUser({ ...selectedUser, suffix: e.target.value })}
                          className={`w-48 px-3 py-2 border rounded text-sm ${isEditingUser ? 'border-gray-300' : 'bg-gray-100'}`}
                          placeholder="Auto-generated (editable)"
                        />
                      </div>
                    </div>

                    {isEditingUser && (
                      <div className="text-right">
                        {errors.general && (
                          <p className="text-sm text-red-500 mb-2 text-left">{errors.general}</p>
                        )}

                        <button
                          onClick={async () => {
                            // ✅ Use the renamed validator
                            if (!validateBranchForm()) return;

                            try {
                              const token = localStorage.getItem('authToken');
                              const userInfo = JSON.parse(localStorage.getItem('user'));

                              const branchData = {
                                p_id: userInfo.id,
                                name: addUserForm.name,
                                branch: addUserForm.name,
                                contact: addUserForm.contact || '0000000000',
                                district: addUserForm.district || '',
                                location: addUserForm.location || '',
                                address: addUserForm.address || '',
                                suffix: addUserForm.suffix,
                                branch_type: selectedBranchForUser,
                              };

                              const branchResponse = await fetch(`${API_BASE_URL}/user/division`, {
                                method: 'POST',
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(branchData),
                              });

                              const branchResult = await branchResponse.json();

                              if (branchResponse.ok && branchResult.error === false) {
                                await fetchUsers();
                                await fetchBranchDetails();
                                setAddUserForm({ name: '', district: '', contact: '', address: '', suffix: '', location: '' });
                                setShowAddUserForm(false);
                                setSubmitSuccess(true);
                                setTimeout(() => {
                                  setSubmitSuccess(false);
                                }, 3000);
                              } else {
                                setErrors({ general: `Failed to create branch: ${branchResult.message}` });
                              }
                            } catch (error) {
                              setErrors({ general: 'Network error creating branch' });
                            }
                          }}
                          className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
                        >
                          Save
                        </button>
                      </div>

                    )}
                  </div>
                ) : isAddingBranchUsers ? (
                  <div className="bg-white shadow-lg rounded-xl p-4 border border-gray-200 space-y-4 max-w-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-800">Branch Users</h3>
                      <button
                        onClick={() => setIsAddingBranchUsers(false)}
                        className="text-sm text-gray-500 hover:text-red-600"
                        title="Close"
                      >
                        ✖️
                      </button>
                    </div>

                    {/* Initial Editable Users */}
                    {(branchUsers[selectedBranchForUser] || []).map((user, index) => (
                      <div key={index} className="flex items-center gap-2 mb-1">
                        <input
                          type="text"
                          value={user.name}
                          onChange={(e) => {
                            setBranchUsers(prev => ({
                              ...prev,
                              [selectedBranchForUser]: prev[selectedBranchForUser].map((user, i) =>
                                i === index ? { ...user, name: e.target.value } : user
                              )
                            }));
                          }}
                          className="w-48 px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                        <span className="text-sm text-gray-700 font-medium">@&lt;branchname&gt;</span>

                        {index >= 3 && (
                          <button
                            onClick={() => {
                              setBranchUsers(prev => ({
                                ...prev,
                                [selectedBranchForUser]: prev[selectedBranchForUser].filter((_, i) => i !== index)
                              }));
                            }}
                            className="px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700 transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Add New User */}
                    {showNewUserField ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          className="w-48 px-3 py-2 border border-gray-800 rounded text-sm"
                          placeholder="Enter name"
                        />
                        <span className="text-sm font-medium text-gray-700">@&lt;branchname&gt;</span>
                        <button
                          onClick={() => {
                            if (newUserName.trim()) {
                              const formattedName = newUserName.trim().toLowerCase().replace(/\s+/g, '_');
                              setBranchUsers(prev => ({
                                ...prev,
                                [selectedBranchForUser]: [...(prev[selectedBranchForUser] || []), { name: formattedName, branch: selectedBranchForUser }]
                              }));
                              setNewUserName('');
                              setShowNewUserField(false);
                            }
                          }}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowNewUserField(true)}
                        className="px-3 py-1 bg-sky-600 text-white rounded text-xs hover:bg-sky-700 mt-2"
                      >
                        + Add User
                      </button>
                    )}

                    {/* Save Button */}
                    <div className="text-right pt-3">
                      <button
                        onClick={handleSaveBranchUsers}
                        className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
                      >
                        Save Users
                      </button>
                    </div>
                  </div>

                ) : !showAddUserForm ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800">Create Type</h3>
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name}</p>
                    )}
                    <div className="flex gap-2 items-start">
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={(e) => {
                          handleChange(e);
                          // Clear error when user starts typing
                          if (errors.name) {
                            setErrors(prev => ({ ...prev, name: '' }));
                          }
                        }}
                        className={`w-48 px-3 py-2 border rounded-lg focus:border-sky-500 focus:ring-1 focus:ring-sky-100 outline-none text-sm ${errors.name ? 'border-red-500' : 'border-gray-200'
                          }`}
                        placeholder="Create Type"
                        maxLength={30}
                      />
                      <button
                        type="button"
                        onClick={handleCreateType}
                        disabled={!formData.name.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white shadow-lg rounded-xl p-4 border border-gray-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-800">Create Unit for {selectedBranchForUser}</h3>
                      <button
                        className="text-gray-500 hover:text-red-600"
                        onClick={() => {
                          setShowAddUserForm(false);
                          setAddUserForm({
                            name: '',
                            district: '',
                            location: '',
                            contact: '',
                            address: '',
                            suffix: ''
                          });
                          setErrors({});
                        }}
                        title="Close"
                      >
                        ✖️
                      </button>
                    </div>

                    {/* General Error Message */}
                    {errors.general && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-600">{errors.general}</p>
                      </div>
                    )}

                    {/* Branch Name Field */}
                    <div>
                      <label className="text-sm text-gray-700 font-medium">
                        Unit Name: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={addUserForm.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleAddUserFormChange('name', value);

                          // Auto-generate suffix from first word
                          const firstWord = value.trim().split(' ')[0].toLowerCase();
                          if (firstWord) {
                            handleAddUserFormChange('suffix', firstWord);
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded focus:border-sky-500 focus:ring-1 focus:ring-sky-100 outline-none text-sm ${errors.name ? 'border-red-500' : 'border-gray-300'
                          }`}
                        placeholder="Enter Unit name"
                        maxLength={50}
                      />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    {/* District Field */}
                    <div>
                      <label className="text-sm text-gray-700 font-medium">
                        District: <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="district"
                        value={addUserForm.district}
                        onChange={(e) => handleAddUserFormChange('district', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Select a district</option>
                        {districtOptions.map((district, idx) => (
                          <option key={idx} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>

                      {errors.district && <p className="text-xs text-red-500 mt-1">{errors.district}</p>}
                    </div>


                    {/* Location Field */}
                    <div>
                      <label className="text-sm text-gray-700 font-medium">
                        Location: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={addUserForm.location}
                        onChange={(e) => handleAddUserFormChange('location', e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:border-sky-500 focus:ring-1 focus:ring-sky-100 outline-none text-sm ${errors.location ? 'border-red-500' : 'border-gray-300'
                          }`}
                        placeholder="Enter specific locality/area/city"
                      />
                      {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
                    </div>

                    {/* Contact Field */}
                    <div>
                      <label className="text-sm text-gray-700 font-medium">
                        Admin Contact Number: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={addUserForm.contact}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                          if (value.length <= 10) {
                            handleAddUserFormChange('contact', value);
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded focus:border-sky-500 focus:ring-1 focus:ring-sky-100 outline-none text-sm ${errors.contact ? 'border-red-500' : 'border-gray-300'
                          }`}
                        placeholder="Enter 10-digit contact number"
                        maxLength={10}
                      />
                      {errors.contact && <p className="text-xs text-red-500 mt-1">{errors.contact}</p>}
                      {addUserForm.contact && addUserForm.contact.length < 10 && !errors.contact && (
                        <p className="text-xs text-yellow-600 mt-1">
                          {10 - addUserForm.contact.length} more digits required
                        </p>
                      )}
                    </div>

                    {/* Address Field */}
                    <div>
                      <label className="text-sm text-gray-700 font-medium">
                        Full Address: <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={addUserForm.address}
                        onChange={(e) => handleAddUserFormChange('address', e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:border-sky-500 focus:ring-1 focus:ring-sky-100 outline-none text-sm ${errors.address ? 'border-red-500' : 'border-gray-300'
                          }`}
                        placeholder="Enter complete Unit address"
                        rows={2}
                        maxLength={200}
                      />
                      {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        {addUserForm.address.length}/200 characters
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-700 block mb-1 font-medium">
                        Username Suffix: <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">&lt;username&gt;@</span>
                        <input
                          type="text"
                          value={addUserForm.suffix}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                            handleAddUserFormChange('suffix', value);
                          }}
                          maxLength={10}
                          className={`w-48 px-3 py-2 border rounded text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-100 outline-none ${errors.suffix ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="Auto-generated (editable)"
                        />
                      </div>
                      {errors.suffix && <p className="text-xs text-red-500 mt-1">{errors.suffix}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        Only lowercase letters and numbers allowed with characters upto 9
                      </p>
                      <p className="text-xs text-gray-600 mt-1 font-semibold">
                        Default password :"1234" created
                      </p>
                    </div>


                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setShowAddUserForm(false);
                          setAddUserForm({
                            name: '',
                            district: '',
                            location: '',
                            contact: '',
                            address: '',
                            suffix: ''
                          });
                          setErrors({});
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBranch}
                        disabled={Object.keys(errors).some(key => key !== 'general' && errors[key])}
                        className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Save Unit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={`grid grid-cols-1 transition-all duration-500 ease-in-out ${showForm ? 'xl:grid-cols-2 lg:grid-cols-1' : 'lg:grid-cols-1'} gap-2 xl:gap-4`}>
            <div className={`transition-all duration-500 ease-in-out ${showForm ? 'xl:col-span-1 lg:col-span-1' : 'lg:col-span-1'}`}>
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-sky-800">{labels.entityNamePlural}</h2>
                {!showForm && (
                  <button
                    onClick={handleCreateClick}
                    className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center space-x-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>{labels.createButtonText}</span>
                  </button>
                )}
              </div>
              {loading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600 text-sm">Loading...</p>
                </div>
              ) : getDepartments().length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">

                    {selectedDepartmentForBranchView ? (
                      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-lg font-semibold text-gray-800">
                            Branches under {selectedDepartmentForBranchView.name}
                          </h2>
                          <button
                            onClick={() => {
                              setSelectedDepartmentForBranchView(null);
                              setBranchListForSelectedDept([]);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Departments
                          </button>

                        </div>

                        <div className="overflow-auto">
                          <table className="w-full table-auto border border-gray-300 text-sm text-gray-800">
                            <thead className="bg-gray-100 text-left">
                              <tr>
                                <th className="border px-4 py-2">Unit Type</th>
                                <th className="border px-4 py-2">Unit Name</th>
                                <th className="border px-4 py-2">District</th>
                                <th className="border px-4 py-2">Location</th>
                                <th className="border px-4 py-2">RCS Store</th>
                                <th className="border px-4 py-2">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {branchListForSelectedDept.length > 0 ? (
                                branchListForSelectedDept.map((branch, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50 transition">
                                    <td className="border px-4 py-2">{branch.branchType}</td>
                                    <td className="border px-4 py-2">{branch.name}</td>
                                    <td className="border px-4 py-2">{branch.district}</td>
                                    <td className="border px-4 py-2">{branch.location}</td>
                                    <td className="border px-4 py-2">
                                      {currentUserRole === 'rcs-admin' ? (
                                        <select
                                          value={editedStores[idx] || branch.store || ''}
                                          onChange={(e) => handleStoreChange(idx, e.target.value)}
                                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                        >
                                          <option value="">-- Select Store --</option>
                                          {stores.map(([code, name]) => (
                                            <option key={code} value={code}>
                                              {name}
                                            </option>
                                          ))}
                                        </select>


                                      ) : (
                                        stores.find(([code]) => code === branch.store)?.[1] || '—'
                                      )}
                                    </td>
                                    <td className="border px-4 py-2">
                                      {currentUserRole === 'rcs-admin' ? (
                                        <button
                                          onClick={async () => {
                                            const branch = branchListForSelectedDept[idx];
                                            const storeValue = editedStores[idx];

                                            if (!storeValue) {
                                              alert('Please select a store before saving.');
                                              return;
                                            }

                                            setLoading(true);

                                            const success = await saveStoreMapping(branch, storeValue);

                                            if (success) {
                                              setEditedStores((prev) => {
                                                const updated = { ...prev };
                                                delete updated[idx];
                                                return updated;
                                              });
                                              await fetchBranchDetails();
                                            }

                                            setLoading(false);
                                          }}
                                          disabled={loading || !editedStores[idx]}
                                          className={`px-3 py-1 text-white text-xs rounded ${loading || !editedStores[idx]
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                        >
                                          {loading ? 'Saving...' : 'Save'}
                                        </button>

                                      ) : (
                                        '—'
                                      )}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="5" className="text-center text-gray-500 py-4">
                                    No branches found.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>


                        </div>
                      </div>
                    ) : (
                      <div className="flex w-full space-x-4">
                        <div className={`transition-all duration-500 ${expandedReset || expandedProfile ? 'w-2/3' : 'w-full'}`}>
                          <table className="w-full min-w-[600px]">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Department
                                </th>
                                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Details
                                </th>
                                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Username
                                </th>
                                <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {expandedReset || expandedProfile ? '' : 'Actions'}
                                </th>
                              </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                              {getDepartments().map((department) => {
                                const isExpanded = expandedDepartments.find(d => d.id === department.id);

                                return (
                                  <React.Fragment key={department.id}>
                                    {/* Department Row */}
                                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => handleDepartmentClick(department)}>
                                      <td className="px-2 py-2">
                                        <div className="flex items-center">
                                          <div className="flex-shrink-0 h-6 w-6 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center mr-2">
                                            <span className="text-white font-semibold text-xs">
                                              {(() => {
                                                const words = department.name?.trim().split(' ') || [];
                                                if (words.length === 1) {
                                                  const name = words[0];
                                                  return (name.charAt(0) + name.charAt(name.length - 1)).toUpperCase();
                                                } else if (words.length >= 2) {
                                                  return words
                                                    .slice(0, 2)
                                                    .map(word => word.charAt(0).toUpperCase())
                                                    .join('');
                                                } else {
                                                  return 'DE';
                                                }
                                              })()}
                                            </span>
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium text-gray-900 truncate">{department.name}</div>
                                          </div>
                                        </div>
                                      </td>

                                      <td className="px-2 py-2 text-sm align-top">
                                        {currentUserRole === 'rcs-admin' ? (
                                          <div className="flex flex-wrap gap-1">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                              {department.typeCount} Types
                                            </span>
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              {department.totalBranches} Units
                                            </span>
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                              {department.totalUsers} Users
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {department.userCount} Users
                                          </span>
                                        )}
                                      </td>

                                      <td className="px-2 py-2 text-sm text-gray-800">
                                        {users[department.name]?.username || '—'}
                                      </td>

                                      <td className="px-2 py-2 text-sm">
                                        <div className="flex flex-col items-center space-y-1">
                                          <div className="flex items-center justify-center space-x-1">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setShowForm(false); // Hide create form
                                                setExpandedReset(department.name);
                                                setExpandedProfile(null);
                                                setTempPassword('');
                                                setNewPassword('');
                                              }}
                                              className="px-2 py-1 text-xs font-medium text-orange-600 border border-orange-200 rounded hover:bg-orange-50 transition-colors"
                                            >
                                              Reset Password
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setShowForm(false); // Hide create form
                                                setExpandedReset(null);

                                                // Get the username from the users data structure
                                                const departmentData = users[department.name];
                                                const departmentUsername = departmentData?.username || 'N/A';
                                                const departmentMobile = departmentData?.mobile || 'N/A';

                                                // Create enhanced profile data with username
                                                const enhancedProfileData = {
                                                  ...department,
                                                  username: departmentUsername,
                                                  mobile: departmentMobile
                                                };

                                                setExpandedProfile(department.name);
                                                setExpandedProfileData(enhancedProfileData);
                                              }}
                                              className="px-2 py-1 text-xs font-medium text-green-600 border border-green-200 rounded hover:bg-green-50 transition-colors"
                                            >
                                              Profile
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewBranchesTableFromDivision(department.name); // 👈 call the existing function
                                              }}
                                              className="px-2 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                                            >
                                              Store Mapping
                                            </button>
                                            <svg
                                              className="w-3 h-3 text-gray-400 transition-transform"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                            {(currentUserRole === 'department' || currentUserRole === 'division') && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setShowForm(false); // Hide create form
                                                  setSelectedDepartmentName(department.name);
                                                  setShowUserFormModal(true);
                                                  setUserForm({ username: '', password: '', mobile: '' });
                                                  setUserFormErrors({});
                                                }}
                                                className="px-2 py-1 text-xs font-medium text-sky-600 border border-sky-200 rounded hover:bg-sky-50 transition-colors"
                                              >
                                                Add User
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Expanded Divisions Row */}
                                    {isExpanded && (
                                      <tr>
                                        <td colSpan="4" className="px-2 sm:px-4 py-2 bg-gray-50">
                                          <div className="flex flex-col space-y-2 w-full">
                                            {isExpanded.divisions
                                              ?.filter((division) => {
                                                const name = division.name?.toLowerCase();
                                                return name !== 'id' && name !== 'username' && name !== 'mobile';
                                              })
                                              .map((division, index) => {
                                                const typeKey = `${isExpanded.name}-${division.name}`;
                                                const isTypeExpanded = expandedTypes.includes(typeKey);

                                                return (
                                                  <div key={division.id || index} className="w-full border border-gray-200 rounded-lg">
                                                    {/* Type Header - Clickable */}
                                                    {/* Type Header - Non-clickable */}
                                                    <div
                                                      className="flex items-center justify-between p-2 bg-white rounded-t-lg"
                                                    >
                                                      <div className="flex items-center space-x-3">
                                                        <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                                                          <span className="text-white font-medium text-xs">
                                                            {currentUserRole === 'rcs-admin'
                                                              ? (division.name ? division.name.charAt(0).toUpperCase() : 'T')
                                                              : (division.username ? division.username.charAt(0).toUpperCase() : division.name ? division.name.charAt(0).toUpperCase() : 'U')
                                                            }
                                                          </span>
                                                        </div>
                                                        <div>
                                                          <div className="flex items-center space-x-2">
                                                            <div className="text-sm font-medium text-gray-900">{division.name || division.username}</div>
                                                            {currentUserRole === 'rcs-admin' && (
                                                              <div className="flex gap-1">
                                                                <span
                                                                  onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const key = `${isExpanded.name}-${division.name}`;
                                                                    setExpandedTypeBranches(prev => ({
                                                                      ...prev,
                                                                      [key]: !prev[key]
                                                                    }));
                                                                  }}
                                                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer"
                                                                >
                                                                  {division.branchCount} Units
                                                                </span>

                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                  {division.userCount} Users
                                                                </span>


                                                              </div>
                                                            )}
                                                          </div>
                                                          {currentUserRole !== 'rcs-admin' && (
                                                            <div className="text-xs text-gray-500">{division.role}</div>
                                                          )}
                                                        </div>
                                                      </div>
                                                      <div className="flex items-center space-x-2">
                                                        {division.mobile && (
                                                          <div className="text-right">
                                                            <div className="text-sm text-gray-600">{division.mobile}</div>
                                                          </div>
                                                        )}

                                                      </div>
                                                    </div>
                                                    {expandedTypeBranches[`${isExpanded.name}-${division.name}`] && (
                                                      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                                                        <div className="space-y-3">
                                                          {(() => {
                                                            const departmentData = users[isExpanded.name] || {};
                                                            const typeData = departmentData[division.name] || {};
                                                            const branches = [];

                                                            Object.keys(typeData).forEach(branchKey => {
                                                              const branchUsers = typeData[branchKey];
                                                              if (Array.isArray(branchUsers) && branchUsers.length > 0) {
                                                                const firstUser = branchUsers[0];
                                                                branches.push({
                                                                  name: branchKey || firstUser.branch || firstUser.location || 'Unknown Branch',
                                                                  userCount: branchUsers.length
                                                                });
                                                              }
                                                            });

                                                            return branches.length > 0 ? (
                                                              [...branches]
                                                                .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                                                                .map((branch, index) => (

                                                                  <div
                                                                    key={index}
                                                                    className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition"
                                                                  >
                                                                    <div className="flex items-center space-x-2">
                                                                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                                                                        {branch.name.charAt(0).toUpperCase()}
                                                                      </div>
                                                                      <span className="text-sm font-medium text-gray-800">{branch.name}</span>
                                                                    </div>
                                                                    <div className="ml-auto text-sm font-semibold text-gray-700">
                                                                      👥 {branch.userCount} User{branch.userCount !== 1 ? 's' : ''}
                                                                    </div>

                                                                  </div>
                                                                ))
                                                            ) : (
                                                              <div className="text-center text-gray-500 text-sm py-2">
                                                                No branches found in this type
                                                              </div>
                                                            );
                                                          })()}
                                                        </div>
                                                      </div>
                                                    )}

                                                    {/* Users List - Expandable */}
                                                    {expandedTypes.includes(`${isExpanded.name}-${division.name}`) && currentUserRole === 'rcs-admin' && (
                                                      <div className="border-t border-gray-200 bg-gray-50 p-3">

                                                        {/* Branches List Only */}
                                                        <div className="space-y-2">
                                                          {(() => {
                                                            const departmentData = users[isExpanded.name] || {};
                                                            const typeData = departmentData[division.name] || {};
                                                            const branches = [];

                                                            // Collect branches (not users)
                                                            Object.keys(typeData).forEach(branchKey => {
                                                              const branchUsers = typeData[branchKey];
                                                              if (Array.isArray(branchUsers) && branchUsers.length > 0) {
                                                                const firstUser = branchUsers[0];
                                                                branches.push({
                                                                  name: branchKey || firstUser.branch || firstUser.location || 'Unknown Branch',
                                                                  userCount: branchUsers.length,
                                                                  store: firstUser.store,
                                                                  users: branchUsers,
                                                                  branchKey: branchKey
                                                                });
                                                              }
                                                            });

                                                            return branches.length > 0 ? (
                                                              branches.map((branch, index) => (
                                                                <div key={index} className="bg-white rounded border border-gray-100 p-3">
                                                                  <div className="flex items-center justify-between mb-2">
                                                                    <div className="font-medium text-gray-900 text-sm">
                                                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mr-2">
                                                                        {branch.name}
                                                                      </span>
                                                                      <span className="text-gray-600">({branch.userCount} users)</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                      {/* Show branch store mapping */}
                                                                      {branch.store && (
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                          Store: {branch.store}
                                                                        </span>
                                                                      )}
                                                                      {/* Change Store Button for this branch */}
                                                                      <button
                                                                        onClick={() => {
                                                                          const branchKey = `${isExpanded.name}-${division.name}-${branch.branchKey}`;
                                                                          setEditingGroupId(editingGroupId === branchKey ? null : branchKey);
                                                                        }}
                                                                        className="px-2 py-1 text-xs font-medium text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition"
                                                                      >
                                                                        {editingGroupId === `${isExpanded.name}-${division.name}-${branch.branchKey}` ? 'Cancel' : 'Change Store'}
                                                                      </button>
                                                                    </div>
                                                                  </div>

                                                                  {/* Store dropdown for this specific branch */}
                                                                  {editingGroupId === `${isExpanded.name}-${division.name}-${branch.branchKey}` && (
                                                                    <div className="mt-2 flex items-center gap-2">
                                                                      <select
                                                                        value={selectedStore || ""}
                                                                        onChange={(e) => {
                                                                          setSelectedStore(e.target.value);
                                                                        }}
                                                                        className="w-1/5 px-2 py-1 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none text-xs"
                                                                      >
                                                                        <option value="">-- Select Store --</option>
                                                                        {stores.map((storeName, index) => (
                                                                          <option key={index} value={storeName}>
                                                                            {storeName}
                                                                          </option>
                                                                        ))}
                                                                      </select>
                                                                      <button
                                                                        onClick={() => {
                                                                          console.log("Selected Store for branch:", selectedStore);
                                                                          // Call your save API here if needed
                                                                          setEditingGroupId(null);
                                                                        }}
                                                                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                                                      >
                                                                        Save
                                                                      </button>


                                                                      <button
                                                                        onClick={() => setEditingGroupId(null)}
                                                                        className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                                                      >
                                                                        Cancel
                                                                      </button>
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              ))
                                                            ) : (
                                                              <div className="text-center text-gray-500 text-sm py-2">
                                                                No branches found in this type
                                                              </div>
                                                            );
                                                          })()}
                                                        </div>
                                                      </div>
                                                    )}                                </div>
                                                );
                                              })}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>

                          </table>

                        </div>
                        {(expandedReset || expandedProfile) && (
                          <div className="w-80 transition-all duration-300 bg-white border rounded shadow p-3 space-y-3">
                            {expandedReset && (
                              <div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                                  Reset Password for <span className="text-blue-600">{expandedReset}</span>
                                </h3>

                                <div className="space-y-2">
                                  <label className="block text-xs text-gray-500">Password</label>
                                  <input
                                    type="text"
                                    value={tempPassword}
                                    onChange={(e) => setTempPassword(e.target.value)}
                                    className="w-full px-2 py-1.5 border rounded text-sm"
                                    placeholder="Enter new password"
                                  />

                                  <div className="flex justify-end space-x-2 pt-1">
                                    <button
                                      onClick={async () => {
                                        if (!tempPassword) {
                                          console.warn("Password field is empty.");
                                          return;
                                        }

                                        try {
                                          const token = localStorage.getItem('authToken'); // optional if auth required
                                          const userId = users[expandedReset]?.id || expandedReset; // supports both name-based or ID-based reset
                                          console.log(userId);

                                          const response = await fetch(`https://rcs-dms.onlinetn.com/api/v1//user/${userId}/password/reset`, {
                                            method: 'PUT',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              Authorization: `Bearer ${token}`, // remove if not needed
                                            },
                                            body: JSON.stringify({ new: tempPassword }),
                                          });

                                          const result = await response.json();

                                          if (response.ok) {
                                            console.log('✅ Password reset successful:', result);
                                            setSuccessMessage('Password reset successfully');
                                          } else {
                                            console.error('❌ Password reset failed:', result);
                                            setSuccessMessage('Password reset failed');
                                          }
                                        } catch (error) {
                                          console.error('🚨 Error resetting password:', error);
                                          alert('Error while resetting password');
                                        }

                                        setExpandedReset(null);
                                        setTempPassword('');
                                      }}

                                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setExpandedReset(null);
                                        setTempPassword('');
                                      }}
                                      className="px-3 py-1 bg-gray-300 text-xs rounded text-gray-700 hover:bg-gray-400"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>

                            )}
                            {expandedProfile && !expandedReset && (
                              <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-800">
                                  Profile: <span className="text-blue-600">{expandedProfileData?.name || 'N/A'}</span>
                                </h3>

                                <div className="space-y-2 text-xs text-gray-800">
                                  <div className="flex items-center">
                                    <label className="w-20 text-gray-600 font-medium">Username:</label>
                                    <span className="flex-1 px-2 py-1 text-xs">{expandedProfileData?.username || 'N/A'}</span>
                                  </div>

                                  <div className="flex items-center">
                                    <label className="w-20 text-gray-600 font-medium">Name:</label>
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={expandedProfileData?.name || ''}
                                        onChange={(e) => setExpandedProfileData({ ...expandedProfileData, name: e.target.value })}
                                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:border-sky-500 focus:ring-1 focus:ring-sky-100 outline-none"
                                      />
                                    ) : (
                                      <span className="flex-1 px-2 py-1 text-xs">{expandedProfileData?.name || 'N/A'}</span>
                                    )}
                                  </div>

                                  <div className="flex items-center">
                                    <label className="w-20 text-gray-600 font-medium">Mobile:</label>
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={expandedProfileData?.mobile || ''}
                                        onChange={(e) =>
                                          setExpandedProfileData({
                                            ...expandedProfileData,
                                            mobile: e.target.value,
                                          })
                                        }
                                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:border-sky-500 focus:ring-1 focus:ring-sky-100 outline-none"
                                      />
                                    ) : (
                                      <span className="flex-1 px-2 py-1 text-xs">{expandedProfileData?.mobile || 'N/A'}</span>
                                    )}
                                  </div>
                                </div>

                                <div className="pt-1 flex justify-end space-x-2">
                                  {isEditing ? (
                                    <>
                                      <button
                                        onClick={async () => {
                                          try {
                                            // Get the token from localStorage or wherever you store it
                                            const token = localStorage.getItem('authToken') ||
                                              localStorage.getItem('token') ||
                                              localStorage.getItem('accessToken');

                                            if (!token) {
                                              alert('Authentication token not found. Please login again.');
                                              return;
                                            }

                                            // Get the department ID from the users data structure
                                            const departmentData = users[expandedProfile];
                                            const departmentId = departmentData?.id;

                                            if (!departmentId) {
                                              alert('Department ID not found. Please try again.');
                                              return;
                                            }

                                            const response = await fetch(`https://rcs-dms.onlinetn.com/api/v1//user/${departmentId}`, {
                                              method: 'PUT',
                                              headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`,
                                              },
                                              body: JSON.stringify({
                                                name: expandedProfileData?.name,
                                                mobile: expandedProfileData?.mobile,
                                              }),
                                            });

                                            if (!response.ok) {
                                              const errorData = await response.text();
                                              console.error('API Error:', errorData);
                                              throw new Error(`Failed to update profile: ${response.status}`);
                                            }

                                            // Success handling
                                            console.log('Profile updated successfully');
                                            setIsEditing(false);

                                            // Show success alert and feedback
                                            setSuccessMessage('Profile updated successfully!');
                                            setSubmitSuccess(true);
                                            setTimeout(() => setSubmitSuccess(false), 3000);

                                          } catch (error) {
                                            console.error('Error updating profile:', error);
                                            alert('Failed to update profile. Please try again.');
                                          }
                                        }}
                                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                      >
                                        Save
                                      </button>

                                      <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-3 py-1 text-xs bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <button

                                          className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                                        >
                                          Archive
                                        </button>

                                        <button
                                          onClick={() => setIsEditing(true)}
                                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                          Edit
                                        </button>

                                        <button
                                          onClick={() => setExpandedProfile(null)}
                                          className="px-3 py-1 text-xs bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                                        >
                                          Close
                                        </button>
                                      </div>
                                    </>

                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No {labels.entityNamePlural.toLowerCase()} found</h3>
                </div>
              )}
            </div>

            <div className={`transition-all duration-500 ease-in-out transform ${showForm
              ? 'xl:col-span-1 lg:col-span-1 translate-x-0 opacity-100 mt-8 xl:mt-0'
              : 'xl:col-span-0 lg:col-span-0 translate-x-full opacity-0 overflow-hidden w-0'
              } ${showForm ? 'block' : 'hidden xl:block'}`}>
              <div className="bg-white shadow-xl rounded-2xl overflow-hidden h-fit">
                <div className="px-6 py-4 bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100 flex justify-between items-center">
                  <h2 className="text-lg sm:text-xl font-semibold text-sky-800">{labels.formTitle}</h2>
                  <button
                    onClick={handleCancelForm}
                    className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6">
                  {errors.general && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error Creating {labels.entityName}</h3>
                          <p className="mt-1 text-sm text-red-600">{errors.general}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        {labels.nameLabel} *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 ${errors.name ? 'border-red-500' : 'border-gray-200'
                          } rounded-xl focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none transition-all duration-300 text-sm sm:text-base`}
                        placeholder={labels.namePlaceholder}
                      />
                      {errors.name && (
                        <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        Username *
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 ${errors.username ? 'border-red-500' : 'border-gray-200'
                            } rounded-xl focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none transition-all duration-300 text-sm sm:text-base`}
                          placeholder="Enter username"
                        />
                        <span className="text-gray-500 font-medium">@</span>
                        <input
                          type="text"
                          name="domain"
                          value={formData.domain || formData.name.toLowerCase().replace(/\s+/g, '')}
                          onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none transition-all duration-300 text-sm sm:text-base"
                          placeholder=""
                        />
                      </div>
                      {errors.username && (
                        <p className="mt-2 text-sm text-red-600">{errors.username}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        Password *
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 ${errors.password ? 'border-red-500' : 'border-gray-200'
                          } rounded-xl focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none transition-all duration-300 text-sm sm:text-base`}
                        placeholder="Enter password"
                      />
                      {errors.password && (
                        <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        Contact *
                      </label>
                      <input
                        type="text"
                        id="mobile"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 ${errors.mobile ? 'border-red-500' : 'border-gray-200'
                          } rounded-xl focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none transition-all duration-300 text-sm sm:text-base`}
                        placeholder="Enter 10-digit mobile number"
                      />
                      {errors.mobile && (
                        <p className="mt-2 text-sm text-red-600">{errors.mobile}</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            p_id: null,
                            name: '',
                            username: '',
                            password: '',
                            role: '',
                            mobile: '',
                            count: '',
                          });
                          setDivisionRows([]);
                          setErrors({});
                        }}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-medium text-sm"
                      >
                        Clear Form
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm`}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Creating...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>{labels.createButtonText}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Add User to Department Modal */}
        {showUserFormModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="px-6 py-4 bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-sky-800">
                  Add {currentUserRole === 'department' ? 'Division' : 'User'} to {selectedDepartmentName}
                </h2>
                <button
                  onClick={() => {
                    setShowUserFormModal(false);
                    setUserForm({ username: '', password: '', mobile: '' });
                    setUserFormErrors({});
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {userFormErrors.general && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{userFormErrors.general}</p>
                  </div>
                )}

                <form onSubmit={handleUserFormSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="userUsername" className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      id="userUsername"
                      value={userForm.username}
                      onChange={(e) => {
                        setUserForm({ ...userForm, username: e.target.value });
                        if (userFormErrors.username) {
                          setUserFormErrors({ ...userFormErrors, username: '' });
                        }
                      }}
                      className={`w-full px-3 py-2 border-2 ${userFormErrors.username ? 'border-red-500' : 'border-gray-200'
                        } rounded-lg focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none transition-all`}
                      placeholder="Enter username"
                    />
                    {userFormErrors.username && (
                      <p className="mt-1 text-sm text-red-600">{userFormErrors.username}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="userPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      id="userPassword"
                      value={userForm.password}
                      onChange={(e) => {
                        setUserForm({ ...userForm, password: e.target.value });
                        if (userFormErrors.password) {
                          setUserFormErrors({ ...userFormErrors, password: '' });
                        }
                      }}
                      className={`w-full px-3 py-2 border-2 ${userFormErrors.password ? 'border-red-500' : 'border-gray-200'
                        } rounded-lg focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none transition-all`}
                      placeholder="Enter password"
                    />
                    {userFormErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{userFormErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="userMobile" className="block text-sm font-medium text-gray-700 mb-2">
                      Contact *
                    </label>
                    <input
                      type="text"
                      id="userMobile"
                      value={userForm.mobile}
                      onChange={(e) => {
                        setUserForm({ ...userForm, mobile: e.target.value });
                        if (userFormErrors.mobile) {
                          setUserFormErrors({ ...userFormErrors, mobile: '' });
                        }
                      }}
                      className={`w-full px-3 py-2 border-2 ${userFormErrors.mobile ? 'border-red-500' : 'border-gray-200'
                        } rounded-lg focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none transition-all`}
                      placeholder="Enter 10-digit mobile number"
                    />
                    {userFormErrors.mobile && (
                      <p className="mt-1 text-sm text-red-600">{userFormErrors.mobile}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserFormModal(false);
                        setUserForm({ username: '', password: '', mobile: '' });
                        setUserFormErrors({});
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
                    >
                      Add {currentUserRole === 'department' ? 'Division' : 'User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
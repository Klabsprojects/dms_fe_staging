import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DeletePc from "./DeletePc";

const DeletePurchaseConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);
  const [pcDocument, setPcDocument] = useState("");
  const [loading, setLoading] = useState(false);

  const { indentId, remarks, notificationId } = location.state || {};

  useEffect(() => {
    if (indentId) {
      fetchIndentDetail(indentId);
    }
  }, [indentId]);

const fetchIndentDetail = async (id) => {
  try {
    setLoading(true);
    const token = window.localStorage.getItem("authToken");
    if (!token) return;

    // ✅ Fetch approved indent list
    const response = await fetch(
      `https://rcs-dms.onlinetn.com/api/v1/indent/approved/list`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!data.error && Array.isArray(data.data)) {
      // ✅ Find matching indent by ID
      const matchingIndent = data.data.find(
        (item) => String(item.id) === String(id)
      );

      if (matchingIndent && matchingIndent.uploaded_pc) {
        setPcDocument(matchingIndent.uploaded_pc);
      } else {
        console.warn("No uploaded PC found for this indent.");
        setPcDocument("");
      }
    }
  } catch (err) {
    console.error("Error fetching indent details:", err);
  } finally {
    setLoading(false);
  }
};


  const handleClose = () => {
    setShowModal(false);
    navigate(-1);
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = window.localStorage.getItem("authToken");
      if (!token) return;

      await fetch(
        `https://rcs-dms.onlinetn.com/api/v1//notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleConfirm = async (editedRemarks) => {
    try {
      const token = window.localStorage.getItem("authToken");
      const response = await fetch(
        `https://rcs-dms.onlinetn.com/api/v1/indent/${indentId}/pc-del`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ remarks: editedRemarks }),
        }
      );

      if (response.ok) {
        if (notificationId) {
          await markNotificationAsRead(notificationId);
        }
        alert("PC deleted successfully!");
        navigate(-1);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete PC: ${errorData.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error deleting PC:", err);
      alert("An error occurred while deleting the PC");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading PC document...</div>
      </div>
    );
  }

  return (
    <DeletePc
      open={showModal}
      onClose={handleClose}
      onConfirm={handleConfirm}
      pcDocument={pcDocument}
      remarks={remarks}
    />
  );
};

export default DeletePurchaseConfirmationPage;

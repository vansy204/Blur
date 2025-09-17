import axios from "axios";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import { getToken } from "../../service/LocalStorageService";
import { fetchUserInfo } from "../../api/userApi";
import { useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { uploadToCloudnary } from "../../Config/UploadToCloudnary";
// đảm bảo đúng path import

const EditAccountPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    city: "",
    phone: "",
    email: "",
    gender: "",
    website: "",
    imageUrl: "",
    address: "",
    dob: "",
  });

  const token = getToken();
  const toast = useToast();
  const navigate = useNavigate();

  // Load user info ban đầu
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userInfo = await fetchUserInfo(token);
        setFormData((prev) => ({
          ...prev,
          ...userInfo,
          dob: userInfo?.dob || "",
        }));
      } catch (error) {
        toast({
          title: "Failed to load user info",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      }
    };
    fetchUser();
  }, [token, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const uploadedUrl = await uploadToCloudnary(file);
        setFormData((prev) => ({ ...prev, imageUrl: uploadedUrl }));
      } catch (err) {
        toast({
          title: "Image upload failed",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userInfo = await fetchUserInfo(token);
      const response = await axios.put(
        `/api/profile/users/${userInfo.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.code !== 1000) {
        throw new Error(response.data?.message);
      }

      toast({
        title: "User profile updated.",
        status: "success",
        duration: 3000,
        position: "top-right",
        isClosable: true,
      });

      navigate("/profile");
    } catch (error) {
      toast({
        title: "Update failed",
        description: error.message || "Something went wrong",
        status: "error",
        duration: 3000,
        position: "top-right",
        isClosable: true,
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Edit Profile</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar upload */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative group">
            <img
              src={
                formData.imageUrl ||
                "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
              }
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 shadow-md"
            />
            <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition">
              <span className="text-white text-sm">Change</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Tên */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            className="border rounded px-4 py-2"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            className="border rounded px-4 py-2"
          />
        </div>

        {/* Ngày sinh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DatePicker
            selected={formData.dob ? new Date(formData.dob) : null}
            onChange={(date) =>
              setFormData((prev) => ({
                ...prev,
                dob: date.toISOString().split("T")[0],
              }))
            }
            dateFormat="yyyy-MM-dd"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            placeholderText="Select Date of Birth"
            className="border rounded px-4 py-2 w-full"
          />
        </div>

        {/* Tiểu sử */}
        <textarea
          name="bio"
          placeholder="Bio"
          value={formData.bio}
          onChange={handleChange}
          rows={3}
          className="w-full border rounded px-4 py-2"
        />

        {/* Thành phố - Địa chỉ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
            className="border rounded px-4 py-2"
          />
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            className="border rounded px-4 py-2"
          />
        </div>

        {/* Email - SĐT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="border rounded px-4 py-2"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            className="border rounded px-4 py-2"
          />
        </div>

        {/* Giới tính - Website */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="border rounded px-4 py-2"
          >
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <input
            type="text"
            name="website"
            placeholder="Website"
            value={formData.website}
            onChange={handleChange}
            className="border rounded px-4 py-2"
          />
        </div>

        {/* Nút lưu */}
        <div className="text-center">
          <button
            type="submit"
            className="px-6 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAccountPage;

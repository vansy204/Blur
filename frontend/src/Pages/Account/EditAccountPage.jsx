import axios from "axios";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import { getToken } from "../../service/LocalStorageService";
import { fetchUserInfo } from "../../api/userApi";
import { useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { uploadToCloudnary } from "../../Config/UploadToCloudnary";
import { useDarkMode } from "../../hooks/useDarkMode"; // Hook để quản lý dark mode

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
  const { isDarkMode, toggleDarkMode } = useDarkMode();

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
        `http://localhost:8888/api/profile/users/${userInfo.id}`,
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
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* Header với nút Dark Mode */}
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl sm:text-2xl font-bold text-center flex-1 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Edit Profile
          </h2>
          
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label="Toggle dark mode"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              {isDarkMode ? (
                // Sun icon for dark mode
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              ) : (
                // Moon icon for light mode
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              )}
            </svg>
          </button>
        </div>

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
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 shadow-md transition-colors duration-300 ${
                  isDarkMode 
                    ? 'border-gray-600' 
                    : 'border-gray-300'
                }`}
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
              className={`border rounded px-4 py-2 transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              className={`border rounded px-4 py-2 transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
          </div>

          {/* Ngày sinh */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`date-picker-wrapper ${isDarkMode ? 'dark' : ''}`}>
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
                className={`border rounded px-4 py-2 w-full transition-colors duration-300 ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
            </div>
          </div>

          {/* Tiểu sử */}
          <textarea
            name="bio"
            placeholder="Bio"
            value={formData.bio}
            onChange={handleChange}
            rows={3}
            className={`w-full border rounded px-4 py-2 resize-none transition-colors duration-300 ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />

          {/* Thành phố - Địa chỉ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              className={`border rounded px-4 py-2 transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              className={`border rounded px-4 py-2 transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
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
              className={`border rounded px-4 py-2 transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
              className={`border rounded px-4 py-2 transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
          </div>

          {/* Giới tính - Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={`border rounded px-4 py-2 transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            >
              <option value="" className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                Gender
              </option>
              <option value="male" className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                Male
              </option>
              <option value="female" className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                Female
              </option>
              <option value="other" className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                Other
              </option>
            </select>
            <input
              type="text"
              name="website"
              placeholder="Website"
              value={formData.website}
              onChange={handleChange}
              className={`border rounded px-4 py-2 transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
          </div>

          {/* Nút lưu */}
          <div className="text-center">
            <button
              type="submit"
              className={`px-6 py-2 rounded font-medium transition-all duration-300 transform hover:scale-105 ${
                isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-500/25'
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-blue-500/25'
              }`}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAccountPage;
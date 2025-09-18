import { Input, Spinner, Skeleton, SkeletonCircle } from "@chakra-ui/react";
import axios from "axios";
import React, { useState } from "react";
import { IoSearchOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../service/LocalStorageService";

const SearchPage = () => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = getToken();

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true); // Bật loading trước khi gọi API
    try {
      const response = await axios.get(
        `/api/profile/users/search/${search}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response?.data.code !== 1000) {
        throw new Error(response?.data.message);
      }
      setResults(response?.data.result);
      
    } catch (error) {
      console.error(error.message);
      setResults([]); // Xóa kết quả cũ nếu có lỗi
    } finally {
      setLoading(false); // Tắt loading sau khi gọi API xong
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-semibold mb-4">Search</h1>

      {/* Thanh tìm kiếm */}
      <form
        onSubmit={handleSearch}
        className="w-full max-w-md flex items-center border rounded-lg p-2 shadow-sm"
      >
        <IoSearchOutline className="text-xl mx-2" />
        <Input
          placeholder="Search..."
          onChange={(e) => setSearch(e.target.value)}
          value={search}
          className="flex-1 outline-none border-none"
          onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
        />
      </form>

      {/* Hiển thị kết quả */}
      <div className="w-full max-w-md mt-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4 p-3">
                <SkeletonCircle size="10" />
                <Skeleton height="20px" width="70%" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <ul className="bg-white shadow-md rounded-lg overflow-hidden">
            {results.map((item) => (
              <li
                key={item.id}
                className="p-3 border-b cursor-pointer hover:bg-gray-100 transition"
                onClick={() => navigate(`/profile/user/?profileId=${item.id}`)}
                >
                <div className="flex items-center">
                  <img
                    src={
                      item.imageUrl ||
                      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
                    }
                    alt={item.firstName}
                    className="w-10 h-10 rounded-full object-cover mr-3"
                  />
                  <span>{item.firstName} {item.lastName}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center mt-4">No results found</p>
        )}
      </div>
    </div>
  );
};

export default SearchPage;

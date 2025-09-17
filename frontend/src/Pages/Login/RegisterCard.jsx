import { Button, Card, CardBody, CardFooter, CardHeader, Heading, Image, Stack, useToast } from '@chakra-ui/react';

import React, { useState } from 'react';
import { FaGoogle, FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaCalendarAlt } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/authAPI';
import axios from 'axios';
import { getToken } from '../../service/LocalStorageService';

const RegisterCard = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: '',
    dob: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const token = getToken();
   const toast = useToast();
    const showToast = (title, description, status) => {
      toast({
        title,
        description,
        status,
        duration: 5000,
        position: "top-right",
        isClosable: true,
      });
    };
  const handleSubmit = async (event) => {
    event.preventDefault();
    const res = await axios.post('/api/identity/users/registration', formData);
    if(res.data?.code !== 1000){
        showToast("Registration Error", res.data?.message, "error");
    }
      showToast("Registration Success", "You have successfully registered", "success");
      navigate("/login");
  }
  
  const handleClick = () => {
    // Handle Google login
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
     <div className="flex-row">
       <Card
         direction={{ base: "column", sm: "row" }}
         overflow="hidden"
         variant="outline"
         style={{ border: "none" }}
       >
         <div className="d-none d-md-flex" style={{ flex: 1, padding: 0 }}>
           <Image
             className=""
             src="../blur.jpg"
             alt="blur"
             style={{
               objectFit: "cover",
               width: "100%",
               height: "100%",
               margin: 0,
               padding: 0,
               border: "none",
             }}
           />
         </div>
 
         <Stack style={{ flex: 1 }}>
           <CardHeader className="text-center mb-5 fw-light fs-5">
             <Heading className="">Sign In To Experience Blur</Heading>
           </CardHeader>
           <CardBody className="flex flex-col items-center justify-center">
             <div className="w-full max-w-sm">
               {/* Username Input */}
               <div className="mb-4 relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <FaUser className="text-gray-400 text-sm" />
                 </div>
                 <input
                   className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 shadow-sm"
                   type="text"
                   name="username"
                   id="username"
                   placeholder="Username"
                   required
                   autoFocus
                   value={formData.username}
                   onChange={(e) => handleInputChange('username', e.target.value)}
                 />
               </div>

               {/* Email Input */}
               <div className="mb-4 relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <FaEnvelope className="text-gray-400 text-sm" />
                 </div>
                 <input
                   className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 shadow-sm"
                   type="email"
                   name="email"
                   id="email"
                   placeholder="Email"
                   required
                   value={formData.email}
                   onChange={(e) => handleInputChange('email', e.target.value)}
                 />
               </div>

               {/* Password Input */}
               <div className='mb-4 relative'>
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <FaLock className="text-gray-400 text-sm" />
                 </div>
                 <input
                   name="password"
                   id="password"
                   type={showPassword ? "text" : "password"}
                   placeholder="Password"
                   className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 shadow-sm"
                   value={formData.password}
                   onChange={(e) => handleInputChange('password', e.target.value)}
                 />
                 <button
                   type="button"
                   className="absolute inset-y-0 right-0 pr-3 flex items-center"
                   onClick={() => setShowPassword(!showPassword)}
                 >
                   {showPassword ? (
                     <FaEyeSlash className="text-gray-400 hover:text-gray-600 text-sm" />
                   ) : (
                     <FaEye className="text-gray-400 hover:text-gray-600 text-sm" />
                   )}
                 </button>
               </div>

               {/* Confirm Password Input */}
               <div className='mb-4 relative'>
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <FaLock className="text-gray-400 text-sm" />
                 </div>
                 <input
                   name="confirmPassword"
                   id="confirmPassword"
                   type={showConfirmPassword ? "text" : "password"}
                   placeholder="Confirm Password"
                   className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 shadow-sm"
                   value={formData.confirmPassword}
                   onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                 />
                 <button
                   type="button"
                   className="absolute inset-y-0 right-0 pr-3 flex items-center"
                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                 >
                   {showConfirmPassword ? (
                     <FaEyeSlash className="text-gray-400 hover:text-gray-600 text-sm" />
                   ) : (
                     <FaEye className="text-gray-400 hover:text-gray-600 text-sm" />
                   )}
                 </button>
               </div>

               {/* First Name and Last Name Input - Same Row */}
               <div className="mb-4 flex gap-3">
                 <div className="flex-1 relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <FaUser className="text-gray-400 text-sm" />
                   </div>
                   <input
                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 shadow-sm"
                     type="text"
                     name="firstName"
                     id="firstName"
                     placeholder="First Name"
                     required
                     value={formData.firstName}
                     onChange={(e) => handleInputChange('firstName', e.target.value)}
                   />
                 </div>
                 
                 <div className="flex-1 relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <FaUser className="text-gray-400 text-sm" />
                   </div>
                   <input
                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 shadow-sm"
                     type="text"
                     name="lastName"
                     id="lastName"
                     placeholder="Last Name"
                     required
                     value={formData.lastName}
                     onChange={(e) => handleInputChange('lastName', e.target.value)}
                   />
                 </div>
               </div>

               {/* Date of Birth Input */}
               <div className="mb-4 relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <FaCalendarAlt className="text-gray-400 text-sm" />
                 </div>
                 <input
                   className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 shadow-sm"
                   type="date"
                   name="dateOfBirth"
                   id="dateOfBirth"
                   placeholder="Date of Birth"
                   required
                   value={formData.dob}
                   onChange={(e) => handleInputChange('dob', e.target.value)}
                 />
               </div>
             </div>
             
             <div className="font-thin mt-5 text-left">
               <p>
                 You have an account?{" "}
                 <button
                   className="text-blue-400 hover:text-blue-600 transition-colors duration-200"
                   onClick={(e) => navigate("/login")}
                 >
                   Login now
                 </button>
               </p>
             </div>
           </CardBody>
 
           <CardFooter className="flex flex-col items-center justify-center">
             <div className="button-login w-full max-w-sm">
               <Button
                 type="submit"
                 onClick={handleSubmit}
                 variant="solid"
                 colorScheme="blue"
                 className="mb-3 w-full"
               >
                 Register
               </Button>
               <Button
                 type="submit"
                 onClick={handleClick}
                 variant="solid"
                 colorScheme="red"
                 className="mb-3 w-full flex items-center justify-center gap-2"
               >
                 <FaGoogle className="text-lg" />
                 <span className="font-medium">Login With Google</span>
               </Button>
             </div>
           </CardFooter>
         </Stack>
       </Card>
     </div>
   );
 };

export default RegisterCard;
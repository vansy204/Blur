import React, { useState } from "react";
import { 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Lock, 
  Calendar,
  CheckCircle,
  XCircle,
  Sparkles,
  Star,
  Heart,
  Rocket
} from "lucide-react";

const RegisterCard = () => {
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    dob: "",
    confirmPassword: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const validatePassword = (password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  };
  
  const getPasswordStrength = (password) => {
    const validations = validatePassword(password);
    const score = Object.values(validations).filter(Boolean).length;
    
    if (score < 2) return { strength: 'Yếu', color: 'from-red-400 to-red-600', width: '20%' };
    if (score < 4) return { strength: 'Trung bình', color: 'from-yellow-400 to-orange-500', width: '60%' };
    return { strength: 'Mạnh', color: 'from-green-400 to-emerald-600', width: '100%' };
  };
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.userName.trim()) newErrors.userName = "Tên đăng nhập không được để trống";
    if (!formData.email.trim()) newErrors.email = "Email không được để trống";
    else if (!validateEmail(formData.email)) newErrors.email = "Email không hợp lệ";
    if (!formData.firstName.trim()) newErrors.firstName = "Họ không được để trống";
    if (!formData.lastName.trim()) newErrors.lastName = "Tên không được để trống";
    if (!formData.dob) newErrors.dob = "Ngày sinh không được để trống";
    if (!formData.password) newErrors.password = "Mật khẩu không được để trống";
    else if (formData.password.length < 8) newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Xác nhận mật khẩu không được để trống";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Mật khẩu không khớp";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      alert("Đăng ký thành công!");
    }, 2000);
  };

  const InputField = ({ 
    icon, 
    type, 
    placeholder, 
    value, 
    onChange, 
    name, 
    showToggle, 
    onToggle, 
    showValue,
    error,
    showValidation = false
  }) => {
    const isValid = value && !error;
    const isFocused = focusedField === name;
    
    return (
      <div className="relative mb-6">
        <div className={`relative transition-all duration-500 ${isFocused ? 'transform scale-[1.02]' : ''}`}>
          <div className={`absolute left-5 top-1/2 transform -translate-y-1/2 z-10 transition-all duration-300 ${
            isFocused ? 'text-blue-500 scale-110' : error ? 'text-red-500' : 'text-gray-400'
          }`}>
            {icon}
          </div>
          
          <input
            className={`w-full border-2 rounded-2xl pl-14 pr-14 py-5 text-lg focus:outline-none transition-all duration-300 backdrop-blur-sm
              ${isFocused 
                ? 'border-blue-400 bg-white/90 shadow-2xl shadow-blue-500/20 ring-4 ring-blue-100' 
                : error 
                  ? 'border-red-300 bg-red-50/80 shadow-lg shadow-red-500/10' 
                  : isValid 
                    ? 'border-emerald-300 bg-emerald-50/80 shadow-lg shadow-emerald-500/10' 
                    : 'border-gray-200 bg-white/60 hover:border-gray-300 hover:bg-white/80 hover:shadow-xl'
              }`}
            type={showToggle ? (showValue ? "text" : "password") : type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onFocus={() => setFocusedField(name)}
            onBlur={() => setFocusedField("")}
          />
          
          {showValidation && value && (
            <div className={`absolute right-14 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
              error ? 'scale-110' : 'scale-100'
            }`}>
              {error ? (
                <XCircle className="text-red-500 w-5 h-5" />
              ) : (
                <CheckCircle className="text-emerald-500 w-5 h-5 animate-pulse" />
              )}
            </div>
          )}
          
          {showToggle && (
            <button
              type="button"
              className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-all duration-300 hover:scale-110"
              onClick={onToggle}
            >
              {showValue ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>
        
        {error && (
          <p className="text-red-500 text-sm mt-3 ml-2 animate-bounce flex items-center">
            <XCircle className="w-4 h-4 mr-2" />
            {error}
          </p>
        )}
      </div>
    );
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full blur-xl opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-40 w-28 h-28 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full blur-xl opacity-30 animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-r from-blue-300 to-indigo-500 rounded-full blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/5 to-cyan-500/10"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-indigo-500/5 to-blue-500/10"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl w-full relative z-10">
        {/* Main Card Container */}
        <div className="relative">
          {/* Card Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-indigo-500/30 rounded-3xl blur-3xl transform scale-105 animate-pulse"></div>
          
          {/* Main Card */}
          <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Card Header Glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-cyan-500 to-indigo-500"></div>
            
            <div className="flex flex-col xl:flex-row">
              {/* Left Side - Welcome Section */}
              <div className="xl:w-1/2 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-blue-700/90"></div>
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px)`,
                    backgroundSize: '50px 50px'
                  }}></div>
                </div>
                
                <div className="relative z-10 p-16 flex flex-col justify-center items-center text-white min-h-[600px]">
                  {/* Floating Icons */}
                  <div className="absolute top-8 left-8 opacity-20">
                    <Star className="w-10 h-10 animate-spin" style={{animationDuration: '8s'}} />
                  </div>
                  <div className="absolute top-12 right-12 opacity-20">
                    <Heart className="w-8 h-8 animate-bounce" />
                  </div>
                  <div className="absolute bottom-12 left-12 opacity-20">
                    <Rocket className="w-10 h-10 animate-pulse" />
                  </div>
                  
                  {/* Main Content */}
                  <div className="text-center">
                    <div className="mb-8 relative">
                      <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl transform scale-150"></div>
                      <div className="relative flex justify-center">
                        <Sparkles className="w-20 h-20 animate-bounce drop-shadow-2xl" />
                      </div>
                    </div>
                    
                    <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent leading-tight">
                      Chào mừng đến với
                      <span className="block mt-2 text-6xl bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                        Blur
                      </span>
                    </h1>
                    
                    <p className="text-2xl opacity-90 mb-12 font-light">
                      Khám phá thế giới mới cùng chúng tôi
                    </p>
                    
                    {/* Feature Icons */}
                    <div className="flex justify-center space-x-8">
                      {[User, Lock, CheckCircle].map((Icon, index) => (
                        <div 
                          key={index}
                          className="group relative"
                        >
                          <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg transform scale-110 group-hover:scale-125 transition-transform duration-300"></div>
                          <div className="relative w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-all duration-300">
                            <Icon className="text-white w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Registration Form */}
              <div className="xl:w-1/2 p-16 relative">
                {/* Form Background */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
                
                <div className="relative z-10 max-w-lg mx-auto">
                  {/* Form Header */}
                  <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl mb-6 shadow-2xl">
                      <User className="text-white w-8 h-8" />
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-4">Tạo tài khoản</h2>
                    <p className="text-white/70 text-lg">Điền thông tin để bắt đầu hành trình</p>
                  </div>

                  <div className="space-y-8">
                    {/* Username */}
                    <InputField
                      icon={<User className="w-5 h-5" />}
                      type="text"
                      placeholder="Tên đăng nhập"
                      value={formData.userName}
                      onChange={(e) => handleInputChange('userName', e.target.value)}
                      name="userName"
                      error={errors.userName}
                      showValidation={true}
                    />

                    {/* Email */}
                    <InputField
                      icon={<Mail className="w-5 h-5" />}
                      type="email"
                      placeholder="Địa chỉ email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      name="email"
                      error={errors.email}
                      showValidation={true}
                    />

                    {/* First Name & Last Name */}
                    <div className="grid grid-cols-2 gap-6">
                      <InputField
                        type="text"
                        placeholder="Họ"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        name="firstName"
                        error={errors.firstName}
                        showValidation={true}
                      />
                      <InputField
                        type="text"
                        placeholder="Tên"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        name="lastName"
                        error={errors.lastName}
                        showValidation={true}
                      />
                    </div>

                    {/* Date of Birth */}
                    <InputField
                      icon={<Calendar className="w-5 h-5" />}
                      type="date"
                      placeholder="Ngày sinh"
                      value={formData.dob}
                      onChange={(e) => handleInputChange('dob', e.target.value)}
                      name="dob"
                      error={errors.dob}
                    />

                    {/* Password */}
                    <div>
                      <InputField
                        icon={<Lock className="w-5 h-5" />}
                        type="password"
                        placeholder="Mật khẩu"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        name="password"
                        showToggle={true}
                        onToggle={() => setShowPassword(!showPassword)}
                        showValue={showPassword}
                        error={errors.password}
                      />
                      
                      {/* Enhanced Password Strength Indicator */}
                      {formData.password && (
                        <div className="mt-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-white/80 font-medium">Độ mạnh mật khẩu:</span>
                            <span className={`font-bold text-lg ${
                              passwordStrength.strength === 'Mạnh' ? 'text-emerald-400' :
                              passwordStrength.strength === 'Trung bình' ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {passwordStrength.strength}
                            </span>
                          </div>
                          <div className="relative w-full bg-white/20 rounded-full h-3 overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${passwordStrength.color} transition-all duration-700 ease-out rounded-full relative`}
                              style={{ width: passwordStrength.width }}
                            >
                              <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <InputField
                      icon={<Lock className="w-5 h-5" />}
                      type="password"
                      placeholder="Xác nhận mật khẩu"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      name="confirmPassword"
                      showToggle={true}
                      onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                      showValue={showConfirmPassword}
                      error={errors.confirmPassword}
                      showValidation={true}
                    />

                    {/* Submit Button */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl blur-lg opacity-50"></div>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className={`relative w-full py-6 px-8 rounded-2xl font-bold text-white text-xl transition-all duration-500 transform overflow-hidden
                          ${isLoading 
                            ? 'bg-gray-500 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 hover:scale-105 hover:shadow-2xl active:scale-95 shadow-xl'
                          }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-3"></div>
                            Đang xử lý...
                          </div>
                        ) : (
                          <span className="relative z-10">Tạo tài khoản</span>
                        )}
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/20"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-6 bg-white/10 backdrop-blur-sm text-white/70 rounded-full border border-white/20">
                          hoặc
                        </span>
                      </div>
                    </div>

                    {/* Google Sign Up */}
                    <div className="relative">
                      <button
                        type="button"
                        className="relative w-full py-6 px-8 rounded-2xl font-bold text-gray-700 text-xl bg-white/90 backdrop-blur-sm border-2 border-white/30 hover:bg-white hover:border-white/50 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center shadow-xl overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="w-6 h-6 mr-4 relative z-10">
                          <svg viewBox="0 0 24 24" className="w-full h-full">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                        <span className="relative z-10">Đăng ký với Google</span>
                      </button>
                    </div>

                    {/* Login Link */}
                    <p className="text-center text-white/70 text-lg mt-8">
                      Đã có tài khoản?{" "}
                      <button
                        type="button"
                        className="text-blue-400 font-bold hover:text-blue-300 transition-colors duration-300 hover:underline"
                      >
                        Đăng nhập ngay
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterCard;
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
  Shield,
  ArrowRight,
  Zap,
  Globe,
  Layers
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
      <div className="relative mb-5">
        <div className={`relative group transition-all duration-300 ${isFocused ? 'transform translate-y-[-2px]' : ''}`}>
          <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 z-10 transition-all duration-200 ${
            isFocused ? 'text-violet-500' : error ? 'text-red-400' : 'text-gray-500'
          }`}>
            {icon}
          </div>
          
          <input
            className={`w-full border rounded-xl pl-12 pr-12 py-4 text-base focus:outline-none transition-all duration-300 bg-white
              ${isFocused 
                ? 'border-violet-400 shadow-lg shadow-violet-100 ring-2 ring-violet-100' 
                : error 
                  ? 'border-red-300 bg-red-50' 
                  : isValid 
                    ? 'border-emerald-300 bg-emerald-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
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
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              {error ? (
                <XCircle className="text-red-400 w-5 h-5" />
              ) : (
                <CheckCircle className="text-emerald-500 w-5 h-5" />
              )}
            </div>
          )}
          
          {showToggle && (
            <button
              type="button"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-violet-500 transition-colors duration-200"
              onClick={onToggle}
            >
              {showValue ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>
        
        {error && (
          <p className="text-red-500 text-sm mt-2 ml-1 flex items-center">
            <XCircle className="w-4 h-4 mr-1.5" />
            {error}
          </p>
        )}
      </div>
    );
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center p-4 relative">
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgb(148 163 184)" strokeWidth="0.5" opacity="0.1"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-violet-200 to-purple-300 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-gradient-to-br from-blue-200 to-indigo-300 transform rotate-45 opacity-40 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-32 w-12 h-12 bg-gradient-to-br from-emerald-200 to-teal-300 rounded-full opacity-50 animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-20 right-16 w-24 h-8 bg-gradient-to-r from-orange-200 to-red-300 rounded-full opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-6xl w-full relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="flex flex-col lg:flex-row min-h-[700px]">
            
            {/* Left Panel - Brand Section */}
            <div className="lg:w-2/5 bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 relative overflow-hidden">
              {/* Tech Pattern Overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(180deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}></div>
              </div>
              
              {/* Accent Lines */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500"></div>
              
              <div className="relative z-10 p-12 flex flex-col justify-center items-start text-white h-full">
                {/* Logo Section */}
                <div className="mb-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                      <Layers className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Blur
                    </h1>
                  </div>
                  <h2 className="text-5xl font-bold mb-4 leading-tight">
                    Tạo tài khoản
                    <span className="block text-3xl font-normal text-gray-400 mt-2">
                      và khám phá tiềm năng
                    </span>
                  </h2>
                </div>
                
                {/* Features List */}
                <div className="space-y-6 mb-12">
                  {[
                    { icon: Shield, title: "Bảo mật tuyệt đối", desc: "Mã hóa end-to-end cho dữ liệu của bạn" },
                    { icon: Zap, title: "Hiệu suất cao", desc: "Trải nghiệm nhanh chóng và mượt mà" },
                    { icon: Globe, title: "Kết nối toàn cầu", desc: "Truy cập từ mọi nơi trên thế giới" }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mr-4 mt-1">
                        <feature.icon className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                        <p className="text-gray-400 text-sm">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 w-full">
                  {[
                    { number: "50K+", label: "Người dùng" },
                    { number: "99.9%", label: "Uptime" },
                    { number: "24/7", label: "Hỗ trợ" }
                  ].map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold text-violet-400">{stat.number}</div>
                      <div className="text-gray-400 text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Registration Form */}
            <div className="lg:w-3/5 p-12 relative">
              <div className="max-w-md mx-auto">
                {/* Form Header */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <User className="text-white w-7 h-7" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Bắt đầu ngay</h3>
                  <p className="text-gray-600">Tạo tài khoản miễn phí trong vài phút</p>
                </div>

                <div className="space-y-6">
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
                  <div className="grid grid-cols-2 gap-4">
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
                    
                    {/* Password Strength */}
                    {formData.password && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-700 text-sm font-medium">Độ mạnh:</span>
                          <span className={`text-sm font-bold ${
                            passwordStrength.strength === 'Mạnh' ? 'text-emerald-600' :
                            passwordStrength.strength === 'Trung bình' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {passwordStrength.strength}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 bg-gradient-to-r ${passwordStrength.color} transition-all duration-500 rounded-full`}
                            style={{ width: passwordStrength.width }}
                          ></div>
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
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-white text-lg transition-all duration-300 transform group
                      ${isLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 hover:scale-[1.02] active:scale-98 shadow-lg hover:shadow-xl'
                      }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        Đang xử lý...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        Tạo tài khoản
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                      </div>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 bg-white text-gray-500 text-sm">hoặc</span>
                    </div>
                  </div>

                  {/* Google Sign Up */}
                  <button
                    type="button"
                    className="w-full py-4 px-6 rounded-xl font-semibold text-gray-700 text-lg bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 transform hover:scale-[1.02] active:scale-98 flex items-center justify-center shadow-sm hover:shadow-md"
                  >
                    <div className="w-5 h-5 mr-3">
                      <svg viewBox="0 0 24 24" className="w-full h-full">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    Đăng ký với Google
                  </button>

                  {/* Login Link */}
                  <p className="text-center text-gray-600 mt-6">
                    Đã có tài khoản?{" "}
                    <button
                      type="button"
                      className="text-violet-600 font-semibold hover:text-violet-700 transition-colors duration-200 hover:underline"
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
  );
};

export default RegisterCard;
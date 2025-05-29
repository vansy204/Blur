import {
  Home,
  Search,
  MessageCircle,
  Bell,
  PlusCircle,
  User,
} from "lucide-react";

export const menuItems = [
  {
    title: "Home",
    icon: <Home className="text-gray-600" />,
    activeIcon: <Home fill="currentColor" className="text-blue-500" />,
  },
  {
    title: "Search",
    icon: <Search className="text-gray-600" />,
    activeIcon: <Search fill="currentColor" className="text-blue-500" />,
  },
  {
    title: "Message",
    icon: <MessageCircle className="text-gray-600" />,
    activeIcon: <MessageCircle fill="currentColor" className="text-blue-500" />,
  },
  {
    title: "Notification",
    icon: <Bell className="text-gray-600" />,
    activeIcon: <Bell fill="currentColor" className="text-red-500" />,
  },
  {
    title: "Create",
    icon: <PlusCircle className="text-gray-600" />,
    activeIcon: <PlusCircle fill="currentColor" className="text-green-500" />,
  },
  {
    title: "Profile",
    icon: <User className="text-gray-600" />,
    activeIcon: <User fill="currentColor" className="text-purple-500" />,
  },
];
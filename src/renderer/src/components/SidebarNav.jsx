/* eslint-disable react/prop-types */
// src/components/SidebarNav.jsx
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Factory,
  Users,
  Layers,
  Package,
  Info,
  Box,
  ChefHat,
  Download,
  Home
} from 'lucide-react'

const iconMap = {
  Dashboard: LayoutDashboard,
  Production: Factory,
  Manpower: Users,
  Section: Layers,
  Products: Package,
  'Product Info': Info,
  Materials: Box,
  Recipe: ChefHat,
  'Recipe Import': Download,
  Home: Home
}

export const SidebarNavItem = ({ title, route, icon, isSubItem = false }) => {
  const Icon = iconMap[icon] || iconMap[title] || null

  return (
    <NavLink
      to={route}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
          isActive
            ? isSubItem
              ? 'bg-linear-to-r from-gray-800 to-gray-900 text-white shadow-md'
              : 'bg-linear-to-r from-black to-gray-900 text-white shadow-lg'
            : isSubItem
              ? 'hover:bg-gray-100 hover:translate-x-1'
              : 'hover:bg-gray-50 hover:translate-x-1'
        }`
      }
    >
      {Icon && (
        <Icon
          className={`h-5 w-5 mr-3 ${
            isSubItem ? 'text-gray-600 group-hover:text-gray-900' : 'text-gray-500'
          }`}
        />
      )}
      <span className={`font-medium ${isSubItem ? 'text-sm' : ''}`}>{title}</span>
    </NavLink>
  )
}

export const SidebarSection = ({ title, children }) => (
  <div className="mb-6">
    {title && (
      <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {title}
      </h3>
    )}
    <div className="space-y-1">{children}</div>
  </div>
)

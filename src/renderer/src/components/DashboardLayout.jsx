import { Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarNavItem, SidebarSection } from '../components/SidebarNav'
import logo from '../assets/icon.png'

export default function DashboardLayout() {
  const [sections, setSections] = useState([])
  const [isCollapsed, setIsCollapsed] = useState(false)

  const mainRoutes = [
    { title: 'Dashboard', route: '/dashboard', icon: 'Dashboard' },
    { title: 'Production', route: '/production', icon: 'Production' },
    { title: 'Manpower', route: '/manpower', icon: 'Manpower' }
  ]

  const managementRoutes = [
    { title: 'Section', route: '/dashboard/section', icon: 'Section' },
    { title: 'Products', route: '/dashboard/product', icon: 'Products' },
    { title: 'Product Info', route: '/dashboard/product-info', icon: 'Product Info' },
    { title: 'Materials', route: '/dashboard/material', icon: 'Materials' },
    { title: 'Recipe', route: '/dashboard/recipe', icon: 'Recipe' },
    { title: 'Recipe Import', route: '/dashboard/import-recipe', icon: 'Recipe Import' }
  ]

  const systemRoutes = [{ title: 'Backup/Restore', route: '/restore', icon: 'Database' }]

  const loadSections = async () => {
    try {
      const data = await window.api.getAllSections()
      setSections(data)
    } catch (error) {
      console.error('Error loading sections:', error)
    }
  }

  useEffect(() => {
    loadSections()
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-linear-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div
        className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-1">
                <img src={logo} className="h-10 w-10" />
                <div>
                  <h1 className="font-bold text-gray-900">Production</h1>
                  <p className="text-xs text-gray-500">v1.0.0</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-6 h-0.5 bg-gray-600 mb-1"></div>
              <div className="w-6 h-0.5 bg-gray-600 mb-1"></div>
              <div className="w-6 h-0.5 bg-gray-600"></div>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarSection title="Navigation">
            {mainRoutes.map((route) => (
              <SidebarNavItem key={route.route} {...route} />
            ))}
          </SidebarSection>

          <SidebarSection title="Production Sections">
            {sections.map((section) => (
              <SidebarNavItem
                key={section.id}
                title={section.name}
                route={`/production/${section.id}/edit?section=${section.name}`}
                icon="Section"
                isSubItem={true}
              />
            ))}
          </SidebarSection>

          <SidebarSection title="Management">
            {managementRoutes.map((route) => (
              <SidebarNavItem key={route.route} {...route} />
            ))}
          </SidebarSection>

          <SidebarSection title="System">
            {systemRoutes.map((route) => (
              <SidebarNavItem key={route.route} {...route} />
            ))}
          </SidebarSection>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">AD</span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">Admin User</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-gray-600" />
                <span className="text-lg font-semibold text-gray-900">Production Dashboard</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-linear-to-br from-white to-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <span className="font-medium">Production History System</span>
              <span className="mx-2">•</span>
              <span>Powered by CodeOrbitStudio</span>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                Operational
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

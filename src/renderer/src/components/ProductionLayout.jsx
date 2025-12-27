import { BarChart3, Calendar, Factory, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { SidebarNavItem, SidebarSection } from '../components/SidebarNav'

export default function ProductionLayout() {
  const [sections, setSections] = useState([])
  const location = useLocation()

  const mainRoutes = [
    { title: 'Dashboard', route: '/dashboard', icon: 'Home' },
    { title: 'Production', route: '/production', icon: 'Production' },
    { title: 'Manpower', route: '/manpower', icon: 'Manpower' }
  ]

  // const productionViews = [
  //   { title: 'Daily View', route: '/production/daily', icon: Calendar },
  //   { title: 'Monthly Report', route: '/production/monthly', icon: BarChart3 },
  //   { title: 'Analytics', route: '/production/analytics', icon: TrendingUp }
  // ]

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

  // Get current section from URL
  const getCurrentSection = () => {
    const match = location.pathname.match(/\/production\/(\d+)/)
    if (match) {
      const sectionId = parseInt(match[1])
      return sections.find((s) => s.id === sectionId)
    }
    return null
  }

  const currentSection = getCurrentSection()

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-black to-gray-800 rounded-xl flex items-center justify-center">
              <Factory className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Production</h1>
              <p className="text-xs text-gray-500">Management Console</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarSection title="Quick Access">
            {mainRoutes.map((route) => (
              <SidebarNavItem key={route.route} {...route} />
            ))}
          </SidebarSection>

          {/* <SidebarSection title="Production Views">
            {productionViews.map((view) => (
              <NavLink
                key={view.route}
                to={view.route}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-linear-to-r from-gray-700 to-gray-800 text-white shadow-md'
                      : 'hover:bg-gray-100 hover:translate-x-1'
                  }`
                }
              >
                <view.icon className="h-5 w-5 mr-3 text-gray-500 group-hover:text-gray-900" />
                <span className="font-medium">{view.title}</span>
              </NavLink>
            ))}
          </SidebarSection> */}

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
        </div>

        {/* Current Section Info */}
        {currentSection && (
          <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center">
                <Factory className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{currentSection.name}</p>
                <p className="text-xs text-gray-500">Active Section</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {currentSection ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-black rounded-lg"></div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {currentSection.name} Production
                    </h2>
                    <p className="text-sm text-gray-600">Real-time production tracking</p>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Production Overview</h2>
                  <p className="text-sm text-gray-600">All sections production data</p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-gray-900 to-black text-white px-4 py-2 rounded-xl">
                <span className="font-semibold">Today:</span>
                <span className="ml-2">
                  {new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-linear-to-br from-white to-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="overflow-hidden">
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

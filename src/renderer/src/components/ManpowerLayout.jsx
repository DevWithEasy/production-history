import { BarChart3, Building, Calendar, TrendingUp, UserPlus, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { SidebarNavItem, SidebarSection } from '../components/SidebarNav'

export default function ManpowerLayout() {
  const mainRoutes = [
    { title: 'Dashboard', route: '/dashboard', icon: 'Home' },
    { title: 'Production', route: '/production', icon: 'Production' },
    { title: 'Manpower', route: '/manpower', icon: 'Manpower' }
  ]

  const manpowerViews = [{ title: 'Daily Update', route: '/manpower/edit', icon: Calendar }]

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-600 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Manpower</h1>
              <p className="text-xs text-gray-500">Workforce Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarSection title="Navigation">
            {mainRoutes.map((route) => (
              <SidebarNavItem key={route.route} {...route} />
            ))}
          </SidebarSection>

          <SidebarSection title="Manpower Views">
            {manpowerViews.map((view) => (
              <NavLink
                key={view.route}
                to={view.route}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-linear-to-r from-blue-700 to-blue-800 text-white shadow-md'
                      : 'hover:bg-blue-50 hover:translate-x-1'
                  }`
                }
              >
                <view.icon className="h-5 w-5 mr-3 text-gray-500 group-hover:text-blue-600" />
                <span className="font-medium">{view.title}</span>
              </NavLink>
            ))}
          </SidebarSection>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Workforce Management</h2>
                  <p className="text-sm text-gray-600">Optimize manpower allocation</p>
                </div>
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
        <footer className="bg-white border-t border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-6">
                <div>
                  <span className="font-medium">Current Staff:</span>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    198 active
                  </span>
                </div>
                <div>
                  <span className="font-medium">Shift Efficiency:</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    94% optimal
                  </span>
                </div>
              </div>
              <div>
                <span className="font-medium">System:</span>
                <span className="ml-2">CodeOrbitStudio Production Suite</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

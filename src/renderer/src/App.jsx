import { Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import ManpowerLayout from './components/ManpowerLayout'
import ProductionLayout from './components/ProductionLayout'
import Dashborad from './pages/dashboard/dashborad'
import Products from './pages/dashboard/product'
import Sections from './pages/dashboard/section'
import Index from './pages/Index'
import Manpower from './pages/manpower/manpower'
import SectionManpower from './pages/manpower/section'
import Production from './pages/production/production'
import SectionProduction from './pages/production/section'
import ProductInfo from './pages/dashboard/product_info'
import Materials from './pages/dashboard/material'
import RecipeManagement from './pages/dashboard/Recipe'
import ImportRecipe from './pages/dashboard/import-recipe'
import ExcelSheetReader from './pages/dashboard/excel-data'
import Restore from './pages/restore'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />

      <Route path="dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashborad />} />
        <Route path="section" element={<Sections />} />
        <Route path="product" element={<Products />} />
        <Route path="product-info" element={<ProductInfo />} />
        <Route path="material" element={<Materials />} />
        <Route path="recipe" element={<RecipeManagement />} />
        <Route path="import-recipe" element={<ImportRecipe />} />
        <Route path="excel" element={<ExcelSheetReader />} />
      </Route>
      <Route path="production" element={<ProductionLayout />}>
        <Route index element={<Production />} />
        <Route path=":sid/edit" element={<SectionProduction />} />
      </Route>
      <Route path="manpower" element={<ManpowerLayout />}>
        <Route index element={<Manpower />} />
        <Route path="edit" element={<SectionManpower />} />
      </Route>
      <Route path="/restore" element={<Restore />} />
    </Routes>
  )
}

export default App

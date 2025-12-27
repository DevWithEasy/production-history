// src/preload/index.js
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  // Sections
  getAllSections: () => ipcRenderer.invoke('getAllSections'),
  addSection: (name) => ipcRenderer.invoke('addSection', name),
  updateSection: (id, name) => ipcRenderer.invoke('updateSection', id, name),
  deleteSection: (id) => ipcRenderer.invoke('deleteSection', id),

  // Materials APIs
  getAllMaterials: () => ipcRenderer.invoke('getAllMaterials'),
  addMaterial: (name, price, code, unit, type) =>
    ipcRenderer.invoke('addMaterial', name, price, code, unit, type),
  updateMaterial: (id, name, price, code, unit, type) =>
    ipcRenderer.invoke('updateMaterial', id, name, price, code, unit, type),
  deleteMaterial: (id) => ipcRenderer.invoke('deleteMaterial', id),

  // Products
  getAllProducts: () => ipcRenderer.invoke('getAllProducts'),
  getProductsBySection: (sectionId) => ipcRenderer.invoke('getProductsBySection', sectionId),
  addProduct: (s_id, name, code, base_price, sku) =>
    ipcRenderer.invoke('addProduct', s_id, name, code, base_price, sku),
  updateProduct: (id, s_id, name, code, base_price, sku) =>
    ipcRenderer.invoke('updateProduct', id, s_id, name, code, base_price, sku),
  deleteProduct: (id) => ipcRenderer.invoke('deleteProduct', id),

  // Product Info APIs
  getProductInfoByProduct: (p_id) => ipcRenderer.invoke('getProductInfoByProduct', p_id),
  addProductInfo: (p_id, name, unit, value) =>
    ipcRenderer.invoke('addProductInfo', p_id, name, unit, value),
  updateProductInfo: (id, name, unit, value) =>
    ipcRenderer.invoke('updateProductInfo', id, name, unit, value),
  deleteProductInfo: (id) => ipcRenderer.invoke('deleteProductInfo', id),
  getProductWithInfo: (p_id) => ipcRenderer.invoke('getProductWithInfo', p_id),

  // Monthly Prices
  getMonthlyPrice: (p_id, year, month) => ipcRenderer.invoke('getMonthlyPrice', p_id, year, month),
  setMonthlyPrice: (p_id, year, month, price) =>
    ipcRenderer.invoke('setMonthlyPrice', p_id, year, month, price),

  // Monthly Summary
  getMonthlySummary: (p_id, year, month) =>
    ipcRenderer.invoke('getMonthlySummary', p_id, year, month),
  updateMonthlySummary: (p_id, year, month, opening, sales_target) =>
    ipcRenderer.invoke('updateMonthlySummary', p_id, year, month, opening, sales_target),

  // Production
  getDailyProduction: (section_id, month, year) =>
    ipcRenderer.invoke('getDailyProduction', section_id, month, year),
  setDailyProduction: (date, p_id, batch, carton) =>
    ipcRenderer.invoke('setDailyProduction', date, p_id, batch, carton),

  // Manpower
  getSectionManpower: (month, year) => ipcRenderer.invoke('getSectionManpower', month, year),
  getDailyTotalManpower: (date) => ipcRenderer.invoke('getDailyTotalManpower', date),
  setDailyTotalManpower: (date, mp_count) =>
    ipcRenderer.invoke('setDailyTotalManpower', date, mp_count),
  setSectionManpower: (date, s_id, mp_count) =>
    ipcRenderer.invoke('setSectionManpower', date, s_id, mp_count),

  // Recipe Management APIs
  getProductRecipes: (p_id) => ipcRenderer.invoke('getProductRecipes', p_id),
  getProductRecipeByPurpose: (p_id, purpose) =>
    ipcRenderer.invoke('getProductRecipeByPurpose', p_id, purpose),
  addRecipe: (p_id, m_id, quantity, purpose, m_type) =>
    ipcRenderer.invoke('addRecipe', p_id, m_id, quantity, purpose, m_type),
  updateRecipe: (id, quantity, purpose, m_type) =>
    ipcRenderer.invoke('updateRecipe', id, quantity, purpose, m_type),
  deleteRecipe: (id) => ipcRenderer.invoke('deleteRecipe', id),
  deleteRecipeByProductAndMaterial: (p_id, m_id, purpose) =>
    ipcRenderer.invoke('deleteRecipeByProductAndMaterial', p_id, m_id, purpose),
  getMaterialsByType: (m_type) => ipcRenderer.invoke('getMaterialsByType', m_type),
  getAllMaterialsGrouped: () => ipcRenderer.invoke('getAllMaterialsGrouped'),
  checkMaterialInRecipe: (p_id, m_id) => ipcRenderer.invoke('checkMaterialInRecipe', p_id, m_id),
  getRecipeSummary: (p_id) => ipcRenderer.invoke('getRecipeSummary', p_id),

  // Import Recipe APIs
  importProductRecipe: (productId, recipeData) =>
    ipcRenderer.invoke('importProductRecipe', productId, recipeData),
  checkProductExists: (productId) => ipcRenderer.invoke('checkProductExists', productId),
  searchMaterials: (searchTerm) => ipcRenderer.invoke('searchMaterials', searchTerm),
  getMaterialsByIds: (materialIds) => ipcRenderer.invoke('getMaterialsByIds', materialIds),
  bulkInsertRecipes: (recipes) => ipcRenderer.invoke('bulkInsertRecipes', recipes),
  getProductRecipesForImport: (p_id) => ipcRenderer.invoke('getProductRecipesForImport', p_id),

  // Reports
  getMonthlyProductionSummary: (year, month) =>
    ipcRenderer.invoke('getMonthlyProductionSummary', year, month),
  getYearlyProductionSummary: (year) => ipcRenderer.invoke('getYearlyProductionSummary', year),
  getYearlyManpowerSummary: (year) => ipcRenderer.invoke('getYearlyManpowerSummary', year),
  getSectionManpowerDetails: (year, month) =>
    ipcRenderer.invoke('getSectionManpowerDetails', year, month),

  //db action
  dbBackup: () => ipcRenderer.invoke('db-backup'),
  dbRestore: () => ipcRenderer.invoke('db-restore'),
  checkRestoredStatus: () => ipcRenderer.invoke('check-restored-status')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}

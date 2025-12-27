import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import database from './database'

let mainWindow = null
let shouldQuit = false

// Check if app was started after restore
const wasRestored = process.argv.includes('--restored')

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    alwaysOnTop: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Handle window close event
  mainWindow.on('close', async (event) => {
    if (!shouldQuit) {
      event.preventDefault()

      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Backup Warning',
        message: 'Have you taken a backup?',
        detail: 'You might lose your data if you close the app or uninstall without backing it up.',
        buttons: ['Yes', 'No'],
        defaultId: 1,
        cancelId: 1
      })

      if (response === 0) {
        shouldQuit = true
        database?.close()
        mainWindow.close()
      }
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// IPC Handlers
function setupIPCHandlers() {
  // Sections
  ipcMain.handle('getAllSections', () => database.getAllSections())
  ipcMain.handle('addSection', (_, name) => database.addSection(name))
  ipcMain.handle('updateSection', (_, id, name) => database.updateSection(id, name))
  ipcMain.handle('deleteSection', (_, id) => database.deleteSection(id))

  // Materials APIs
  ipcMain.handle('getAllMaterials', async () => database.getAllMaterials())
  ipcMain.handle('addMaterial', async (_, name, price, code, unit, type) =>
    database.addMaterial(name, price, code, unit, type)
  )
  ipcMain.handle('updateMaterial', async (_, id, name, price, code, unit, type) =>
    database.updateMaterial(id, name, price, code, unit, type)
  )
  ipcMain.handle('deleteMaterial', async (_, id) => database.deleteMaterial(id))

  // Products
  ipcMain.handle('getAllProducts', () => database.getAllProducts())
  ipcMain.handle('getProductsBySection', (_, sectionId) => database.getProductsBySection(sectionId))
  ipcMain.handle('addProduct', (_, s_id, name, code, base_price, sku) =>
    database.addProduct(s_id, name, code, base_price, sku)
  )
  ipcMain.handle('updateProduct', (_, id, s_id, name, code, base_price, sku) =>
    database.updateProduct(id, s_id, name, code, base_price, sku)
  )
  ipcMain.handle('deleteProduct', (_, id) => database.deleteProduct(id))

  // Product Info APIs
  ipcMain.handle('getProductInfoByProduct', async (_, p_id) =>
    database.getProductInfoByProduct(p_id)
  )

  ipcMain.handle('addProductInfo', async (_, p_id, name, unit, value) =>
    database.addProductInfo(p_id, name, unit, value)
  )

  ipcMain.handle('updateProductInfo', async (_, id, name, unit, value) =>
    database.updateProductInfo(id, name, unit, value)
  )

  ipcMain.handle('deleteProductInfo', async (_, id) => database.deleteProductInfo(id))

  ipcMain.handle('getProductWithInfo', async (_, p_id) => database.getProductWithInfo(p_id))

  // Monthly Prices
  ipcMain.handle('getMonthlyPrice', (_, p_id, year, month) =>
    database.getMonthlyPrice(p_id, year, month)
  )
  ipcMain.handle('setMonthlyPrice', (_, p_id, year, month, price) =>
    database.setMonthlyPrice(p_id, year, month, price)
  )

  // Monthly Summary
  ipcMain.handle('getMonthlySummary', (_, p_id, year, month) =>
    database.getMonthlySummary(p_id, year, month)
  )
  ipcMain.handle('updateMonthlySummary', (_, p_id, year, month, opening, sales_target) =>
    database.updateMonthlySummary(p_id, year, month, opening, sales_target)
  )

  // Production
  ipcMain.handle('getDailyProduction', (_, section_id, month, year) =>
    database.getDailyProduction(section_id, month, year)
  )
  ipcMain.handle('setDailyProduction', (_, date, p_id, batch, carton) =>
    database.setDailyProduction(date, p_id, batch, carton)
  )

  // Manpower
  ipcMain.handle('getSectionManpower', (_, month, year) => database.getSectionManpower(month, year))
  ipcMain.handle('getDailyTotalManpower', (_, date) => database.getDailyTotalManpower(date))
  ipcMain.handle('setDailyTotalManpower', (_, date, mp_count) =>
    database.setDailyTotalManpower(date, mp_count)
  )
  ipcMain.handle('setSectionManpower', (_, date, s_id, mp_count) =>
    database.setSectionManpower(date, s_id, mp_count)
  )

  // Recipe Management
  ipcMain.handle('getProductRecipes', async (_, p_id) => database.getProductRecipes(p_id))

  ipcMain.handle('getProductRecipeByPurpose', async (_, p_id, purpose) =>
    database.getProductRecipeByPurpose(p_id, purpose)
  )

  ipcMain.handle('addRecipe', async (_, p_id, m_id, quantity, purpose, m_type) =>
    database.addRecipe(p_id, m_id, quantity, purpose, m_type)
  )

  ipcMain.handle('updateRecipe', async (_, id, quantity, purpose, m_type) =>
    database.updateRecipe(id, quantity, purpose, m_type)
  )

  ipcMain.handle('deleteRecipe', async (_, id) => database.deleteRecipe(id))

  ipcMain.handle('deleteRecipeByProductAndMaterial', async (_, p_id, m_id, purpose) =>
    database.deleteRecipeByProductAndMaterial(p_id, m_id, purpose)
  )

  ipcMain.handle('getMaterialsByType', async (_, m_type) => database.getMaterialsByType(m_type))

  ipcMain.handle('getAllMaterialsGrouped', async () => database.getAllMaterialsGrouped())

  ipcMain.handle('checkMaterialInRecipe', async (_, p_id, m_id) =>
    database.checkMaterialInRecipe(p_id, m_id)
  )

  ipcMain.handle('getRecipeSummary', async (_, p_id) => database.getRecipeSummary(p_id))

  // Import Recipe Handlers
  ipcMain.handle('importProductRecipe', async (_, productId, recipeData) =>
    database.importProductRecipe(productId, recipeData)
  )

  ipcMain.handle('checkProductExists', async (_, productId) =>
    database.checkProductExists(productId)
  )

  ipcMain.handle('searchMaterials', async (_, searchTerm) => database.searchMaterials(searchTerm))

  ipcMain.handle('getMaterialsByIds', async (_, materialIds) =>
    database.getMaterialsByIds(materialIds)
  )

  ipcMain.handle('bulkInsertRecipes', async (_, recipes) => database.bulkInsertRecipes(recipes))

  ipcMain.handle('getProductRecipesForImport', async (_, p_id) =>
    database.getProductRecipesForImport(p_id)
  )

  // Reports
  ipcMain.handle('getMonthlyProductionSummary', async (_, year, month) => {
    try {
      return await database.getMonthlyProductionSummary(year, month)
    } catch (error) {
      console.error('IPC Error in getMonthlyProductionSummary:', error)
      return {
        year,
        month,
        month_name: '',
        monthly_total: 0,
        daily_average: 0,
        total_products: 0,
        working_days: 0,
        section_wise: [],
        daily_summary: []
      }
    }
  })

  ipcMain.handle('getYearlyProductionSummary', async (_, year) => {
    try {
      return await database.getYearlyProductionSummary(year)
    } catch (error) {
      console.error('IPC Error in getYearlyProductionSummary:', error)
      return {
        year,
        yearly_total: 0,
        monthly_average: 0,
        total_products: 0,
        best_month: null,
        total_months: 0,
        monthly_summaries: []
      }
    }
  })

  ipcMain.handle('getYearlyManpowerSummary', async (_, year) => {
    try {
      return await database.getYearlyManpowerSummary(year)
    } catch (error) {
      console.error('IPC Error in getYearlyManpowerSummary:', error)
      return {
        year: year,
        sections: [],
        monthly_summary: [],
        section_summary: []
      }
    }
  })

  ipcMain.handle('getSectionManpowerDetails', async (_, year, month) => {
    try {
      return await database.getSectionManpowerDetails(year, month)
    } catch (error) {
      console.error('IPC Error in getSectionManpowerDetails:', error)
      return []
    }
  })

  // Database Backup/Restore
  ipcMain.handle('db-backup', async () => database.dbBackup())
  ipcMain.handle('db-restore', async () => database.dbRestore())
  ipcMain.handle('check-restored-status', () => wasRestored)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron.production')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupIPCHandlers()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      shouldQuit = false
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    database.close()
    app.quit()
  }
})

app.on('before-quit', (event) => {
  if (!shouldQuit) {
    event.preventDefault()

    dialog
      .showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Backup Warning',
        message: 'Have you taken a backup?',
        detail: 'You might lose your data if you close the app or uninstall without backing it up.',
        buttons: ['Yes', 'No'],
        defaultId: 1,
        cancelId: 1
      })
      .then(({ response }) => {
        if (response === 0) {
          shouldQuit = true
          database.close()
          app.quit()
        }
      })
  } else {
    database.close()
  }
})

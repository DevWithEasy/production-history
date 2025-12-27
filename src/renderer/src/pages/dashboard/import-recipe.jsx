import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import RecipePreviewModal from '../../components/RecipePreviewModal'

function ImportRecipe() {
  const [excelFile, setExcelFile] = useState(null)
  const [excelData, setExcelData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sections, setSections] = useState([])
  const [selectedSection, setSelectedSection] = useState('')
  const [products, setProducts] = useState([])
  const [materials, setMaterials] = useState({ RM: [], PM: [] })
  const [error, setError] = useState(null)
  const [productLoading, setProductLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productArea, setProductArea] = useState('local')
  const [isSectionSelected, setIsSectionSelected] = useState(false)
  const [importedProducts, setImportedProducts] = useState([])
  const [importing, setImporting] = useState(false)

  const fileInputRef = useRef(null)

  // Load all sections
  const loadSections = async () => {
    try {
      const data = await window.api.getAllSections()
      setSections(data)
    } catch (error) {
      console.error('Error loading sections:', error)
      setError('Failed to load sections')
    }
  }

  // Load products by selected section
  const loadProducts = async (sectionId) => {
    setProductLoading(true)
    try {
      const data = await window.api.getProductsBySection(sectionId)
      setProducts(data)
      setIsSectionSelected(true)
    } catch (error) {
      console.error('Error loading products:', error)
      setError('Failed to load products')
    } finally {
      setProductLoading(false)
    }
  }

  // Load materials
  const loadMaterials = async () => {
    try {
      const data = await window.api.getAllMaterialsGrouped()
      setMaterials(data)
    } catch (error) {
      console.error('Error loading materials:', error)
      setError('Failed to load materials')
    }
  }

  // Handle find button click
  const handleFind = async () => {
    if (!selectedSection) {
      setError('Please select a section first')
      return
    }

    await loadProducts(selectedSection)
    await loadMaterials()
  }

  // Handle file change
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setExcelFile(file)
      readExcelFile(file)
    }
  }

  // Read Excel file
  const readExcelFile = (file) => {
    setLoading(true)
    setError(null)

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheets = workbook.SheetNames
        const recipeData = []

        for (const sheet of sheets) {
          // Skip specific sheets
          if (['Home', 'Cream & Syrup', 'Spray Mixer'].includes(sheet)) {
            continue
          }

          const worksheet = workbook.Sheets[sheet]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

          if (jsonData.length === 0) continue

          // Get product info (assuming specific format)
          const [fg_id, id, name, rmStart, rmEnd, pmStart, pmEnd] = jsonData[0].filter(
            (v) => v != null && v !== ''
          )

          if (!fg_id || !name) continue

          // Format number function
          const formatNumberExcel = (num, length = 4) => {
            if (!num && num !== 0) return 0
            const fixedString = Number(num).toFixed(length)
            return Number(fixedString)
          }

          // Extract raw materials
          const rawMaterials = jsonData
            .slice(rmStart - 1, rmEnd)
            .filter(
              (row) =>
                row[0] != null &&
                row[0] !== '' &&
                row[4] != null &&
                row[4] !== '' &&
                row[5] != null &&
                row[5] !== ''
            )
            .map((material) => ({
              id: String(material[1]).trim(),
              name: material[2] || '',
              unit: material[3] || 'kg',
              batch: formatNumberExcel(material[4], 4),
              carton: formatNumberExcel(material[5], 5)
            }))

          // Extract packaging materials
          const packingMaterials = jsonData
            .slice(pmStart - 1, pmEnd)
            .filter((row) => row[0] != null && row[0] !== '')
            .map((material) => ({
              id: String(material[1]).trim(),
              name: material[2] || '',
              unit: material[3] || 'pcs',
              batch: formatNumberExcel(material[4], 4),
              carton: formatNumberExcel(material[5], 5)
            }))

          // Prepare product data
          const product = {
            id: String(fg_id).trim(),
            name: String(name).trim(),
            rm: rawMaterials.map((material) => ({
              id: material.id,
              unit: material.unit,
              qty: material.batch
            })),
            carton_rm: rawMaterials.map((material) => ({
              id: material.id,
              unit: material.unit,
              qty: material.carton
            })),
            pm: packingMaterials.map((material) => ({
              id: material.id,
              unit: material.unit,
              qty: material.batch
            })),
            carton_pm: packingMaterials.map((material) => ({
              id: material.id,
              unit: material.unit,
              qty: material.carton
            }))
          }

          recipeData.push(product)
        }

        setExcelData(recipeData.sort((a, b) => a.name.localeCompare(b.name)))
      } catch (error) {
        console.error('Error reading Excel file:', error)
        setError("Error reading Excel file. Please make sure it's a valid Excel file.")
      } finally {
        setLoading(false)
      }
    }

    reader.onerror = (error) => {
      console.error('File reading error:', error)
      setError('Error reading file.')
      setLoading(false)
    }

    reader.readAsArrayBuffer(file)
  }

  // Clear file selection
  const handleClearFile = () => {
    setExcelFile(null)
    setExcelData(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Reset section selection
  const handleResetSection = () => {
    setSelectedSection('')
    setIsSectionSelected(false)
    setProducts([])
    setMaterials({ RM: [], PM: [] })
    setError(null)
  }

  // Handle product click from Excel
  const handleExcelProductClick = (product) => {
    console.log(product)
    setSelectedProduct(product)
    setProductArea('excel')
    setIsModalVisible(true)
  }

  // Handle product click from Database
  const handleDatabaseProductClick = async (product) => {
    const batch_data = await window.api.getProductRecipeByPurpose(product.id, 'batch')
    const carton_data = await window.api.getProductRecipeByPurpose(product.id, 'carton')
    const importedProduct = {
      id: product.code,
      name: product.name,
      rm: [
        ...batch_data
          .filter((m) => m.m_type === 'RM')
          .map((m) => {
            return {
              id: m.material_code,
              unit: m.material_unit,
              qty: m.quantity
            }
          })
      ],
      pm: [
        ...batch_data
          .filter((m) => m.m_type === 'PM')
          .map((m) => {
            return {
              id: m.material_code,
              unit: m.material_unit,
              qty: m.quantity
            }
          })
      ],
      carton_rm: [
        ...carton_data
          .filter((m) => m.m_type === 'RM')
          .map((m) => {
            return {
              id: m.material_code,
              unit: m.material_unit,
              qty: m.quantity
            }
          })
      ],
      carton_pm: [
        ...carton_data
          .filter((m) => m.m_type === 'PM')
          .map((m) => {
            return {
              id: m.material_code,
              unit: m.material_unit,
              qty: m.quantity
            }
          })
      ]
    }
    setSelectedProduct(importedProduct)
    setProductArea('database')
    setIsModalVisible(true)
  }

  // Handle import recipe
  const handleImportRecipe = async () => {
    if (!selectedProduct) return

    setImporting(true)
    try {
      // Check if product exists in database by CODE
      const productExists = await window.api.checkProductExists(selectedProduct.id)

      if (!productExists) {
        setError(
          `Product "${selectedProduct.id}" not found in database. Please add the product first.`
        )
        setImporting(false)
        return
      }

      // Import the recipe - send product CODE, not ID
      await window.api.importProductRecipe(selectedProduct.id, {
        rm: selectedProduct.rm || [],
        carton_rm: selectedProduct.carton_rm || [],
        pm: selectedProduct.pm || [],
        carton_pm: selectedProduct.carton_pm || []
      })

      // Add to imported list
      setImportedProducts((prev) => [...prev, selectedProduct.id])

      // Close modal
      setIsModalVisible(false)

      // Show success message
      setError(null)
      alert(`Recipe for "${selectedProduct.name}" imported successfully!`)
    } catch (error) {
      console.error('Error importing recipe:', error)
      setError('Failed to import recipe: ' + error.message)
    } finally {
      setImporting(false)
    }
  }

  // Get section name
  const getSectionName = (sectionId) => {
    const section = sections.find((s) => s.id == sectionId)
    return section ? section.name : 'Unknown'
  }

  // Initial load
  useEffect(() => {
    loadSections()
  }, [])

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Import Recipes from Excel</h1>
          <p className="text-gray-600 mt-2">Import recipes from Excel files to your database</p>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Excel Import */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Import from Excel File</h2>

            {/* Section Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Section</label>
              <div className="flex space-x-2">
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  disabled={productLoading}
                >
                  <option value="">Select Section</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleFind}
                  disabled={!selectedSection || productLoading}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
                >
                  {productLoading ? 'Loading...' : 'Load'}
                </button>
                {isSectionSelected && (
                  <button
                    onClick={handleResetSection}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* File Upload */}
            {isSectionSelected && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Excel File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-file"
                    ref={fileInputRef}
                  />
                  <label htmlFor="excel-file" className="cursor-pointer block">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                        <svg
                          className="w-6 h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-600">
                        {excelFile ? excelFile.name : 'Click to upload Excel file'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Supports .xlsx and .xls files</p>
                    </div>
                  </label>
                </div>
                {excelFile && (
                  <button
                    onClick={handleClearFile}
                    className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Clear File
                  </button>
                )}
              </div>
            )}

            {/* Excel Products List */}
            {excelData && excelData.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  Products from Excel ({excelData.length})
                </h3>
                <div className="bg-gray-50 rounded-lg border border-gray-200">
                  <div className="overflow-y-auto max-h-96">
                    <table className="min-w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {excelData.map((product) => {
                          const isImported = importedProducts.includes(product.id)
                          const existsInDb = products.some((p) => p.id === product.id)

                          return (
                            <tr
                              key={product.id}
                              className={`hover:bg-gray-100 cursor-pointer ${
                                isImported ? 'bg-green-50' : existsInDb ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => handleExcelProductClick(product)}
                            >
                              <td className="px-4 py-3 text-sm text-gray-900">{product.id}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                              <td className="px-4 py-3">
                                {isImported ? (
                                  <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                                    Imported
                                  </span>
                                ) : existsInDb ? (
                                  <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                                    Exists in DB
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">
                                    New
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="mt-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                <p className="mt-2 text-gray-600">Reading Excel file...</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Database Products */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Database Products
              {selectedSection && (
                <span className="text-sm text-gray-600 ml-2">
                  ({getSectionName(selectedSection)})
                </span>
              )}
            </h2>

            {!isSectionSelected ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-3">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <p className="text-gray-600">Please select a section to view products</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No products found in this section</p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg border border-gray-200">
                <div className="overflow-y-auto max-h-96">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((product) => {
                        const hasExcelData = excelData?.some((p) => p.id === product.code)
                        const isImported = importedProducts.includes(product.id)
                        return (
                          <tr
                            key={product.id}
                            className={`hover:bg-gray-100 cursor-pointer ${
                              isImported ? 'bg-green-50' : hasExcelData ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleDatabaseProductClick(product)}
                          >
                            <td className="px-4 py-3 text-sm text-gray-900">{product.code}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                            <td className="px-4 py-3">
                              {isImported ? (
                                <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                                  Imported
                                </span>
                              ) : hasExcelData ? (
                                <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                                  In Excel
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">
                                  No Excel Data
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">How to Import Recipes</h3>
          <ul className="space-y-2 text-blue-700">
            <li>1. Select a section from the dropdown</li>
            <li>2. Click &quot;Load&quot; to load products from that section</li>
            <li>3. Upload your Excel file with recipe data</li>
            <li>4. Click on any product to view its recipe</li>
            <li>5. Click &quot;Import Recipe&quot; to import to database</li>
          </ul>
          <div className="mt-4 text-sm text-blue-600">
            <strong>Note:</strong> Excel file should follow the standard format with RM and PM
            sections.
          </div>
        </div>
      </div>

      {/* Recipe Preview Modal */}
      {isModalVisible && selectedProduct && (
        <RecipePreviewModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          product={selectedProduct}
          productArea={productArea}
          materials={materials}
          onImport={handleImportRecipe}
          importing={importing}
          isImported={importedProducts.includes(selectedProduct.id)}
        />
      )}
    </div>
  )
}

export default ImportRecipe

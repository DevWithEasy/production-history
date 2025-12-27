import { useEffect, useState } from 'react'

function ProductInfo() {
  const [sections, setSections] = useState([])
  const [products, setProducts] = useState([])
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Product Info States
  const [productInfos, setProductInfos] = useState([])
  const [newProductInfo, setNewProductInfo] = useState({
    name: '',
    unit: '',
    value: ''
  })
  const [editingInfo, setEditingInfo] = useState(null)
  const [editProductInfo, setEditProductInfo] = useState({
    name: '',
    unit: '',
    value: ''
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Load all sections
  const loadSections = async () => {
    try {
      const data = await window.api.getAllSections()
      setSections(data)

      if (data.length > 0 && !selectedSection) {
        setSelectedSection(data[0].id)
      }
    } catch (error) {
      console.error('Error loading sections:', error)
      setMessage({ type: 'error', text: 'Failed to load sections' })
      hideMessage()
    }
  }

  // Load products by selected section
  const loadProducts = async (sectionId) => {
    setLoading(true)
    try {
      const data = await window.api.getProductsBySection(sectionId)
      setProducts(data)
      setSelectedProduct(null) // Reset selected product
      setProductInfos([])
      setEditingInfo(null) // Reset editing state
    } catch (error) {
      console.error('Error loading products:', error)
      setMessage({ type: 'error', text: 'Failed to load products' })
      hideMessage()
    } finally {
      setLoading(false)
    }
  }

  // Load product info for selected product
  const loadProductInfo = async (p_id) => {
    try {
      const data = await window.api.getProductInfoByProduct(p_id)
      setProductInfos(data)
    } catch (error) {
      console.error('Error loading product info:', error)
      setMessage({ type: 'error', text: 'Failed to load product information' })
      hideMessage()
    }
  }

  // Handle product selection
  const handleProductSelect = async (product) => {
    setSelectedProduct(product)
    setEditingInfo(null) // Reset editing when product changes
    await loadProductInfo(product.id)
  }

  // Initial load
  useEffect(() => {
    loadSections()
  }, [])

  // When selected section changes, load its products
  useEffect(() => {
    if (selectedSection) {
      loadProducts(selectedSection)
    }
  }, [selectedSection])

  const hideMessage = () => {
    setTimeout(() => {
      setMessage({ type: '', text: '' })
    }, 3000)
  }

  // Start editing a product info
  const startEdit = (info) => {
    setEditingInfo(info.id)
    setEditProductInfo({
      name: info.name,
      unit: info.unit || '',
      value: info.value
    })
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingInfo(null)
    setEditProductInfo({
      name: '',
      unit: '',
      value: ''
    })
  }

  // Update product info
  const updateProductInfo = async () => {
    if (!editProductInfo.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter info name' })
      hideMessage()
      return
    }

    setLoading(true)
    try {
      await window.api.updateProductInfo(
        editingInfo,
        editProductInfo.name.trim(),
        editProductInfo.unit.trim(),
        parseFloat(editProductInfo.value) || 0
      )

      // Reset editing state
      setEditingInfo(null)
      setEditProductInfo({
        name: '',
        unit: '',
        value: ''
      })

      // Reload product info
      await loadProductInfo(selectedProduct.id)
      setMessage({ type: 'success', text: 'Product info updated successfully' })
      hideMessage()
    } catch (error) {
      console.error('Error updating product info:', error)
      setMessage({ type: 'error', text: 'Failed to update product info' })
      hideMessage()
    } finally {
      setLoading(false)
    }
  }

  // Add product info
  const addProductInfo = async () => {
    if (!selectedProduct) {
      setMessage({ type: 'error', text: 'Please select a product first' })
      hideMessage()
      return
    }

    if (!newProductInfo.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter info name' })
      hideMessage()
      return
    }

    setLoading(true)
    try {
      await window.api.addProductInfo(
        selectedProduct.id,
        newProductInfo.name.trim(),
        newProductInfo.unit.trim(),
        parseFloat(newProductInfo.value) || 0
      )

      // Reset form
      setNewProductInfo({
        name: '',
        unit: '',
        value: ''
      })

      // Reload product info
      await loadProductInfo(selectedProduct.id)
      setMessage({ type: 'success', text: 'Product info added successfully' })
      hideMessage()
    } catch (error) {
      console.error('Error adding product info:', error)
      setMessage({ type: 'error', text: 'Failed to add product info' })
      hideMessage()
    } finally {
      setLoading(false)
    }
  }

  // Delete product info
  const deleteProductInfo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product info?')) {
      return
    }

    setLoading(true)
    try {
      await window.api.deleteProductInfo(id)
      await loadProductInfo(selectedProduct.id)
      setMessage({ type: 'success', text: 'Product info deleted successfully' })
      hideMessage()
    } catch (error) {
      console.error('Error deleting product info:', error)
      setMessage({ type: 'error', text: 'Failed to delete product info' })
      hideMessage()
    } finally {
      setLoading(false)
    }
  }

  // Get section name by ID
  const getSectionName = (sectionId) => {
    const section = sections.find((s) => s.id == sectionId)
    return section ? section.name : 'Unknown'
  }

  return (
    <div className="bg-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-black">
        <h2 className="text-2xl font-bold text-gray-800">Product Information Management</h2>
        <div className="text-sm text-gray-600">
          {selectedProduct && `Selected: ${selectedProduct.name}`}
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div
          className={`mb-4 p-3 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : message.type === 'error'
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-blue-100 text-blue-700 border border-blue-300'
          }`}
        >
          {message.text}
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            className="float-right text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex space-x-2">
        {/* Left Column: Sections and Products */}
        <div className="w-4/12 space-y-6">
          {/* Section Selection */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-4 py-2 border border-black rounded focus:outline-none focus:ring-1 focus:ring-black"
              disabled={loading}
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          {/* Products List */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Products</h3>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading...</p>
                </div>
              ) : products.length === 0 ? (
                <p className="text-gray-500 text-sm">No products found</p>
              ) : (
                <div className="space-y-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`p-2 text-sm border rounded cursor-pointer transition-colors ${
                        selectedProduct?.id === product.id
                          ? 'bg-black text-white'
                          : 'bg-white hover:bg-gray-100'
                      }`}
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="truncate">{product.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Product Info */}
        <div className="w-8/12">
          {selectedProduct ? (
            <div className="bg-gray-50 p-6 rounded-lg">
              {/* Selected Product Info */}
              <div className="mb-6 p-4 bg-white rounded-lg border">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      Section: {getSectionName(selectedProduct.s_id)} | Price: ৳
                      {selectedProduct.base_price} | SKU: {selectedProduct.sku || 'N/A'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">ID: #{selectedProduct.id}</div>
                </div>
              </div>

              {/* Add Product Info Form */}
              <div className="mb-6 p-4 bg-white rounded-lg border">
                <h4 className="text-lg font-semibold mb-4">Add Product Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Info Name *
                    </label>
                    <input
                      type="text"
                      value={newProductInfo.name}
                      onChange={(e) =>
                        setNewProductInfo({ ...newProductInfo, name: e.target.value })
                      }
                      placeholder="e.g., Weight, Size, Color, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input
                      type="text"
                      value={newProductInfo.unit}
                      onChange={(e) =>
                        setNewProductInfo({ ...newProductInfo, unit: e.target.value })
                      }
                      placeholder="e.g., gm, ml, pcs, inches"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                    <input
                      type="text"
                      value={newProductInfo.value}
                      onChange={(e) =>
                        setNewProductInfo({ ...newProductInfo, value: e.target.value })
                      }
                      placeholder="Enter value"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={addProductInfo}
                      disabled={loading}
                      className="px-6 py-2 bg-black text-white font-medium rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black w-full"
                    >
                      {loading ? 'Adding...' : 'Add Info'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * Required fields. Examples: Name=&quot;Weight&quot;, Unit=&quot;gm&quot;,
                  Value=&quot;500&quot;
                </p>
              </div>

              {/* Product Info List */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold">Product Information</h4>
                  <span className="text-sm text-gray-600">
                    Total: {productInfos.length} item(s)
                  </span>
                </div>

                {productInfos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-sm">
                        {productInfos.map((info) => (
                          <tr key={info.id} className="hover:bg-gray-50">
                            <td className="px-6 py-2">
                              {editingInfo === info.id ? (
                                <input
                                  type="text"
                                  value={editProductInfo.name}
                                  onChange={(e) =>
                                    setEditProductInfo({ ...editProductInfo, name: e.target.value })
                                  }
                                  className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                                />
                              ) : (
                                <span className="text-gray-900">{info.name}</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {editingInfo === info.id ? (
                                <input
                                  type="text"
                                  value={editProductInfo.unit}
                                  onChange={(e) =>
                                    setEditProductInfo({ ...editProductInfo, unit: e.target.value })
                                  }
                                  className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                                />
                              ) : (
                                <span className="text-gray-600">{info.unit || '-'}</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {editingInfo === info.id ? (
                                <input
                                  type="text"
                                  value={editProductInfo.value}
                                  onChange={(e) =>
                                    setEditProductInfo({
                                      ...editProductInfo,
                                      value: e.target.value
                                    })
                                  }
                                  className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                                />
                              ) : (
                                <span className="font-medium text-gray-900">{info.value}</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {editingInfo === info.id ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={updateProductInfo}
                                    disabled={loading}
                                    className="px-4 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                  >
                                    {loading ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="px-4 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => startEdit(info)}
                                    className="px-4 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteProductInfo(info.id)}
                                    className="px-4 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                    <div className="text-gray-400 mb-2">
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h5 className="text-lg font-medium text-gray-700 mb-2">No Information Added</h5>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Add product information using the form above. You can add weight, size, color,
                      or any other relevant details.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-12 rounded-lg text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-20 h-20 mx-auto"
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
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Product</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Please select a product from the left panel to view and manage its information.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductInfo

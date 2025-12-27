import { useEffect, useState } from 'react'

function Products() {
  const [sections, setSections] = useState([])
  const [products, setProducts] = useState([])
  const [selectedSection, setSelectedSection] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [newProduct, setNewProduct] = useState({
    s_id: '',
    name: '',
    code: '',
    base_price: '',
    sku: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Load all sections
  const loadSections = async () => {
    try {
      const data = await window.api.getAllSections()
      setSections(data)

      // যদি সেকশন থাকে, প্রথম সেকশন সিলেক্ট করুন
      if (data.length > 0 && !selectedSection) {
        setSelectedSection(data[0].id)
        setNewProduct((prev) => ({ ...prev, s_id: data[0].id }))
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
    } catch (error) {
      console.error('Error loading products:', error)
      setMessage({ type: 'error', text: 'Failed to load products' })
      hideMessage()
    } finally {
      setLoading(false)
    }
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

  // Add new product
  const addProduct = async () => {
    // Validation
    if (!newProduct.s_id) {
      setMessage({ type: 'error', text: 'Please select a section' })
      hideMessage()
      return
    }
    if (!newProduct.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter product name' })
      hideMessage()
      return
    }
    if (
      !newProduct.code ||
      !newProduct.base_price ||
      isNaN(newProduct.base_price) ||
      newProduct.base_price <= 0
    ) {
      setMessage({ type: 'error', text: 'Please enter a valid base_price' })
      hideMessage()
      return
    }

    setLoading(true)
    try {
      await window.api.addProduct(
        newProduct.s_id,
        newProduct.name.trim(),
        newProduct.code.trim(),
        parseFloat(newProduct.base_price),
        newProduct.sku.trim()
      )

      // Reset form
      setNewProduct({
        s_id: selectedSection,
        name: '',
        code: '',
        base_price: '',
        sku: ''
      })

      // Reload products
      loadProducts(selectedSection)
      setMessage({ type: 'success', text: 'Product added successfully' })
      hideMessage()
    } catch (error) {
      console.error('Error adding product:', error)
      setMessage({ type: 'error', text: 'Failed to add product' })
      hideMessage()
    } finally {
      setLoading(false)
    }
  }

  // Start editing product
  const startEdit = (product) => {
    setEditingProduct({
      id: product.id,
      s_id: product.s_id,
      name: product.name,
      code: product.code,
      base_price: product.base_price,
      sku: product.sku || ''
    })
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingProduct(null)
  }

  // Update product
  const updateProduct = async () => {
    if (!editingProduct) return

    // Validation
    if (!editingProduct.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter product name' })
      hideMessage()
      return
    }
    if (
      !editingProduct.base_price ||
      isNaN(editingProduct.base_price) ||
      editingProduct.base_price <= 0
    ) {
      setMessage({ type: 'error', text: 'Please enter a valid base_price' })
      hideMessage()
      return
    }

    setLoading(true)
    try {
      await window.api.updateProduct(
        editingProduct.id,
        editingProduct.s_id,
        editingProduct.name.trim(),
        editingProduct.code.trim(),
        parseFloat(editingProduct.base_price),
        editingProduct.sku.trim()
      )

      // Reset and reload
      setEditingProduct(null)
      loadProducts(selectedSection)
      setMessage({ type: 'success', text: 'Product updated successfully' })
      hideMessage()
    } catch (error) {
      console.error('Error updating product:', error)
      setMessage({ type: 'error', text: 'Failed to update product' })
      hideMessage()
    } finally {
      setLoading(false)
    }
  }

  // Delete product
  const deleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    setLoading(true)
    try {
      await window.api.deleteProduct(id)
      loadProducts(selectedSection)
      setMessage({ type: 'success', text: 'Product deleted successfully' })
      hideMessage()
    } catch (error) {
      console.error('Error deleting product:', error)
      setMessage({ type: 'error', text: 'Failed to delete product' })
      hideMessage()
    } finally {
      setLoading(false)
    }
  }

  // Handle section change
  const handleSectionChange = (e) => {
    const sectionId = e.target.value
    setSelectedSection(sectionId)
    setNewProduct((prev) => ({ ...prev, s_id: sectionId }))
    if (editingProduct) {
      setEditingProduct((prev) => ({ ...prev, s_id: sectionId }))
    }
  }

  // Handle key press
  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action()
    }
  }

  // Get section name by ID
  const getSectionName = (sectionId) => {
    const section = sections.find((s) => s.id == sectionId)
    return section ? section.name : 'Unknown'
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-black">
        <h2 className="text-2xl font-bold text-gray-800">Products</h2>
        <div className="text-sm text-gray-600">
          Total: {products.length} product(s)
          {selectedSection && ` in ${getSectionName(selectedSection)}`}
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div
          className={`mb-4 p-3 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
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

      {/* Section Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Section</label>
        <select
          value={selectedSection}
          onChange={handleSectionChange}
          className="w-full px-4 py-2 border border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent"
          disabled={loading || sections.length === 0}
        >
          {sections.length === 0 ? (
            <option value="">No sections available</option>
          ) : (
            sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Add New Product Form */}
      {selectedSection && (
        <div className="mb-6 p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Add New Product</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                onKeyPress={(e) => handleKeyPress(e, addProduct)}
                placeholder="Enter product name"
                className="w-full px-4 py-2 border border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input
                type="text"
                value={newProduct.code}
                onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                onKeyPress={(e) => handleKeyPress(e, addProduct)}
                placeholder="Enter Code"
                className="w-full px-4 py-2 border border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input
                type="number"
                value={newProduct.base_price}
                onChange={(e) => setNewProduct({ ...newProduct, base_price: e.target.value })}
                onKeyPress={(e) => handleKeyPress(e, addProduct)}
                placeholder="Enter base_price"
                className="w-full px-4 py-2 border border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent"
                disabled={loading}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Optional)</label>
              <input
                type="text"
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                onKeyPress={(e) => handleKeyPress(e, addProduct)}
                placeholder="Enter SKU"
                className="w-full px-4 py-2 border border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent"
                disabled={loading}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={addProduct}
                disabled={loading || !newProduct.name.trim() || !newProduct.base_price}
                className="px-6 py-2 bg-black text-white font-medium cursor-pointer hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-black disabled:cursor-not-allowed transition-colors w-full"
              >
                {loading ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="overflow-hidden border border-gray-200">
        {loading && products.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        ) : !selectedSection ? (
          <div className="p-8 text-center text-gray-500">
            Please select a section to view products
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No products found in this section. Add your first product above.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 font-mono">#{product.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    {editingProduct?.id === product.id ? (
                      <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, name: e.target.value })
                        }
                        className="w-full px-3 py-1 border border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{product.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingProduct?.id === product.id ? (
                      <input
                        type="text"
                        value={editingProduct.code}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, code: e.target.value })
                        }
                        className="w-full px-3 py-1 border border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{product.code}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingProduct?.id === product.id ? (
                      <input
                        type="number"
                        value={editingProduct.base_price}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, base_price: e.target.value })
                        }
                        className="w-full px-3 py-1 border border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent"
                        min="0"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        ৳{product.base_price}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingProduct?.id === product.id ? (
                      <input
                        type="text"
                        value={editingProduct.sku}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, sku: e.target.value })
                        }
                        className="w-full px-3 py-1 border border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent"
                      />
                    ) : (
                      <span className="text-sm text-gray-600">{product.sku || '-'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {editingProduct?.id === product.id ? (
                        <>
                          <button
                            onClick={updateProduct}
                            disabled={loading}
                            className="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={loading}
                            className="px-3 py-1 text-xs bg-gray-300 text-gray-700 hover:bg-gray-400 disabled:opacity-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(product)}
                            disabled={loading}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id, product.name)}
                            disabled={loading}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Statistics */}
      {products.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <p>
              Showing products from <strong>{getSectionName(selectedSection)}</strong> section
            </p>
            <p className="mt-1">Tip: Select different section from dropdown to view its products</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products

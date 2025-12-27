import { useEffect, useState } from 'react'

function RecipeManagement() {
  const [sections, setSections] = useState([])
  const [products, setProducts] = useState([])
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [materials, setMaterials] = useState({ RM: [], PM: [] })
  const [recipes, setRecipes] = useState([])
  const [purpose, setPurpose] = useState('batch') // batch or carton
  const [materialType, setMaterialType] = useState('RM') // RM or PM
  const [newRecipe, setNewRecipe] = useState({
    m_id: '',
    quantity: '',
    m_type: 'RM'
  })
  const [editingRecipe, setEditingRecipe] = useState(null)
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
      setSelectedProduct(null)
      setRecipes([])
    } catch (error) {
      console.error('Error loading products:', error)
      setMessage({ type: 'error', text: 'Failed to load products' })
      hideMessage()
    } finally {
      setLoading(false)
    }
  }

  // Load materials by type
  const loadMaterials = async () => {
    try {
      const data = await window.api.getAllMaterialsGrouped()
      setMaterials(data)
    } catch (error) {
      console.error('Error loading materials:', error)
      setMessage({ type: 'error', text: 'Failed to load materials' })
      hideMessage()
    }
  }

  // Load recipes for selected product
  const loadRecipes = async (p_id) => {
    try {
      const data = await window.api.getProductRecipeByPurpose(p_id, purpose)
      setRecipes(data)
    } catch (error) {
      console.error('Error loading recipes:', error)
      setMessage({ type: 'error', text: 'Failed to load recipes' })
      hideMessage()
    }
  }

  // Handle product selection
  const handleProductSelect = async (product) => {
    setSelectedProduct(product)
    await loadRecipes(product.id)
  }

  // Initial load
  useEffect(() => {
    loadSections()
    loadMaterials()
  }, [])

  // When selected section changes, load its products
  useEffect(() => {
    if (selectedSection) {
      loadProducts(selectedSection)
    }
  }, [selectedSection])

  // When purpose changes, reload recipes
  useEffect(() => {
    if (selectedProduct) {
      loadRecipes(selectedProduct.id)
    }
  }, [purpose])

  const hideMessage = () => {
    setTimeout(() => {
      setMessage({ type: '', text: '' })
    }, 3000)
  }

  // Add new recipe
  const addRecipe = async () => {
    if (!selectedProduct) {
      setMessage({ type: 'error', text: 'Please select a product first' })
      hideMessage()
      return
    }

    if (!newRecipe.m_id) {
      setMessage({ type: 'error', text: 'Please select a material' })
      hideMessage()
      return
    }

    if (!newRecipe.quantity || isNaN(newRecipe.quantity) || newRecipe.quantity <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid quantity' })
      hideMessage()
      return
    }

    setLoading(true)
    try {
      // Check if material already exists for this purpose
      const existingRecipe = recipes.find(
        (r) => r.m_id === parseInt(newRecipe.m_id) && r.purpose === purpose
      )

      if (existingRecipe) {
        setMessage({ type: 'error', text: 'This material is already added for ' + purpose })
        hideMessage()
        return
      }

      await window.api.addRecipe(
        selectedProduct.id,
        parseInt(newRecipe.m_id),
        parseFloat(newRecipe.quantity),
        purpose,
        newRecipe.m_type
      )

      // Reset form
      setNewRecipe({
        m_id: '',
        quantity: '',
        m_type: materialType
      })

      // Reload recipes
      await loadRecipes(selectedProduct.id)
      setMessage({ type: 'success', text: 'Material added successfully' })
      hideMessage()
    } catch (error) {
      console.error('Error adding recipe:', error)
      setMessage({ type: 'error', text: 'Failed to add material' })
      hideMessage()
    } finally {
      setLoading(false)
    }
  }

  // Start editing recipe
  const startEdit = (recipe) => {
    setEditingRecipe({
      id: recipe.id,
      m_id: recipe.m_id,
      quantity: recipe.quantity,
      m_type: recipe.m_type
    })
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingRecipe(null)
  }

  // Update recipe
  const updateRecipe = async () => {
    if (!editingRecipe) return

    if (!editingRecipe.quantity || isNaN(editingRecipe.quantity) || editingRecipe.quantity <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid quantity' })
      hideMessage()
      return
    }

    setLoading(true)
    try {
      await window.api.updateRecipe(
        editingRecipe.id,
        parseFloat(editingRecipe.quantity),
        purpose,
        editingRecipe.m_type
      )

      // Reset and reload
      setEditingRecipe(null)
      await loadRecipes(selectedProduct.id)
      setMessage({ type: 'success', text: 'Material updated successfully' })
      hideMessage()
    } catch (error) {
      console.error('Error updating recipe:', error)
      setMessage({ type: 'error', text: 'Failed to update material' })
      hideMessage()
    } finally {
      setLoading(false)
    }
  }

  // Delete recipe
  const deleteRecipe = async (id, materialName) => {
    if (!window.confirm(`Are you sure you want to remove "${materialName}" from recipe?`)) {
      return
    }

    setLoading(true)
    try {
      await window.api.deleteRecipe(id)
      await loadRecipes(selectedProduct.id)
      setMessage({ type: 'success', text: 'Material removed successfully' })
      hideMessage()
    } catch (error) {
      console.error('Error deleting recipe:', error)
      setMessage({ type: 'error', text: 'Failed to remove material' })
      hideMessage()
    } finally {
      setLoading(false)
    }
  }

  // Handle material type change
  const handleMaterialTypeChange = (type) => {
    setMaterialType(type)
    setNewRecipe((prev) => ({ ...prev, m_type: type }))
  }

  // Get section name by ID
  const getSectionName = (sectionId) => {
    const section = sections.find((s) => s.id == sectionId)
    return section ? section.name : 'Unknown'
  }

  // Get current materials list based on selected type
  const getCurrentMaterials = () => {
    return materials[materialType] || []
  }

  // Calculate total quantity for current purpose
  const calculateTotalQuantity = () => {
    return recipes.reduce((total, recipe) => total + (parseFloat(recipe.quantity) || 0), 0)
  }

  return (
    <div className="bg-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-black">
        <h2 className="text-2xl font-bold text-gray-800">Recipe Management</h2>
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

      {/* Main Layout */}
      <div className="flex space-x-6">
        {/* Left Column: Sections, Products and Purpose Selection */}
        <div className="w-5/12 space-y-6">
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
                      className={`p-2 border rounded cursor-pointer transition-colors ${
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

          {/* Purpose Selection */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Purpose</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPurpose('batch')}
                className={`p-3 border rounded text-center transition-colors ${
                  purpose === 'batch'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Batch
              </button>
              <button
                onClick={() => setPurpose('carton')}
                className={`p-3 border rounded text-center transition-colors ${
                  purpose === 'carton'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Carton
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Recipe Management */}
        <div className="w-7/12">
          {selectedProduct ? (
            <div className="space-y-6">
              {/* Selected Product Info */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      Section: {getSectionName(selectedProduct.s_id)} | Price: ৳
                      {selectedProduct.base_price} | Purpose: {purpose}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">ID: #{selectedProduct.id}</div>
                </div>
              </div>

              {/* Add Material Form */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="text-lg font-semibold mb-4">Add Material to {purpose}</h4>
                <div className="space-y-4">
                  {/* Material Type Selection */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                      onClick={() => handleMaterialTypeChange('RM')}
                      className={`p-3 border rounded text-center transition-colors ${
                        materialType === 'RM'
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Raw Materials (RM)
                    </button>
                    <button
                      onClick={() => handleMaterialTypeChange('PM')}
                      className={`p-3 border rounded text-center transition-colors ${
                        materialType === 'PM'
                          ? 'bg-purple-100 text-purple-700 border-purple-300'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Packaging Materials (PM)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Material
                      </label>
                      <select
                        value={newRecipe.m_id}
                        onChange={(e) => setNewRecipe({ ...newRecipe, m_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                        disabled={loading}
                      >
                        <option value="">Select {materialType} Material</option>
                        {getCurrentMaterials().map((material) => (
                          <option key={material.id} value={material.id}>
                            {material.name} ({material.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={newRecipe.quantity}
                        onChange={(e) => setNewRecipe({ ...newRecipe, quantity: e.target.value })}
                        placeholder="Enter quantity"
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                        disabled={loading}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={addRecipe}
                        disabled={loading || !newRecipe.m_id || !newRecipe.quantity}
                        className="px-6 py-2 bg-black text-white font-medium rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Adding...' : 'Add to Recipe'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Materials List */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold">Recipe Materials ({purpose})</h4>
                  <div className="text-sm text-gray-600">
                    Total: {recipes.length} item(s) | Total Qty:{' '}
                    {calculateTotalQuantity().toFixed(2)}
                  </div>
                </div>

                {recipes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Material
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {recipes.map((recipe) => (
                          <tr key={recipe.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              {editingRecipe?.id === recipe.id ? (
                                <select
                                  value={editingRecipe.m_id}
                                  onChange={(e) =>
                                    setEditingRecipe({ ...editingRecipe, m_id: e.target.value })
                                  }
                                  className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                                  disabled
                                >
                                  <option value={recipe.m_id}>
                                    {recipe.material_name} ({recipe.material_code})
                                  </option>
                                </select>
                              ) : (
                                <div>
                                  <span className="font-medium text-gray-900">
                                    {recipe.material_name}
                                  </span>
                                  <div className="text-xs text-gray-500">
                                    {recipe.material_code}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  recipe.m_type === 'RM'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {recipe.m_type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-gray-600 uppercase">
                                {recipe.material_unit}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {editingRecipe?.id === recipe.id ? (
                                <input
                                  type="number"
                                  value={editingRecipe.quantity}
                                  onChange={(e) =>
                                    setEditingRecipe({ ...editingRecipe, quantity: e.target.value })
                                  }
                                  className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                                  min="0"
                                  step="0.01"
                                />
                              ) : (
                                <span className="font-medium text-gray-900">{recipe.quantity}</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {editingRecipe?.id === recipe.id ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={updateRecipe}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                  >
                                    {loading ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => startEdit(recipe)}
                                    className="px-4 py-2 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteRecipe(recipe.id, recipe.material_name)}
                                    className="px-4 py-2 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  >
                                    Remove
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
                    <h5 className="text-lg font-medium text-gray-700 mb-2">No Materials Added</h5>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Add materials to {purpose} recipe using the form above.
                    </p>
                  </div>
                )}
              </div>

              {/* Recipe Summary */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="text-lg font-semibold mb-3">Recipe Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-500 mb-1">Batch Materials</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {recipes.filter((r) => r.m_type === 'RM').length}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Raw Materials</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-500 mb-1">Packaging Materials</div>
                    <div className="text-2xl font-bold text-purple-800">
                      {recipes.filter((r) => r.m_type === 'PM').length}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">PM Count</div>
                  </div>
                </div>
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
                Please select a product from the left panel to manage its recipe.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecipeManagement

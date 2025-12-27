// src/main/database.js
import Database from 'better-sqlite3'
import { app, dialog } from 'electron'
import path from 'path'
import db_data from './db_data'
import db_materials from './db_materials'
import fs from 'fs'

class DatabaseService {
  constructor() {
    const userDataPath = app.getPath('userData')
    this.dbPath = path.join(userDataPath, 'production.db')
    this.db = new Database(this.dbPath, { verbose: console.log })
    this.initDatabase()
    this.seedDatabase()
  }

  initDatabase() {
    // টেবিল তৈরি করুন
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
      );

      CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL DEFAULT 0.0,
      code TEXT UNIQUE,
      unit TEXT DEFAULT 'kg',
      type TEXT DEFAULT 'RM',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      p_id INTEGER NOT NULL,
      name TEXT,
      unit TEXT,
      value REAL DEFAULT 0.0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(p_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(p_id, name)
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      p_id INTEGER NOT NULL,
      m_id INTEGER NOT NULL,
      quantity REAL DEFAULT 1.0,
      purpose TEXT DEFAULT 'batch',
      m_type TEXT DEFAULT 'RM',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(p_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY(m_id) REFERENCES materials(id) ON DELETE CASCADE,
      UNIQUE(p_id, m_id,purpose)
    );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        s_id INTEGER NOT NULL,
        name TEXT,
        code TEXT,
        base_price REAL DEFAULT 0.0,
        sku TEXT,
        FOREIGN KEY(s_id) REFERENCES sections(id)
      );

      CREATE TABLE IF NOT EXISTS monthly_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        p_id INTEGER NOT NULL,
        year INTEGER,
        month INTEGER,
        price REAL DEFAULT 0.0,
        FOREIGN KEY(p_id) REFERENCES products(id),
        UNIQUE(p_id, year, month)
      );

      CREATE TABLE IF NOT EXISTS monthly_product_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        p_id INTEGER NOT NULL,
        year INTEGER,
        month INTEGER,
        opening INTEGER DEFAULT 0,
        sales_target INTEGER DEFAULT 0,
        production_target INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(p_id) REFERENCES products(id),
        UNIQUE(p_id, year, month)
      );

      CREATE TABLE IF NOT EXISTS daily_total_manpower (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE,
        mp_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS daily_section_manpower (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        s_id INTEGER,
        date TEXT,
        mp_count INTEGER DEFAULT 0,
        FOREIGN KEY(s_id) REFERENCES sections(id),
        UNIQUE(s_id, date)
      );

      CREATE TABLE IF NOT EXISTS daily_production (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        p_id INTEGER,
        date TEXT,
        batch INTEGER DEFAULT 0,
        carton INTEGER DEFAULT 0,
        FOREIGN KEY(p_id) REFERENCES products(id),
        UNIQUE(p_id, date)
      );
    `)
  }

  seedDatabase() {
    try {
      const existingSections = this.db.prepare('SELECT COUNT(*) as count FROM sections').get()
      const existingProducts = this.db.prepare('SELECT COUNT(*) as count FROM products').get()
      const existingMaterials = this.db.prepare('SELECT COUNT(*) as count FROM materials').get()
      const existingProductInfo = this.db
        .prepare('SELECT COUNT(*) as count FROM product_info')
        .get()

      if (
        existingSections.count > 0 ||
        existingProducts.count > 0 ||
        existingMaterials.count > 0 ||
        existingProductInfo.count > 0
      ) {
        console.log('Database already has data. Skipping seed.')
        return
      }

      const insertSection = this.db.prepare('INSERT INTO sections (name) VALUES (?)')
      const insertProduct = this.db.prepare(
        'INSERT INTO products (s_id, name, code, base_price, sku) VALUES (?, ?, ?, ?, ?)'
      )
      const insertMaterial = this.db.prepare(
        'INSERT INTO materials (name, price, code, unit, type) VALUES (?, ?, ?, ?, ?)'
      )
      const insertProductInfo = this.db.prepare(
        'INSERT INTO product_info (p_id, name, unit, value) VALUES (?, ?, ?, ?)'
      )

      // Main transaction for sections, products and product_info
      const insertTransaction = this.db.transaction((db_data) => {
        for (const section of db_data) {
          // Insert section
          const sectionResult = insertSection.run(section.name)
          const sectionId = sectionResult.lastInsertRowid

          // Insert products for this section
          for (const product of section.products) {
            const productResult = insertProduct.run(
              sectionId,
              product.name,
              product.code,
              product.price || 0,
              product.sku || ''
            )
            const productId = productResult.lastInsertRowid

            // Insert product infos if available
            if (section.infos && Array.isArray(section.infos)) {
              for (const info of section.infos) {
                insertProductInfo.run(productId, info.name, info.unit, info.value)
              }
            }
          }
        }
      })

      // Material transaction
      const insertMaterialTransaction = this.db.transaction((db_materials, type) => {
        for (const material of db_materials) {
          insertMaterial.run(material.name, material.price, material.code, material.unit, type)
        }
      })

      insertTransaction(db_data)
      insertMaterialTransaction(db_materials.rm, 'RM')
      insertMaterialTransaction(db_materials.pm, 'PM')

      console.log('Database seeding completed successfully.')
    } catch (error) {
      console.error('Error seeding database:', error)
    }
  }

  // Section CRUD
  getAllSections() {
    const stmt = this.db.prepare('SELECT * FROM sections ORDER BY id')
    return stmt.all()
  }

  addSection(name) {
    const stmt = this.db.prepare('INSERT INTO sections (name) VALUES (?)')
    return stmt.run(name)
  }

  updateSection(id, name) {
    const stmt = this.db.prepare('UPDATE sections SET name = ? WHERE id = ?')
    return stmt.run(name, id)
  }

  deleteSection(id) {
    const stmt = this.db.prepare('DELETE FROM sections WHERE id = ?')
    return stmt.run(id)
  }

  // Materials CRUD
  getAllMaterials() {
    const stmt = this.db.prepare('SELECT * FROM materials ORDER BY name')
    return stmt.all()
  }

  addMaterial(name, price, code, unit, type) {
    const stmt = this.db.prepare(
      'INSERT INTO materials (name, price, code, unit, type) VALUES (?, ?, ?, ?, ?)'
    )
    return stmt.run(name, price, code, unit, type)
  }

  updateMaterial(id, name, price, code, unit, type) {
    const stmt = this.db.prepare(
      'UPDATE materials SET name = ?, price = ?, code = ?, unit = ?, type = ? WHERE id = ?'
    )
    return stmt.run(name, price, code, unit, type, id)
  }

  deleteMaterial(id) {
    const stmt = this.db.prepare('DELETE FROM materials WHERE id = ?')
    return stmt.run(id)
  }

  // Product CRUD
  getAllProducts() {
    const stmt = this.db.prepare(`
      SELECT p.*, s.name as section_name 
      FROM products p
      LEFT JOIN sections s ON p.s_id = s.id
      ORDER BY p.name
    `)
    return stmt.all()
  }

  getProductsBySection(sectionId) {
    const stmt = this.db.prepare('SELECT * FROM products WHERE s_id = ? ORDER BY id')
    return stmt.all(sectionId)
  }

  addProduct(s_id, name, code, base_price, sku) {
    const stmt = this.db.prepare(
      'INSERT INTO products (s_id, name,code, base_price, sku) VALUES (?,?, ?, ?, ?)'
    )
    return stmt.run(s_id, name, code, base_price, sku)
  }

  updateProduct(id, s_id, name, code, base_price, sku) {
    const stmt = this.db.prepare(
      'UPDATE products SET s_id = ?, name = ?, code = ?, base_price = ?, sku = ? WHERE id = ?'
    )
    return stmt.run(s_id, name, code, base_price, sku, id)
  }

  deleteProduct(id) {
    const stmt = this.db.prepare('DELETE FROM products WHERE id = ?')
    return stmt.run(id)
  }

  // Product Info Methods
  addProductInfo(p_id, name, unit, value) {
    const stmt = this.db.prepare(
      'INSERT INTO product_info (p_id, name, unit, value) VALUES (?, ?, ?, ?)'
    )
    return stmt.run(p_id, name, unit, value)
  }

  getProductInfoByProduct(p_id) {
    const stmt = this.db.prepare('SELECT * FROM product_info WHERE p_id = ? ORDER BY name')
    return stmt.all(p_id)
  }

  updateProductInfo(id, name, unit, value) {
    const stmt = this.db.prepare(
      'UPDATE product_info SET name = ?, unit = ?, value = ? WHERE id = ?'
    )
    return stmt.run(name, unit, value, id)
  }

  deleteProductInfo(id) {
    const stmt = this.db.prepare('DELETE FROM product_info WHERE id = ?')
    return stmt.run(id)
  }

  // Monthly Prices Methods
  getMonthlyPrice(p_id, year, month) {
    const stmt = this.db.prepare(
      'SELECT price FROM monthly_prices WHERE p_id = ? AND year = ? AND month = ?'
    )
    const result = stmt.get(p_id, year, month)

    if (result) {
      return result.price
    } else {
      // If no monthly price found, return base price
      const basePriceStmt = this.db.prepare('SELECT base_price FROM products WHERE id = ?')
      const product = basePriceStmt.get(p_id)
      return product?.base_price || 0
    }
  }

  setMonthlyPrice(p_id, year, month, price) {
    const existing = this.db
      .prepare('SELECT id FROM monthly_prices WHERE p_id = ? AND year = ? AND month = ?')
      .get(p_id, year, month)

    if (existing) {
      const stmt = this.db.prepare(
        'UPDATE monthly_prices SET price = ? WHERE p_id = ? AND year = ? AND month = ?'
      )
      return stmt.run(price, p_id, year, month)
    } else {
      const stmt = this.db.prepare(
        'INSERT INTO monthly_prices (p_id, year, month, price) VALUES (?, ?, ?, ?)'
      )
      return stmt.run(p_id, year, month, price)
    }
  }

  // Monthly Product Summary Methods
  getOrCreateMonthlySummary(p_id, year, month) {
    const stmt = this.db.prepare(
      'SELECT * FROM monthly_product_summary WHERE p_id = ? AND year = ? AND month = ?'
    )
    let summary = stmt.get(p_id, year, month)

    if (!summary) {
      // Create new summary for the month
      const sales_target = 0
      const production_target = Math.round(sales_target * 1.2) // 20% extra

      const insertStmt = this.db.prepare(`
        INSERT INTO monthly_product_summary 
        (p_id, year, month, opening, sales_target, production_target) 
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      insertStmt.run(p_id, year, month, 0, sales_target, production_target)

      summary = {
        p_id,
        year,
        month,
        opening: 0,
        sales_target: sales_target,
        production_target: production_target
      }
    }

    return summary
  }

  getMonthlySummary(p_id, year, month) {
    const stmt = this.db.prepare(
      'SELECT * FROM monthly_product_summary WHERE p_id = ? AND year = ? AND month = ?'
    )
    return stmt.get(p_id, year, month)
  }

  updateMonthlySummary(p_id, year, month, opening, sales_target) {
    const production_target = Math.round(sales_target * 1.2)

    const existing = this.db
      .prepare('SELECT id FROM monthly_product_summary WHERE p_id = ? AND year = ? AND month = ?')
      .get(p_id, year, month)

    if (existing) {
      const stmt = this.db.prepare(`
        UPDATE monthly_product_summary 
        SET opening = ?, sales_target = ?, production_target = ? 
        WHERE p_id = ? AND year = ? AND month = ?
      `)
      return stmt.run(opening, sales_target, production_target, p_id, year, month)
    } else {
      const stmt = this.db.prepare(`
        INSERT INTO monthly_product_summary 
        (p_id, year, month, opening, sales_target, production_target) 
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      return stmt.run(p_id, year, month, opening, sales_target, production_target)
    }
  }

  // Daily Production Methods
  getDailyProduction(section_id, month, year) {
    try {
      month = parseInt(month)
      year = parseInt(year)

      const formattedMonth = month.toString().padStart(2, '0')
      const lastDay = new Date(year, month, 0).getDate()

      const allDates = []
      for (let day = 1; day <= lastDay; day++) {
        const formattedDay = day.toString().padStart(2, '0')
        allDates.push(`${year}-${formattedMonth}-${formattedDay}`)
      }

      // Get products for the section
      const products_stmt = this.db.prepare('SELECT * FROM products WHERE s_id = ? ORDER BY id')
      const products = products_stmt.all(section_id)

      if (products.length === 0) {
        return []
      }

      // Prepare statement for getting production data
      const stmt = this.db.prepare(
        'SELECT * FROM daily_production WHERE p_id = ? AND date BETWEEN ? AND ? ORDER BY date'
      )

      const result = []

      for (const product of products) {
        // Get existing production data for this product in the date range
        const existingProductions = stmt.all(product.id, allDates[0], allDates[allDates.length - 1])

        // Create a map of date -> production for easy lookup
        const productionMap = new Map()
        existingProductions.forEach((prod) => {
          productionMap.set(prod.date, prod)
        })

        // Generate production data for all dates
        const productions = allDates.map((date) => {
          if (productionMap.has(date)) {
            // Return existing data
            return productionMap.get(date)
          } else {
            // Return default data for missing dates
            return {
              id: null,
              p_id: product.id,
              date: date,
              batch: 0,
              carton: 0,
              exists: false
            }
          }
        })

        // Get monthly price
        const monthlyPrice = this.getMonthlyPrice(product.id, year, month)

        // Get monthly summary
        const monthlySummary = this.getOrCreateMonthlySummary(product.id, year, month)

        // Calculate total production for the month
        const totalProduction = productions.reduce((sum, prod) => sum + (prod.carton || 0), 0)

        // Calculate remaining production
        const remainingProduction = Math.max(
          monthlySummary.production_target - (monthlySummary.opening + totalProduction),
          0
        )

        // Calculate completion percentage
        const completionPercentage =
          monthlySummary.production_target > 0
            ? Math.round(
                ((monthlySummary.opening + totalProduction) / monthlySummary.production_target) *
                  100
              )
            : 0
        const floorProductionTarget = Math.max(
          monthlySummary.production_target - monthlySummary.opening,
          0
        )
        result.push({
          product: {
            ...product,
            current_price: monthlyPrice
          },
          monthly_summary: monthlySummary,
          productions: productions,
          stats: {
            total_production: totalProduction,
            remaining_production: remainingProduction,
            completion_percentage: completionPercentage,
            current_total: monthlySummary.opening + totalProduction,
            floor_production_target: floorProductionTarget
          }
        })
      }

      return result
    } catch (error) {
      console.error('Error in getDailyProduction:', error)
      throw error
    }
  }

  setDailyProduction(date, p_id, batch, carton) {
    const existing = this.db
      .prepare('SELECT id FROM daily_production WHERE date = ? AND p_id = ?')
      .get(date, p_id)

    if (existing) {
      const stmt = this.db.prepare(
        'UPDATE daily_production SET batch = ?, carton = ? WHERE date = ? AND p_id = ?'
      )
      return stmt.run(batch, carton, date, p_id)
    } else {
      const stmt = this.db.prepare(
        'INSERT INTO daily_production (date, p_id, batch, carton) VALUES (?, ?, ?, ?)'
      )
      return stmt.run(date, p_id, batch, carton)
    }
  }

  // Manpower Methods
  getSectionManpower(month, year) {
    try {
      month = parseInt(month)
      year = parseInt(year)

      const formattedMonth = month.toString().padStart(2, '0')
      const lastDay = new Date(year, month, 0).getDate()

      const allDates = []
      for (let day = 1; day <= lastDay; day++) {
        const formattedDay = day.toString().padStart(2, '0')
        allDates.push(`${year}-${formattedMonth}-${formattedDay}`)
      }

      // Get all sections
      const sections_stmt = this.db.prepare('SELECT * FROM sections ORDER BY name')
      const sections = sections_stmt.all()

      if (sections.length === 0) {
        return []
      }

      // Prepare statement for getting section manpower data
      const stmt = this.db.prepare(
        'SELECT * FROM daily_section_manpower WHERE s_id = ? AND date BETWEEN ? AND ? ORDER BY date'
      )

      const result = []

      for (const section of sections) {
        // Get existing manpower data for this section in the date range
        const existingManpower = stmt.all(section.id, allDates[0], allDates[allDates.length - 1])

        // Create a map of date -> manpower for easy lookup
        const manpowerMap = new Map()
        existingManpower.forEach((data) => {
          manpowerMap.set(data.date, data)
        })

        // Generate manpower data for all dates
        const daily_mp = allDates.map((date) => {
          if (manpowerMap.has(date)) {
            return manpowerMap.get(date)
          } else {
            return {
              id: null,
              s_id: section.id,
              date: date,
              mp_count: 0,
              exists: false
            }
          }
        })

        result.push({
          section: section,
          daily_mp: daily_mp
        })
      }

      return result
    } catch (error) {
      console.error('Error in getSectionManpower:', error)
      throw error
    }
  }

  getDailyTotalManpower(date) {
    try {
      const stmt = this.db.prepare('SELECT * FROM daily_total_manpower WHERE date = ?')
      return stmt.get(date)
    } catch (error) {
      console.error('Error getting daily total manpower:', error)
      return null
    }
  }

  setDailyTotalManpower(date, mp_count) {
    const existing = this.db.prepare('SELECT id FROM daily_total_manpower WHERE date = ?').get(date)

    if (existing) {
      const stmt = this.db.prepare('UPDATE daily_total_manpower SET mp_count = ? WHERE date = ?')
      return stmt.run(mp_count, date)
    } else {
      const stmt = this.db.prepare(
        'INSERT INTO daily_total_manpower (date, mp_count) VALUES (?, ?)'
      )
      return stmt.run(date, mp_count)
    }
  }

  setSectionManpower(date, s_id, mp_count) {
    const existing = this.db
      .prepare('SELECT id FROM daily_section_manpower WHERE date = ? AND s_id = ?')
      .get(date, s_id)

    if (existing) {
      const stmt = this.db.prepare(
        'UPDATE daily_section_manpower SET mp_count = ? WHERE date = ? AND s_id = ?'
      )
      return stmt.run(mp_count, date, s_id)
    } else {
      const stmt = this.db.prepare(
        'INSERT INTO daily_section_manpower (date, s_id, mp_count) VALUES (?, ?, ?)'
      )
      return stmt.run(date, s_id, mp_count)
    }
  }

  // Recipe Management Methods
  getProductRecipes(p_id) {
    const stmt = this.db.prepare(`
      SELECT r.*, m.name as material_name, m.unit as material_unit, m.type as material_type, 
             m.code as material_code, m.price as material_price
      FROM recipes r
      LEFT JOIN materials m ON r.m_id = m.id
      WHERE r.p_id = ?
      ORDER BY m.name
    `)
    return stmt.all(p_id)
  }

  getProductRecipeByPurpose(p_id, purpose) {
    const stmt = this.db.prepare(`
      SELECT r.*, m.name as material_name, m.unit as material_unit, m.type as material_type,
             m.code as material_code, m.price as material_price
      FROM recipes r
      LEFT JOIN materials m ON r.m_id = m.id
      WHERE r.p_id = ? AND r.purpose = ?
      ORDER BY m.name
    `)
    return stmt.all(p_id, purpose)
  }

  addRecipe(p_id, m_id, quantity, purpose, m_type) {
    const stmt = this.db.prepare(`
      INSERT INTO recipes (p_id, m_id, quantity, purpose, m_type)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(p_id, m_id, purpose) DO UPDATE SET
      quantity = excluded.quantity,
      m_type = excluded.m_type
    `)
    return stmt.run(p_id, m_id, quantity, purpose, m_type)
  }

  updateRecipe(id, quantity, purpose, m_type) {
    const stmt = this.db.prepare(`
      UPDATE recipes 
      SET quantity = ?, purpose = ?, m_type = ?
      WHERE id = ?
    `)
    return stmt.run(quantity, purpose, m_type, id)
  }

  deleteRecipe(id) {
    const stmt = this.db.prepare('DELETE FROM recipes WHERE id = ?')
    return stmt.run(id)
  }

  deleteRecipeByProductAndMaterial(p_id, m_id, purpose) {
    const stmt = this.db.prepare(`
      DELETE FROM recipes 
      WHERE p_id = ? AND m_id = ? AND purpose = ?
    `)
    return stmt.run(p_id, m_id, purpose)
  }

  // Get materials by type (RM or PM)
  getMaterialsByType(m_type) {
    const stmt = this.db.prepare(`
      SELECT * FROM materials 
      WHERE type = ? 
      ORDER BY name
    `)
    return stmt.all(m_type)
  }

  // Get all materials grouped by type
  getAllMaterialsGrouped() {
    const rmStmt = this.db.prepare(`
      SELECT * FROM materials 
      WHERE type = 'RM' 
      ORDER BY name
    `)
    const pmStmt = this.db.prepare(`
      SELECT * FROM materials 
      WHERE type = 'PM' 
      ORDER BY name
    `)

    return {
      RM: rmStmt.all(),
      PM: pmStmt.all()
    }
  }

  // Check if material exists in recipe
  checkMaterialInRecipe(p_id, m_id) {
    const stmt = this.db.prepare(`
      SELECT * FROM recipes 
      WHERE p_id = ? AND m_id = ?
    `)
    const result = stmt.get(p_id, m_id)
    return result ? result : null
  }

  // Get recipe summary for a product
  getRecipeSummary(p_id) {
    const stmt = this.db.prepare(`
      SELECT 
        purpose,
        COUNT(*) as material_count,
        SUM(quantity) as total_quantity
      FROM recipes 
      WHERE p_id = ?
      GROUP BY purpose
    `)
    return stmt.all(p_id)
  }

  // Import Recipe
  importProductRecipe(productCode, recipeData) {
    const { rm, carton_rm, pm, carton_pm } = recipeData

    // Start transaction for batch operations
    const transaction = this.db.transaction(() => {
      try {
        // First, get the product by code to get its ID
        const productStmt = this.db.prepare('SELECT id FROM products WHERE code = ?')
        const product = productStmt.get(productCode)

        if (!product) {
          throw new Error(`Product with code "${productCode}" not found in database`)
        }

        const productId = product.id

        // Get all materials with their codes for lookup
        const materialMap = new Map()
        const materialStmt = this.db.prepare('SELECT id, code FROM materials')
        const materials = materialStmt.all()

        materials.forEach((material) => {
          materialMap.set(material.code, material.id)
        })

        // Delete existing recipes for this product
        const deleteStmt = this.db.prepare('DELETE FROM recipes WHERE p_id = ?')
        deleteStmt.run(productId)

        // Helper function to insert recipe with material code lookup
        const insertRecipe = (materialsArray, purpose, m_type) => {
          if (!materialsArray || materialsArray.length === 0) return

          const stmt = this.db.prepare(`
          INSERT INTO recipes (p_id, m_id, quantity, purpose, m_type)
          VALUES (?, ?, ?, ?, ?)
        `)

          let insertedCount = 0
          let skippedCount = 0

          materialsArray.forEach((material) => {
            if (material.id && material.qty !== undefined) {
              // Get material id from code
              const materialId = materialMap.get(material.id)

              if (!materialId) {
                console.warn(`Material with code "${material.id}" not found in database. Skipping.`)
                skippedCount++
                return
              }

              try {
                stmt.run(productId, materialId, parseFloat(material.qty) || 0, purpose, m_type)
                insertedCount++
              } catch (insertError) {
                // Handle unique constraint violation
                if (insertError.message.includes('UNIQUE')) {
                  console.warn(`Duplicate material ${material.id} for ${purpose}. Skipping.`)
                  skippedCount++
                } else {
                  console.error(`Error inserting material ${material.id}:`, insertError)
                  throw insertError
                }
              }
            }
          })

          console.log(
            `Inserted ${insertedCount} ${m_type} materials for ${purpose}, skipped ${skippedCount}`
          )
          return insertedCount
        }

        // Insert all material types
        const rmInserted = insertRecipe(rm, 'batch', 'RM')
        const cartonRmInserted = insertRecipe(carton_rm, 'carton', 'RM')
        const pmInserted = insertRecipe(pm, 'batch', 'PM')
        const cartonPmInserted = insertRecipe(carton_pm, 'carton', 'PM')

        const totalInserted = rmInserted + cartonRmInserted + pmInserted + cartonPmInserted

        return {
          success: true,
          message: `Recipe imported successfully for product ${productCode}. ${totalInserted} materials added.`,
          details: {
            productId,
            productCode,
            rmInserted,
            cartonRmInserted,
            pmInserted,
            cartonPmInserted,
            totalInserted
          }
        }
      } catch (error) {
        console.error('Error in importProductRecipe transaction:', error)
        throw error
      }
    })

    return transaction()
  }

  // Check if product exists
  checkProductExists(productCode) {
    const stmt = this.db.prepare('SELECT id FROM products WHERE code = ?')
    return stmt.get(productCode)
  }

  // Search materials by code or name
  searchMaterials(searchTerm) {
    const stmt = this.db.prepare(`
      SELECT * FROM materials 
      WHERE code LIKE ? OR name LIKE ? 
      ORDER BY name
      LIMIT 50
    `)
    const searchPattern = `%${searchTerm}%`
    return stmt.all(searchPattern, searchPattern)
  }

  // Get materials by IDs
  getMaterialsByIds(materialIds) {
    if (!materialIds.length) return []

    const placeholders = materialIds.map(() => '?').join(',')
    const stmt = this.db.prepare(`
      SELECT * FROM materials 
      WHERE id IN (${placeholders})
      ORDER BY name
    `)
    return stmt.all(...materialIds)
  }

  // Bulk insert recipes
  bulkInsertRecipes(recipes) {
    const insertStmt = this.db.prepare(`
      INSERT OR REPLACE INTO recipes (p_id, m_id, quantity, purpose, m_type)
      VALUES (?, ?, ?, ?, ?)
    `)

    const transaction = this.db.transaction(() => {
      recipes.forEach((recipe) => {
        insertStmt.run(recipe.p_id, recipe.m_id, recipe.quantity, recipe.purpose, recipe.m_type)
      })
    })

    return transaction()
  }

  // Get product recipes in import format
  getProductRecipesForImport(p_id) {
    const stmt = this.db.prepare(`
      SELECT 
        r.*,
        m.name as material_name,
        m.code as material_code,
        m.unit as material_unit,
        m.type as material_type,
        p.name as product_name
      FROM recipes r
      LEFT JOIN materials m ON r.m_id = m.id
      LEFT JOIN products p ON r.p_id = p.id
      WHERE r.p_id = ?
      ORDER BY r.purpose, m.type, m.name
    `)
    return stmt.all(p_id)
  }

  // Reports Methods
  getMonthlyProductionSummary(year, month) {
    try {
      year = parseInt(year)
      month = parseInt(month)

      const formattedMonth = month.toString().padStart(2, '0')
      const startDate = `${year}-${formattedMonth}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${formattedMonth}-${lastDay.toString().padStart(2, '0')}`

      // Section-wise summary with monthly prices
      const sectionSummaryQuery = `
        SELECT 
          s.id as section_id,
          s.name as section_name,
          COUNT(DISTINCT p.id) as total_products,
          SUM(dp.batch) as total_batch,
          SUM(dp.carton) as total_carton,
          SUM(dp.carton * COALESCE(mp.price, p.base_price)) as total_value
        FROM sections s
        LEFT JOIN products p ON s.id = p.s_id
        LEFT JOIN daily_production dp ON p.id = dp.p_id AND dp.date BETWEEN ? AND ?
        LEFT JOIN monthly_prices mp ON p.id = mp.p_id AND mp.year = ? AND mp.month = ?
        GROUP BY s.id, s.name
        ORDER BY total_value DESC
      `

      const sectionWiseData = this.db
        .prepare(sectionSummaryQuery)
        .all(startDate, endDate, year, month)

      // Daily summary with monthly prices
      const dailySummaryQuery = `
        SELECT 
          dp.date,
          COUNT(DISTINCT p.id) as total_products,
          SUM(dp.batch) as total_batch,
          SUM(dp.carton) as total_carton,
          SUM(dp.carton * COALESCE(mp.price, p.base_price)) as total_value
        FROM daily_production dp
        LEFT JOIN products p ON dp.p_id = p.id
        LEFT JOIN monthly_prices mp ON p.id = mp.p_id AND mp.year = ? AND mp.month = ?
        WHERE dp.date BETWEEN ? AND ?
        GROUP BY dp.date
        ORDER BY dp.date DESC
      `

      const dailySummary = this.db.prepare(dailySummaryQuery).all(year, month, startDate, endDate)

      // Calculate totals
      const monthlyTotal = sectionWiseData.reduce(
        (sum, section) => sum + (section.total_value || 0),
        0
      )
      const totalProducts = sectionWiseData.reduce(
        (sum, section) => sum + (section.total_products || 0),
        0
      )
      const workingDays = dailySummary.length

      return {
        year,
        month,
        month_name: new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' }),
        monthly_total: monthlyTotal,
        daily_average: workingDays > 0 ? monthlyTotal / workingDays : 0,
        total_products: totalProducts,
        working_days: workingDays,
        section_wise: sectionWiseData,
        daily_summary: dailySummary
      }
    } catch (error) {
      console.error('Error in getMonthlyProductionSummary:', error)
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
  }

  getYearlyProductionSummary(year) {
    try {
      year = parseInt(year)

      // Get monthly summaries
      const monthlySummaries = []
      let yearlyTotal = 0
      let bestMonthValue = 0
      let bestMonth = null
      let totalProducts = 0

      for (let month = 1; month <= 12; month++) {
        const summary = this.getMonthlyProductionSummary(year, month)
        monthlySummaries.push(summary)
        yearlyTotal += summary.monthly_total
        totalProducts += summary.total_products

        if (summary.monthly_total > bestMonthValue) {
          bestMonthValue = summary.monthly_total
          bestMonth = {
            month: month,
            month_name: new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' }),
            value: summary.monthly_total
          }
        }
      }

      return {
        year,
        yearly_total: yearlyTotal,
        monthly_average: yearlyTotal / 12,
        total_products: totalProducts,
        best_month: bestMonth,
        total_months: monthlySummaries.filter((m) => m.monthly_total > 0).length,
        monthly_summaries: monthlySummaries
      }
    } catch (error) {
      console.error('Error in getYearlyProductionSummary:', error)
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
  }

  getYearlyManpowerSummary(year) {
    try {
      year = parseInt(year)

      // Get all sections
      const sections = this.db.prepare('SELECT * FROM sections ORDER BY name').all()

      // Initialize result structure
      const result = {
        year: year,
        sections: sections,
        monthly_summary: [],
        section_summary: []
      }

      // Get monthly summary
      const monthlyQuery = `
        SELECT 
          strftime('%m', date) as month,
          SUM(mp_count) as total_manpower
        FROM daily_total_manpower
        WHERE strftime('%Y', date) = ?
        GROUP BY strftime('%m', date)
        ORDER BY month
      `

      const monthlyData = this.db.prepare(monthlyQuery).all(year.toString())

      // Format monthly summary
      result.monthly_summary = monthlyData.map((item) => ({
        month: parseInt(item.month),
        total_manpower: item.total_manpower || 0
      }))

      // Get section-wise monthly data
      const sectionMonthlyQuery = `
        SELECT 
          s.id as section_id,
          s.name as section_name,
          strftime('%m', dsm.date) as month,
          SUM(dsm.mp_count) as manpower
        FROM sections s
        LEFT JOIN daily_section_manpower dsm ON s.id = dsm.s_id 
          AND strftime('%Y', dsm.date) = ?
        GROUP BY s.id, strftime('%m', dsm.date)
        ORDER BY s.name, month
      `

      const sectionMonthlyData = this.db.prepare(sectionMonthlyQuery).all(year.toString())

      // Group section data
      const sectionsMap = new Map()

      sections.forEach((section) => {
        sectionsMap.set(section.id, {
          section_id: section.id,
          section_name: section.name,
          total_manpower: 0,
          monthly_data: []
        })
      })

      // Fill monthly data for each section
      sectionMonthlyData.forEach((item) => {
        const section = sectionsMap.get(item.section_id)
        if (section) {
          const monthData = {
            month: parseInt(item.month),
            manpower: item.manpower || 0
          }
          section.monthly_data.push(monthData)
          section.total_manpower += item.manpower || 0
        }
      })

      // Convert map to array
      result.section_summary = Array.from(sectionsMap.values())

      return result
    } catch (error) {
      console.error('Error in getYearlyManpowerSummary:', error)
      return {
        year: year,
        sections: [],
        monthly_summary: [],
        section_summary: []
      }
    }
  }

  getSectionManpowerDetails(year, month) {
    try {
      year = parseInt(year)
      month = parseInt(month)

      const formattedMonth = month.toString().padStart(2, '0')
      const startDate = `${year}-${formattedMonth}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${formattedMonth}-${lastDay.toString().padStart(2, '0')}`

      const query = `
        SELECT 
          s.id as section_id,
          s.name as section_name,
          COALESCE(SUM(dsm.mp_count), 0) as total_manpower,
          COUNT(DISTINCT dsm.date) as days_with_data,
          AVG(dsm.mp_count) as avg_daily_manpower
        FROM sections s
        LEFT JOIN daily_section_manpower dsm ON s.id = dsm.s_id 
          AND dsm.date BETWEEN ? AND ?
        GROUP BY s.id, s.name
        ORDER BY total_manpower DESC
      `

      return this.db.prepare(query).all(startDate, endDate)
    } catch (error) {
      console.error('Error in getSectionManpowerDetails:', error)
      return []
    }
  }

  formatDate() {
    const d = new Date()

    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()

    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const weekday = weekdays[d.getDay()]

    return `${day}-${month}-${year}-${weekday}-${Date.now()}`
  }
  async dbBackup() {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Backup Database',
        defaultPath: `production-history-backup-${this.formatDate()}.db`,
        filters: [{ name: 'SQLite Database', extensions: ['db'] }]
      })

      if (canceled || !filePath) {
        return { success: false, message: 'Backup cancelled' }
      }

      // 🔐 SAFE backup (DB open থাকলেও)
      this.db.prepare(`VACUUM INTO ?`).run(filePath)

      return { success: true, path: filePath }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  async dbRestore() {
    const { BrowserWindow } = require('electron')
    const mainWindow = BrowserWindow.getFocusedWindow()

    try {
      // First, get backup file
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Backup File',
        properties: ['openFile'],
        filters: [{ name: 'SQLite', extensions: ['db'] }]
      })

      if (canceled || !filePaths.length) {
        return { success: false, message: 'Cancelled' }
      }

      const backupPath = filePaths[0]

      // Validate backup file
      if (!fs.existsSync(backupPath)) {
        return { success: false, message: 'Backup file not found' }
      }

      // Confirm with user
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Confirm Restore',
        message: 'Database Restore',
        detail: 'This will replace all current data and restart the application. Continue?',
        buttons: ['Yes, Restore & Restart', 'Cancel'],
        defaultId: 1,
        cancelId: 1
      })

      if (response === 1) {
        return { success: false, message: 'Cancelled by user' }
      }

      // Close database connection properly
      if (this.db) {
        this.db.close()
        this.db = null
      }

      // Wait a moment to ensure file is unlocked
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Copy backup file to app data directory
      fs.copyFileSync(backupPath, this.dbPath)

      // Schedule actions to happen after restart
      // Set a flag in localStorage before restarting
      const localStoragePath = path.join(app.getPath('userData'), 'localStorage.json')

      // Read existing localStorage data or create new
      let localStorageData = {}
      if (fs.existsSync(localStoragePath)) {
        try {
          localStorageData = JSON.parse(fs.readFileSync(localStoragePath, 'utf8'))
        } catch (error) {
          console.warn('Could not read localStorage file:', error)
        }
      }

      // Set app_initialized to true for after restart
      localStorageData.app_initialized = true

      // Save to file
      fs.writeFileSync(localStoragePath, JSON.stringify(localStorageData, null, 2))

      // Give a success message
      setTimeout(() => {
        // Relaunch the application
        app.relaunch({
          args: process.argv.slice(1).concat(['--restored'])
        })
        app.exit(0)
      }, 1000)

      return {
        success: true,
        message: 'Database restored successfully! Application will restart in 1 second...'
      }
    } catch (error) {
      console.error('Restore error:', error)

      return {
        success: false,
        message: `Restore failed: ${error.message}`
      }
    }
  }

  close() {
    this.db.close()
  }
}

export default new DatabaseService()

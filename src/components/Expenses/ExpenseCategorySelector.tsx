import React, { useState, useEffect } from 'react'
import { useBuilding } from '../../contexts/BuildingContext'
import budgetCategoryMasterService from '../../services/budgetCategoryMasterService'
import { BudgetCategoryMaster } from '../../types'
import { Dropdown } from '../UI'

interface ExpenseCategorySelectorProps {
  value: string
  onChange: (category: string) => void
  required?: boolean
  placeholder?: string
  className?: string
  disabled?: boolean
  showError?: boolean
  errorMessage?: string
}

export const ExpenseCategorySelector: React.FC<ExpenseCategorySelectorProps> = ({
  value,
  onChange,
  required = false,
  placeholder = 'Select category...',
  className = '',
  disabled = false,
  showError = false,
  errorMessage = 'Category is required'
}) => {
  const { selectedBuildingId } = useBuilding()
  const [categories, setCategories] = useState<BudgetCategoryMaster[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [selectedBuildingId])

  const loadCategories = async () => {
    if (!selectedBuildingId) {
      setCategories([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const categoryMasters = await budgetCategoryMasterService.getBudgetCategoryMasters(selectedBuildingId)
      setCategories(categoryMasters)
    } catch (error) {
      console.error('Error loading budget categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions = categories.map(cat => ({
    value: cat.name,
    label: cat.name,
    description: cat.description
  }))

  if (loading) {
    return (
      <div className={className}>
        <div className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50 text-sm text-neutral-500">
          Loading categories...
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className={className}>
        <div className="w-full px-3 py-2 border border-yellow-300 bg-yellow-50 rounded-md text-sm text-yellow-800">
          No budget categories available. Please create budget categories first.
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <Dropdown
        options={categoryOptions}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full"
      />
      {showError && !value && required && (
        <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
      )}
    </div>
  )
}

export default ExpenseCategorySelector

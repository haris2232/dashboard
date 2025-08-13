"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { settingsAPI } from './api'

interface CurrencyContextType {
  currency: string
  setCurrency: (currency: string) => void
  formatPrice: (amount: number) => string
  getCurrencySymbol: () => string
  refreshCurrency: () => Promise<void>
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>('USD')

  // Load currency from localStorage and sync with admin settings
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        // First try to get from localStorage
        const savedCurrency = localStorage.getItem('admin_currency')
        if (savedCurrency) {
          setCurrencyState(savedCurrency)
        }

        // Then sync with backend settings
        const settings = await settingsAPI.getSettings()
        if (settings.data.currency) {
          setCurrencyState(settings.data.currency)
          localStorage.setItem('admin_currency', settings.data.currency)
        }
      } catch (error) {
        console.error('Failed to sync currency with admin settings:', error)
      }
    }

    loadCurrency()
    
    // Refresh currency every 30 seconds
    const interval = setInterval(loadCurrency, 30000)
    return () => clearInterval(interval)
  }, [])

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency)
    localStorage.setItem('admin_currency', newCurrency)
  }

  const refreshCurrency = async () => {
    try {
      const settings = await settingsAPI.getSettings()
      if (settings.data.currency) {
        setCurrencyState(settings.data.currency)
        localStorage.setItem('admin_currency', settings.data.currency)
      }
    } catch (error) {
      console.error('Failed to refresh currency:', error)
    }
  }

  const formatPrice = (amount: number): string => {
    if (currency === 'AED') {
      return new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED',
      }).format(amount)
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)
    }
  }

  const getCurrencySymbol = (): string => {
    return currency === 'AED' ? 'AED' : '$'
  }

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      formatPrice,
      getCurrencySymbol,
      refreshCurrency
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
} 
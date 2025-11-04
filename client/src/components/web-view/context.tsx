import React, { createContext, useState, ReactNode } from 'react'

// Define the type for the context
interface WebViewContextType {
  url: string
  setUrl: (newUrl: string) => void
}

// Create the context
export const WebViewContext = createContext<WebViewContextType | null>(null)

// Create the provider component
export const WebViewProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [url, setUrl] = useState<string>('http://localhost:8080')

  return (
    <WebViewContext.Provider value={{ url, setUrl }}>
      {children}
    </WebViewContext.Provider>
  )
}

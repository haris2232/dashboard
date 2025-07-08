"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { DashboardContent } from "@/components/dashboard-content"

export function DashboardLayout() {
  const [activeSection, setActiveSection] = useState("dashboard")

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <DashboardContent activeSection={activeSection} />
        </main>
      </div>
    </div>
  )
}

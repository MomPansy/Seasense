import { useState } from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'

import { Header } from '../components/Header'
import { Toaster } from '../components/ui/sonner'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const [activeTab, setActiveTab] = useState<'arriving' | 'profiling'>('arriving')

  return (
    <>
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'arriving' ? (
        <Outlet />
      ) : (
        <main className="px-8 py-6">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-4">
              <h2>Vessel Risk Profiling</h2>
              <p className="text-muted-foreground">
                This feature is coming soon. Stay tuned for comprehensive vessel risk analysis.
              </p>
            </div>
          </div>
        </main>
      )}
      <Toaster />
    </>
  )
}

import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import MobileMenu from './MobileMenu'

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-black">
      <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="flex">
        <Sidebar />
        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <main className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 lg:ml-64 mt-16 pb-16 sm:pb-6 overflow-x-hidden w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  )
}

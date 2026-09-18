import { Navbar } from '@/components/Navbar'
import { TechSpinWheel } from '@/components/techspin/TechSpinWheel'

export default function TechSpinPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <TechSpinWheel />
    </div>
  )
}
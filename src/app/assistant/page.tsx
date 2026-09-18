import { Navbar } from '@/components/Navbar'
import { FindMyTechWizard } from '@/components/assistant/FindMyTechWizard'

export default function FindMyTechPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <FindMyTechWizard />
    </div>
  )
}
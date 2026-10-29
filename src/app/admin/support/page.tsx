import { redirect } from 'next/navigation'

export default function LegacyAdminSupportRedirect() {
  redirect('/admin/support-desk')
}
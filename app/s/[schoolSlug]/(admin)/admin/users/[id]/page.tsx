import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { updateUserInfo } from '@/app/actions/admin'
import { resolveTenantBySlug } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SubmitButton from '@/components/ui/SubmitButton'

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ schoolSlug: string; id: string }>
}) {
  const { schoolSlug, id } = await params
  const tenant = await resolveTenantBySlug(schoolSlug)
  await requireAdmin(tenant.id)
  const backPath = `/s/${schoolSlug}/admin/users`

  // Cross-tenant guard: admin of Sage shouldn't be able to edit an
  // Oakwood user by guessing their URL. Scope to tenant.id.
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .eq('school_id', tenant.id)
    .single()
  if (!user) redirect(backPath)

  async function handleUpdate(formData: FormData) {
    'use server'
    const fullName = formData.get('fullName') as string
    const graduatingYear = parseInt(formData.get('graduatingYear') as string)
    await updateUserInfo(id, fullName, graduatingYear)
    redirect(backPath)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i)

  return (
    <div className="p-8 max-w-md">
      <div className="mb-6">
        <Link href={backPath} className="text-white/40 hover:text-white/70 text-sm transition-colors">
          ← Back to Users
        </Link>
      </div>

      <h1 className="text-xl font-bold text-white mb-6">Edit User</h1>

      <form action={handleUpdate} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/50 font-medium">Full Name</label>
          <input
            name="fullName"
            defaultValue={user.full_name}
            required
            className="glass-input rounded-xl px-4 py-2.5 text-sm text-white"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/50 font-medium">Graduating Year</label>
          <select
            name="graduatingYear"
            defaultValue={user.graduating_year}
            required
            className="glass-input rounded-xl px-4 py-2.5 text-sm text-white"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/50 font-medium">Email</label>
          <input
            value={user.email}
            disabled
            className="glass-input rounded-xl px-4 py-2.5 text-sm text-white/30 cursor-not-allowed"
          />
          <span className="text-xs text-white/25">Email cannot be changed here</span>
        </div>

        <SubmitButton
          pendingLabel="Saving..."
          className="mt-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-70 disabled:cursor-wait text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          Save Changes
        </SubmitButton>
      </form>
    </div>
  )
}

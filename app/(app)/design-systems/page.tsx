import { createClient } from '@/lib/supabase/server'
import { DesignSystemsClientWrapper } from './client-wrapper'
import type { DesignSystem } from '@/lib/types'

export default async function DesignSystemsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('design_systems')
    .select('*')
    .order('created_at', { ascending: false })

  return <DesignSystemsClientWrapper designSystems={(data ?? []) as DesignSystem[]} />
}

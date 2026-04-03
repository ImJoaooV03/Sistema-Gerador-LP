import { createClient } from '@/lib/supabase/server'
import { ReferenciasClientWrapper } from './client-wrapper'
import type { Referencia } from '@/lib/types'

export default async function ReferenciasPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('referencias')
    .select('*')
    .order('created_at', { ascending: false })

  return <ReferenciasClientWrapper referencias={(data ?? []) as Referencia[]} />
}

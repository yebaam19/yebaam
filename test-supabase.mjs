import { createClient } from '@supabase/supabase-js'

const client = createClient(
  'https://hwppwxavvamnljfcanje.supabase.co',
  'sb_publishable_KRaWP8nsLMb28ry6A4xkDw_MLnqNpiA'
)

const { data, error } = await client.rpc('get_businesses', { p_limit: 1 })

if (error) {
  console.log('❌ Error:', error.message)
} else {
  console.log('✅ Conectado. Función get_businesses funcionando.')
  console.log('Resultado:', data)
}

import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data: u } = await sb.from('tutor_messages').select('id,metadata,created_at').eq('role','user').order('created_at',{ascending:false}).limit(5)
  console.log('--- últimas 5 user msgs metadata ---')
  u?.forEach(m => console.log(m.created_at.slice(0,16), JSON.stringify(m.metadata)))

  const { data: c } = await sb.from('conversations').select('id,title,updated_at').order('updated_at',{ascending:false}).limit(10)
  console.log('\n--- últimas 10 conversations title ---')
  c?.forEach(x => console.log(x.updated_at.slice(0,16), JSON.stringify(x.title)))
}
main().catch(console.error)

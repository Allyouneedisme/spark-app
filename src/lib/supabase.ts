import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://xunldsswljcsyxzujade.supabase.co"
const supabaseKey = "sb_publishable_QLKC4FoSrVEKNAh72ByQHQ_UUUnZbrE"

export const supabase = createClient(supabaseUrl, supabaseKey)
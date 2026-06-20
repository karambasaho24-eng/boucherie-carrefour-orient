import { supabase } from './supabaseClient'

// ---------- PRODUCTS ----------
export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchAvailableProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_available', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createProduct(product) {
  const { data, error } = await supabase.from('products').insert(product).select().single()
  if (error) throw error
  return data
}

export async function updateProduct(id, updates) {
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function uploadProductImage(file) {
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('product-images').upload(fileName, file)
  if (error) throw error
  const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
  return data.publicUrl
}

// ---------- ORDERS ----------
export async function createOrder(order) {
  const { data, error } = await supabase.from('orders').insert(order).select().single()
  if (error) throw error
  return data
}

export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateOrderStatus(id, status) {
  const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ---------- SITE CONFIG ----------
export async function fetchSiteConfig() {
  const { data, error } = await supabase.from('site_config').select('*').eq('id', 1).single()
  if (error) throw error
  return data
}

export async function updateSiteConfig(updates) {
  const { data, error } = await supabase.from('site_config').update(updates).eq('id', 1).select().single()
  if (error) throw error
  return data
}

export async function uploadSiteImage(file) {
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('site-images').upload(fileName, file)
  if (error) throw error
  const { data } = supabase.storage.from('site-images').getPublicUrl(fileName)
  return data.publicUrl
}

// ---------- AUTH ----------
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentProfile() {
  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData?.session?.user
  if (!user) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (error) throw error
  return { ...data, email: user.email }
}

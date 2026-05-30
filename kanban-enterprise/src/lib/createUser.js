/**
 * Creates a new user without affecting the current admin session.
 * Uses a separate fetch call to Supabase Auth API.
 */
export async function createUserWithoutSessionChange(email, password, metadata, supabaseUrl, anonKey) {
  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      email,
      password,
      data: metadata,
      gotrue_meta_security: {},
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    const msg = result.msg || result.error_description || result.message || JSON.stringify(result)
    throw new Error(msg)
  }

  // Extract user ID - handle both response formats
  const userId = result.id || result.user?.id
  if (!userId) {
    throw new Error('Usuário criado mas ID não retornado. Verifique em Authentication > Users.')
  }

  return userId
}

export const alfaConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  storageBucket: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'product-images',
  adminUserId:
    process.env.NEXT_PUBLIC_ADMIN_USER_ID ?? 'fe5ad7ae-1303-4bf2-bbf9-1ac266687d99',
};

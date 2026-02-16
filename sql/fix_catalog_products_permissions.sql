-- Enable RLS on catalog_products
ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;

-- 1. Policy for SELECT (Public)
DROP POLICY IF EXISTS "Public can view catalog products" ON catalog_products;
CREATE POLICY "Public can view catalog products"
ON catalog_products FOR SELECT
USING (true);

-- 2. Policy for INSERT (Owners)
DROP POLICY IF EXISTS "Users can create their own products" ON catalog_products;
CREATE POLICY "Users can create their own products"
ON catalog_products FOR INSERT
WITH CHECK (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- 3. Policy for UPDATE (Owners)
DROP POLICY IF EXISTS "Users can update their own products" ON catalog_products;
CREATE POLICY "Users can update their own products"
ON catalog_products FOR UPDATE
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- 4. Policy for DELETE (Owners)
DROP POLICY IF EXISTS "Users can delete their own products" ON catalog_products;
CREATE POLICY "Users can delete their own products"
ON catalog_products FOR DELETE
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

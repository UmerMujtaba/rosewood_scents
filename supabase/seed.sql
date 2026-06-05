-- =============================================
-- Rosewood Scents — Seed Data
-- Run AFTER schema.sql in Supabase SQL Editor
-- =============================================

-- Categories
insert into categories (name, slug, description) values
  ('Floral', 'floral', 'Bouquets of blooming flowers'),
  ('Woody', 'woody', 'Rich, earthy, forest-inspired scents'),
  ('Oriental', 'oriental', 'Warm, exotic, spiced fragrances'),
  ('Fresh', 'fresh', 'Clean, airy, light compositions'),
  ('Citrus', 'citrus', 'Bright, zesty, energizing notes'),
  ('Gourmand', 'gourmand', 'Sweet, edible-inspired accords')
on conflict (slug) do nothing;

-- Scent Notes
insert into scent_notes (name, note_type) values
  ('Bergamot', 'top'), ('Lemon', 'top'), ('Pink Pepper', 'top'), ('Grapefruit', 'top'),
  ('Cardamom', 'top'), ('Mandarin', 'top'), ('Neroli', 'top'), ('Aldehydes', 'top'),
  ('Rose', 'middle'), ('Jasmine', 'middle'), ('Iris', 'middle'), ('Oud', 'middle'),
  ('Sandalwood', 'middle'), ('Vetiver', 'middle'), ('Peony', 'middle'), ('Ylang Ylang', 'middle'),
  ('Amber', 'base'), ('Musk', 'base'), ('Vanilla', 'base'), ('Cedarwood', 'base'),
  ('Patchouli', 'base'), ('Benzoin', 'base'), ('Labdanum', 'base'), ('Tonka Bean', 'base');

-- Perfumes
insert into perfumes (name, slug, description, price, image_url, stock_quantity, is_featured) values
  (
    'Midnight Oud', 'midnight-oud',
    'A mysterious evening fragrance built around precious oud wood, deepened by amber and dark rose. An olfactory journey through the ancient spice routes.',
    285.00, 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=800', 24, true
  ),
  (
    'Rose Elixir', 'rose-elixir',
    'The purest expression of the Damascene rose, captured at dawn and woven with soft musk and warm sandalwood. Timeless femininity.',
    195.00, 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800', 42, true
  ),
  (
    'Cedarwood Noir', 'cedarwood-noir',
    'A bold, architectural fragrance for those who command attention. Atlas cedarwood, smoky vetiver, and a whisper of bergamot.',
    165.00, 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800', 35, true
  ),
  (
    'Saffron Dreams', 'saffron-dreams',
    'Opulent saffron woven with creamy rose and a base of warm leather and vanilla. A fragrance that tells stories of ancient courts.',
    310.00, 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800', 18, true
  ),
  (
    'Citrus Grove', 'citrus-grove',
    'Sun-drenched lemon groves on the Amalfi coast. Fresh bergamot, neroli blossom, and a clean white musk finale.',
    145.00, 'https://images.unsplash.com/photo-1547483238-f400e65ccd56?w=800', 52, false
  ),
  (
    'Patchouli Reverie', 'patchouli-reverie',
    'Dark, earthy patchouli balanced with sweet tonka bean and a heart of iris. A bohemian masterpiece.',
    175.00, 'https://images.unsplash.com/photo-1544376798-89aa6b09e1b0?w=800', 28, false
  ),
  (
    'Vanilla Amber', 'vanilla-amber',
    'A warm, gourmand embrace of Madagascar vanilla absolute, golden amber, and a touch of pink pepper for intrigue.',
    155.00, 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800', 39, false
  ),
  (
    'White Iris', 'white-iris',
    'Powdery iris root meets crisp violet leaf and a sandalwood heart. An elegant, minimalist statement.',
    225.00, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800', 21, false
  );

-- Perfume ↔ Category links
with p as (select id, slug from perfumes), c as (select id, slug from categories)
insert into perfume_categories (perfume_id, category_id)
select p.id, c.id from p, c where
  (p.slug = 'midnight-oud' and c.slug in ('oriental', 'woody')) or
  (p.slug = 'rose-elixir' and c.slug in ('floral', 'oriental')) or
  (p.slug = 'cedarwood-noir' and c.slug in ('woody', 'fresh')) or
  (p.slug = 'saffron-dreams' and c.slug in ('oriental')) or
  (p.slug = 'citrus-grove' and c.slug in ('citrus', 'fresh')) or
  (p.slug = 'patchouli-reverie' and c.slug in ('woody', 'oriental')) or
  (p.slug = 'vanilla-amber' and c.slug in ('gourmand', 'oriental')) or
  (p.slug = 'white-iris' and c.slug in ('floral', 'fresh'))
on conflict do nothing;

-- Perfume ↔ Scent Note links
with p as (select id, slug from perfumes), n as (select id, name from scent_notes)
insert into perfume_notes (perfume_id, note_id)
select p.id, n.id from p, n where
  (p.slug = 'midnight-oud' and n.name in ('Cardamom', 'Pink Pepper', 'Rose', 'Oud', 'Amber', 'Patchouli')) or
  (p.slug = 'rose-elixir' and n.name in ('Bergamot', 'Neroli', 'Rose', 'Peony', 'Sandalwood', 'Musk')) or
  (p.slug = 'cedarwood-noir' and n.name in ('Bergamot', 'Iris', 'Vetiver', 'Cedarwood', 'Patchouli')) or
  (p.slug = 'saffron-dreams' and n.name in ('Pink Pepper', 'Rose', 'Oud', 'Amber', 'Vanilla', 'Labdanum')) or
  (p.slug = 'citrus-grove' and n.name in ('Lemon', 'Grapefruit', 'Neroli', 'Peony', 'Musk', 'Benzoin')) or
  (p.slug = 'patchouli-reverie' and n.name in ('Bergamot', 'Iris', 'Ylang Ylang', 'Patchouli', 'Tonka Bean', 'Vanilla')) or
  (p.slug = 'vanilla-amber' and n.name in ('Pink Pepper', 'Cardamom', 'Jasmine', 'Amber', 'Vanilla', 'Musk')) or
  (p.slug = 'white-iris' and n.name in ('Aldehydes', 'Iris', 'Peony', 'Sandalwood', 'Musk', 'Benzoin'))
on conflict do nothing;

-- Set admin role: update your user's profile after registering
-- UPDATE profiles SET role = 'admin' WHERE id = 'your-user-uuid';

export const mensCollections = [
  { name: 'Shirts', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=85' },
  { name: 'Jeans', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=85' },
  { name: 'Trousers', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=85' },
  { name: 'T-shirts', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85' },
  { name: 'Kurtas', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85' },
  { name: 'Dhotis', image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=85' },
  { name: 'Inners', image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=85' },
  { name: 'Boys Collections', image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=900&q=85' },
  { name: 'All Products', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=85' },
]

export const womensCollections = [
  { name: 'Sarees', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85' },
  { name: 'Kurtis', image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85' },
  { name: 'Dresses', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85' },
  { name: 'Tops', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=85' },
  { name: 'Jeans', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85' },
  { name: 'Chudidars', image: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=900&q=85' },
  { name: 'Inners', image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=900&q=85' },
  { name: 'Girls Collections', image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=900&q=85' },
  { name: 'All Products', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85' },
]

const collectionMatchers = {
  Men: {
    Shirts: /shirt|collar/i,
    Jeans: /jean|denim/i,
    Trousers: /trouser|pant/i,
    'T-shirts': /t-shirt|tee|polo/i,
    Kurtas: /kurta/i,
    Dhotis: /dhoti/i,
    Inners: /inner|brief|vest/i,
    'Boys Collections': /boy|junior/i,
  },
  Women: {
    Sarees: /saree/i,
    Kurtis: /kurti|kurta|co-ord/i,
    Dresses: /dress/i,
    Tops: /top|shirt|blouse/i,
    Jeans: /jean|denim/i,
    Chudidars: /chudidar|salwar|trouser/i,
    Inners: /inner|bra|lingerie/i,
    'Girls Collections': /girl|junior/i,
  },
}

export function matchesCollection(product, audience, type) {
  if (product.category !== audience) return false
  if (type === 'All Products') return true
  return collectionMatchers[audience]?.[type]?.test(`${product.name} ${product.description || ''}`) || false
}
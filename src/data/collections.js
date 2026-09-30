import boysCollectionsImage from '../assets/collections/boys-collections.jpg'
import girlsCollectionsImage from '../assets/collections/girls-collections.jpg'
import mensAllProductsImage from '../assets/collections/mens-all-products.jpg'
import mensDhotisImage from '../assets/collections/mens-dhotis.jpg'
import mensInnersImage from '../assets/collections/mens-inners.jpg'
import mensJeansImage from '../assets/collections/mens-jeans.jpg'
import mensKurtasImage from '../assets/collections/mens-kurtas.jpg'
import mensShirtsImage from '../assets/collections/mens-shirts.jpg'
import mensTrousersImage from '../assets/collections/mens-trousers.jpg'
import mensTshirtsImage from '../assets/collections/mens-tshirts.jpg'
import womensAllProductsImage from '../assets/collections/womens-all-products.jpg'
import womensChudidarsImage from '../assets/collections/womens-chudidars.jpg'
import womensDressesLehengasImage from '../assets/collections/womens-dresses-lehengas.jpg'
import womensInnersImage from '../assets/collections/womens-inners.jpg'
import womensJeansImage from '../assets/collections/womens-jeans.jpg'
import womensKurtisImage from '../assets/collections/womens-kurtis.jpg'
import womensLehengasImage from '../assets/collections/womens-lehengas.webp'
import womensSareesImage from '../assets/collections/womens-sarees.png'
import womensTopsImage from '../assets/collections/womens-tops.jpg'

export const mensCollections = [
  { name: 'Shirts', image: mensShirtsImage },
  { name: 'Jeans', image: mensJeansImage },
  { name: 'Trousers', image: mensTrousersImage },
  { name: 'T-shirts', image: mensTshirtsImage },
  { name: 'Kurtas', image: mensKurtasImage },
  { name: 'Dhotis', image: mensDhotisImage },
  { name: 'Inners', image: mensInnersImage },
  { name: 'Boys Collections', image: boysCollectionsImage },
  { name: 'All Products', image: mensAllProductsImage },
]

export const womensCollections = [
  { name: 'Sarees', image: womensSareesImage },
  { name: 'Lehengas', image: womensLehengasImage },
  { name: 'Kurtis', image: womensKurtisImage },
  { name: 'Dresses', image: womensDressesLehengasImage },
  { name: 'Tops', image: womensTopsImage },
  { name: 'Jeans', image: womensJeansImage },
  { name: 'Chudidars', image: womensChudidarsImage },
  { name: 'Inners', image: womensInnersImage },
  { name: 'Girls Collections', image: girlsCollectionsImage },
  { name: 'All Products', image: womensAllProductsImage },
]

export const kidsCollections = [
  { name: 'All Kids', image: boysCollectionsImage },
  { name: 'Boys Collections', image: boysCollectionsImage },
  { name: 'Girls Collections', image: girlsCollectionsImage },
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
    Lehengas: /lehenga|ghagra|chaniya/i,
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
  if (audience === 'Kids') {
    const productText = `${product.name} ${product.description || ''}`
    const boysItem = product.category === 'Boy-Kid' || (product.category === 'Men' && /boy|junior|kid|child/i.test(productText))
    const girlsItem = product.category === 'Girl-Kid' || (product.category === 'Women' && /girl|junior|kid|child/i.test(productText))
    if (type === 'Boys Collections') return boysItem
    if (type === 'Girls Collections') return girlsItem
    return type === 'All Kids' && (boysItem || girlsItem)
  }
  if (product.category !== audience) return false
  if (type === 'All Products') return true
  if (product.item_type) return product.item_type === type
  return collectionMatchers[audience]?.[type]?.test(`${product.name} ${product.description || ''}`) || false
}
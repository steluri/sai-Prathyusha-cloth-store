import { ArrowRight, Check, ChevronDown, Search, Sparkles, Truck } from 'lucide-react'
import { mensCollections, womensCollections } from '../data/collections'
import { ProductCard } from './StoreUI'

function CollectionTiles({ titleId, eyebrow, title, description, audience, collections, onOpenCollection }) {
  return <section className={`mens-collections${audience === 'Women' ? ' womens-collections' : ''}`} aria-labelledby={titleId}>
    <div className="mens-collections-heading">
      <div><p className="eyebrow">{eyebrow}</p><h2 id={titleId}>{title}</h2></div>
      <p>{description}</p>
    </div>
    <div className="mens-collection-grid">
      {collections.map(item => (
        <button className="mens-collection-card" key={item.name} onClick={() => onOpenCollection(audience, item.name)}>
          <span className="mens-collection-image"><img src={item.image} alt="" loading="lazy" /></span>
          <span>{item.name}<ArrowRight size={17} /></span>
        </button>
      ))}
    </div>
  </section>
}

export default function HomePage({
  collectionView,
  category,
  sort,
  loading,
  visibleProducts,
  cart,
  wishlist,
  onCategoryChange,
  onSortChange,
  onShopCategory,
  onOpenCollection,
  onOpenProduct,
  onToggleWishlist,
  onAddToCart,
  onChangeCartQuantity,
  onSubscribe,
}) {
  function submitNewsletter(event) {
    event.preventDefault()
    onSubscribe()
  }

  return <main id="top" className={`home-page${collectionView ? ' home-view-hidden' : ''}`}>
    <button className="festival-poster" type="button" onClick={() => onShopCategory('All')} aria-label="Explore the Dasara festive collection">
      <img src="/dasara-festival-poster.svg" alt="Dasara Festival: A season to dress beautifully. Explore festive styles for every gathering." />
    </button>

    <CollectionTiles
      titleId="womens-collections-title"
      eyebrow="Made for every moment"
      title="Womens Collections"
      description="From everyday favourites to festive silhouettes, discover styles selected for women and girls."
      audience="Women"
      collections={womensCollections}
      onOpenCollection={onOpenCollection}
    />
    <CollectionTiles
      titleId="mens-collections-title"
      eyebrow="Find your style"
      title="Mens Collections"
      description="Everyday essentials and traditional favourites, thoughtfully selected for men and boys."
      audience="Men"
      collections={mensCollections}
      onOpenCollection={onOpenCollection}
    />

    <section className="collection" id="shop">
      <div className="section-heading">
        <div><p className="eyebrow">Curated for now</p><h2>The new collection</h2></div>
        <p>Clean lines meet lived-in comfort. Discover pieces that work wherever the day takes you.</p>
      </div>
      <div className="toolbar">
        <div className="category-tabs">
          {['All', 'Women', 'Men'].map(item => <button key={item} className={category === item ? 'active' : ''} onClick={() => onCategoryChange(item)}>{item}</button>)}
        </div>
        <label className="sort">Sort by <select value={sort} onChange={event => onSortChange(event.target.value)}><option>Featured</option><option>Newest</option><option>Price: Low to high</option><option>Price: High to low</option></select><ChevronDown size={15} /></label>
      </div>
      {loading ? <div className="loading-grid">{Array.from({ length: 8 }).map((_, index) => <div className="skeleton" key={index} />)}</div> :
        visibleProducts.length ? <div className="product-grid">
          {visibleProducts.map(product => <ProductCard key={product.id} product={product} saved={wishlist.includes(product.id)} quantity={cart.find(item => item.id === product.id)?.quantity || 0} onOpen={() => onOpenProduct(product)} onSave={() => onToggleWishlist(product)} onAdd={() => onAddToCart(product)} onChangeQuantity={delta => onChangeCartQuantity(product.id, delta)} />)}
        </div> : <div className="empty-search"><Search size={28} /><h3>No pieces found</h3><p>Try a different search or category.</p></div>}
    </section>

    <section className="story">
      <div className="story-image"><div className="material-card"><span>01</span><strong>Natural fibres</strong><p>Breathable, tactile, enduring.</p></div></div>
      <div className="story-copy"><p className="eyebrow">Our point of view</p><h2>Made with intention.<br /><em>Worn with ease.</em></h2><p>We believe getting dressed should feel simple. That means considered silhouettes, honest materials, and a palette that moves effortlessly through your wardrobe.</p><button className="button outline" onClick={() => onShopCategory('All')}>Discover our story <ArrowRight size={17} /></button></div>
    </section>

    <section className="newsletter"><p className="eyebrow">Stay in the know</p><h2>Notes from the studio</h2><p>New arrivals, quiet inspiration, and 10% off your first order.</p><form onSubmit={submitNewsletter}><input type="email" required placeholder="Your email address" /><button aria-label="Subscribe"><ArrowRight /></button></form></section>
  </main>
}
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
  wishlist,
  onCategoryChange,
  onSortChange,
  onShopCategory,
  onOpenCollection,
  onToggleWishlist,
  onAddToCart,
  onSubscribe,
}) {
  function submitNewsletter(event) {
    event.preventDefault()
    onSubscribe()
  }

  return <main id="top" className={collectionView ? 'home-view-hidden' : ''}>
    <section className="hero">
      <img src="/atelier-hero.png" alt="Models wearing Pandu's warm neutral collection" />
      <div className="hero-copy">
        <p className="eyebrow">The September edit</p>
        <h1>Everyday,<br /><em>considered.</em></h1>
        <p>Natural textures, thoughtful shapes, and quietly confident pieces made to live in.</p>
        <div className="hero-buttons">
          <button className="button dark" onClick={() => onShopCategory('Women')}>Shop women <ArrowRight size={17} /></button>
          <button className="button text-button" onClick={() => onShopCategory('Men')}>Shop men <ArrowRight size={17} /></button>
        </div>
      </div>
      <div className="hero-note"><span>01</span><p>New forms<br />in soft focus</p></div>
    </section>

    <section className="values">
      <div><Sparkles size={22} /><p><strong>Considered design</strong><span>Fewer, better pieces for every day.</span></p></div>
      <div><Truck size={23} /><p><strong>Complimentary delivery</strong><span>On all orders over ₹2,999.</span></p></div>
      <div><Check size={22} /><p><strong>Easy returns</strong><span>14 days to change your mind.</span></p></div>
    </section>

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
          {visibleProducts.map(product => <ProductCard key={product.id} product={product} saved={wishlist.includes(product.id)} onSave={() => onToggleWishlist(product)} onAdd={() => onAddToCart(product)} />)}
        </div> : <div className="empty-search"><Search size={28} /><h3>No pieces found</h3><p>Try a different search or category.</p></div>}
    </section>

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

    <section className="story">
      <div className="story-image"><div className="material-card"><span>01</span><strong>Natural fibres</strong><p>Breathable, tactile, enduring.</p></div></div>
      <div className="story-copy"><p className="eyebrow">Our point of view</p><h2>Made with intention.<br /><em>Worn with ease.</em></h2><p>We believe getting dressed should feel simple. That means considered silhouettes, honest materials, and a palette that moves effortlessly through your wardrobe.</p><button className="button outline" onClick={() => onShopCategory('All')}>Discover our story <ArrowRight size={17} /></button></div>
    </section>

    <section className="newsletter"><p className="eyebrow">Stay in the know</p><h2>Notes from the studio</h2><p>New arrivals, quiet inspiration, and 10% off your first order.</p><form onSubmit={submitNewsletter}><input type="email" required placeholder="Your email address" /><button aria-label="Subscribe"><ArrowRight /></button></form></section>
  </main>
}
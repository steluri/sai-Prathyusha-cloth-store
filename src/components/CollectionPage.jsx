import { ArrowLeft, ChevronDown, Search } from 'lucide-react'
import { ProductCard } from './StoreUI'

export default function CollectionPage({
  collectionView,
  collectionTabs,
  collectionColors,
  collectionProducts,
  wishlist,
  loading,
  sort,
  minimumPrice,
  maximumPrice,
  selectedColor,
  saleOnly,
  onBack,
  onClearFilters,
  onMinimumPriceChange,
  onMaximumPriceChange,
  onColorSelect,
  onSaleOnlyChange,
  onSortChange,
  onOpenCollection,
  onToggleWishlist,
  onAddToCart,
}) {
  return <main className="collection-page">
    <div className="catalog-layout">
      <aside className="catalog-filters">
        <div className="filter-heading"><strong>Filters</strong><button onClick={onClearFilters}>Clear all</button></div>
        <div className="filter-section price-filter">
          <strong>Price</strong>
          <div className="price-track"><span /><span /></div>
          <div className="price-inputs">
            <label>Minimum<input type="number" min="0" value={minimumPrice} onChange={event => onMinimumPriceChange(event.target.value)} placeholder="₹0" /></label>
            <label>Maximum<input type="number" min="0" value={maximumPrice} onChange={event => onMaximumPriceChange(event.target.value)} placeholder="₹10000" /></label>
          </div>
        </div>
        <div className="filter-section">
          <strong>Color</strong>
          <div className="filter-options">
            {collectionColors.length
              ? collectionColors.map(color => <button className={selectedColor === color ? 'active' : ''} key={color} onClick={() => onColorSelect(selectedColor === color ? '' : color)}><span />{color}</button>)
              : <p>No colors available</p>}
          </div>
        </div>
        <div className="filter-section">
          <strong>Offers</strong>
          <label className="filter-check"><input type="checkbox" checked={saleOnly} onChange={event => onSaleOnlyChange(event.target.checked)} /> On sale</label>
        </div>
        <div className="filter-summary-row"><span>Gender</span><strong>{collectionView.audience}</strong></div>
        <div className="filter-summary-row"><span>Type</span><strong>{collectionView.type}</strong></div>
      </aside>

      <section className="catalog-results">
        <button className="collection-back" onClick={onBack}><ArrowLeft size={17} /> Back to home</button>
        <div className="shop-for">
          <strong>Shop for</strong>
          {['Women', 'Men'].map(audience => <button className={collectionView.audience === audience ? 'active' : ''} key={audience} onClick={() => onOpenCollection(audience, 'All Products')}>{audience}</button>)}
        </div>
        <div className="catalog-query-row">
          <p><strong>You searched for “{collectionView.type}”</strong><span>· {collectionProducts.length} products available</span></p>
          <label className="catalog-sort"><strong>Sort by</strong><span><select value={sort} onChange={event => onSortChange(event.target.value)}><option>Featured</option><option>Newest</option><option>Price: Low to high</option><option>Price: High to low</option></select><ChevronDown size={16} /></span></label>
        </div>
        <div className="collection-type-tabs" role="tablist" aria-label={`${collectionView.audience} collection types`}>
          {collectionTabs.map(item => <button role="tab" aria-selected={collectionView.type === item.name} className={collectionView.type === item.name ? 'active' : ''} key={item.name} onClick={() => onOpenCollection(collectionView.audience, item.name)}>{item.name}</button>)}
        </div>
        {loading ? <div className="loading-grid">{Array.from({ length: 8 }).map((_, index) => <div className="skeleton" key={index} />)}</div> :
          collectionProducts.length ? <div className="product-grid">
            {collectionProducts.map(product => <ProductCard key={product.id} product={product} saved={wishlist.includes(product.id)} onSave={() => onToggleWishlist(product)} onAdd={() => onAddToCart(product)} />)}
          </div> : <div className="empty-search"><Search size={28} /><h3>No products match these filters</h3><p>Clear the filters or choose another collection type.</p></div>}
      </section>
    </div>
  </main>
}
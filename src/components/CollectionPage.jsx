import { ChevronDown, Search, X } from 'lucide-react'
import { ProductCard } from './StoreUI'

export default function CollectionPage({
  collectionView,
  collectionTabs,
  collectionColors,
  collectionSizeGroups,
  collectionProducts,
  filtersOpen,
  onCloseFilters,
  cart,
  wishlist,
  loading,
  sort,
  minimumPrice,
  maximumPrice,
  selectedColor,
  selectedSize,
  saleOnly,
  onClearFilters,
  onMinimumPriceChange,
  onMaximumPriceChange,
  onColorSelect,
  onSizeSelect,
  onSaleOnlyChange,
  onSortChange,
  onOpenCollection,
  onOpenProduct,
  onToggleWishlist,
  onAddToCart,
  onChangeCartQuantity,
}) {
  return <main className="collection-page">
    <div className={`catalog-layout ${filtersOpen ? 'filters-open' : ''}`}>
      {filtersOpen && <button className="catalog-filter-scrim" aria-label="Close filter and sort options" onClick={onCloseFilters} />}
      <aside className={`catalog-filters ${filtersOpen ? 'open' : ''}`} hidden={!filtersOpen} role="dialog" aria-modal={filtersOpen} aria-labelledby="catalog-filter-title">
        <div className="filter-heading">
          <strong id="catalog-filter-title">Filter &amp; Sort</strong>
          <div className="filter-heading-actions">
            <button className="filter-clear" onClick={onClearFilters}>Clear all</button>
            <button className="filter-close" onClick={onCloseFilters} aria-label="Close filters"><X size={17} /></button>
          </div>
        </div>
        <label className="catalog-sort">
          <strong>Sort by</strong>
          <span><select value={sort} onChange={event => onSortChange(event.target.value)}><option>Featured</option><option>Newest</option><option>Price: Low to high</option><option>Price: High to low</option></select><ChevronDown size={16} /></span>
        </label>
        <div id="catalog-filter-controls">
          <div className="filter-section">
            <strong>Collection</strong>
            <div className="filter-options collection-quick-options">
              {collectionTabs.map(item => <button type="button" className={collectionView.type === item.name ? 'active' : ''} aria-pressed={collectionView.type === item.name} key={item.name} onClick={() => onOpenCollection(collectionView.audience, item.name)}>{item.name}</button>)}
            </div>
          </div>
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
              <strong>Size</strong>
              {collectionSizeGroups.length ? collectionSizeGroups.map(group => <div className="filter-size-group" key={group.label}>
                <span>{group.label}</span>
                <div className="filter-size-options">
                  {group.sizes.map(size => <button className={selectedSize === size ? 'active' : ''} key={size} onClick={() => onSizeSelect(selectedSize === size ? '' : size)}>{size}</button>)}
                </div>
              </div>) : <p className="filter-empty">No sizes available</p>}
            </div>
          <div className="filter-section">
            <strong>Offers</strong>
            <label className="filter-check"><input type="checkbox" checked={saleOnly} onChange={event => onSaleOnlyChange(event.target.checked)} /> On sale</label>
          </div>
          <label className="filter-select-row">
            <span>Gender</span>
            <select aria-label="Filter by gender" value={collectionView.audience === 'All' ? '' : collectionView.audience} onChange={event => {
              const audience = event.target.value
              onOpenCollection(audience, audience === 'Kids' ? 'All Kids' : 'All Products')
            }}>
              <option value="" disabled>Select gender</option>
              {['Women', 'Men', 'Kids'].map(audience => <option key={audience} value={audience}>{audience}</option>)}
            </select>
          </label>
          {collectionView.audience !== 'All' && <label className="filter-select-row">
            <span>Type</span>
            <select aria-label="Filter by collection type" value={collectionView.type} onChange={event => onOpenCollection(collectionView.audience, event.target.value)}>
              {collectionTabs.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
          </label>}
        </div>
      </aside>

      <section className="catalog-results">
        {loading ? <div className="loading-grid">{Array.from({ length: 8 }).map((_, index) => <div className="skeleton" key={index} />)}</div> :
          collectionProducts.length ? <div className="product-grid">
            {collectionProducts.map(product => <ProductCard key={product.id} product={product} saved={wishlist.includes(product.id)} quantity={cart.find(item => item.id === product.id)?.quantity || 0} onOpen={() => onOpenProduct(product)} onSave={() => onToggleWishlist(product)} onAdd={() => onAddToCart(product)} onChangeQuantity={delta => onChangeCartQuantity(product.id, delta)} />)}
          </div> : <div className="empty-search"><Search size={28} /><h3>No products match these filters</h3><p>Clear the filters or choose another collection type.</p></div>}
      </section>
    </div>
  </main>
}
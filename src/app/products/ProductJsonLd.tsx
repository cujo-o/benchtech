export function ProductJsonLd({ product }: { product: any }) {
  const sellerName = product.profiles?.business_name || 'BenchTech Merchant'
  const location = product.profiles?.district || 'Abuja, Nigeria'

  const conditionMap: Record<string, string> = {
    brand_new: 'https://schema.org/NewCondition',
    open_box: 'https://schema.org/OpenBoxCondition',
    refurbished: 'https://schema.org/RefurbishedCondition',
    used: 'https://schema.org/UsedCondition',
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images || [],
    description: product.description || `${product.title} available in Abuja`,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Electronics',
    },
    itemCondition: conditionMap[product.condition] || 'https://schema.org/UsedCondition',
    offers: {
      '@type': 'Offer',
      url: `https://shopbenchtech.com/products/${product.id}`,
      priceCurrency: 'NGN',
      price: product.price,
      priceValidUntil: '2027-12-31',
      availability:
        product.status === 'published'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: sellerName,
        address: {
          '@type': 'PostalAddress',
          addressLocality: location,
          addressRegion: 'FCT',
          addressCountry: 'NG',
        },
      },
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
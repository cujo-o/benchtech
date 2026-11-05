export function resolveFirstImage(images: any): string | null {
  if (!images) return null
  if (Array.isArray(images)) return images[0] || null
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) return parsed[0] || null
    } catch {
      return images.startsWith('http') ? images : null
    }
  }
  return null
}

export interface HydratedOrderItem {
  id: string
  title: string
  price: number
  quantity: number
  condition: string
  brand: string
  model: string
  category: string
  image: string | null
  specs: Record<string, any>
  seller_id: string
  seller_name: string
  seller_district: string
  seller_verified: boolean
}

/**
 * Resolves all purchased products for an order from:
 * 1. order.order_items JSON column
 * 2. audit_events checkout manifest
 * 3. Primary order.product + automatic price-remainder matching for multi-item orders placed before manifest logging
 */
export function resolveOrderItemsForOrder(params: {
  order: any
  auditItems?: any[]
  allCatalogProducts: any[]
}): HydratedOrderItem[] {
  const { order, auditItems, allCatalogProducts } = params

  const catalogMap = new Map<string, any>()
  for (const p of allCatalogProducts || []) {
    catalogMap.set(p.id, p)
  }

  function formatFromCatalog(
    raw: any,
    fallbackSeller?: any
  ): HydratedOrderItem {
    const live = raw?.id ? catalogMap.get(raw.id) : null
    const source = live || raw || {}
    const sellerObj = Array.isArray(source.profiles)
      ? source.profiles[0]
      : source.profiles || fallbackSeller

    return {
      id: source.id || raw?.id || 'item',
      title: source.title || raw?.title || 'Hardware Device',
      price: Number(raw?.price ?? source.price ?? 0),
      quantity: Math.max(1, Number(raw?.quantity || 1)),
      condition: source.condition || raw?.condition || 'used',
      brand: source.brand || raw?.brand || '',
      model: source.model || source.specs?.model || raw?.model || '',
      category: source.category || raw?.category || 'hardware',
      image:
        resolveFirstImage(source.images) ||
        resolveFirstImage(raw?.images) ||
        raw?.image ||
        null,
      specs: { ...(source.specs || {}), ...(raw?.specs || {}) },
      seller_id:
        source.seller_id || raw?.seller_id || order.seller_id || '',
      seller_name:
        sellerObj?.business_name ||
        sellerObj?.full_name ||
        raw?.seller_name ||
        order.seller?.business_name ||
        order.seller?.full_name ||
        'Verified Store',
      seller_district:
        sellerObj?.district ||
        raw?.seller_district ||
        order.seller?.district ||
        'Abuja',
      seller_verified: sellerObj?.tech_trust_status === 'verified',
    }
  }

  // 1. Check explicit order_items or audit_events items
  const explicitRaw: any[] =
    Array.isArray(order.order_items) && order.order_items.length > 0
      ? order.order_items
      : Array.isArray(auditItems) && auditItems.length > 0
      ? auditItems
      : []

  if (explicitRaw.length > 0) {
    return explicitRaw.map((item) => formatFromCatalog(item, order.seller))
  }

  // 2. Fallback: start with primary product on order
  const items: HydratedOrderItem[] = []
  const primaryProd =
    order.product || (order.product_id ? catalogMap.get(order.product_id) : null)

  if (primaryProd) {
    items.push(formatFromCatalog(primaryProd, order.seller))
  }

  // 3. Reconstruct additional items if order total exceeds primary product price (e.g. SB20261030-2817: ₦447,500 = ₦395,000 Dell + ₦50,000 Asahiflex + ₦2,500 delivery)
  const orderGross = Number(order.total_amount || order.amount || 0)
  const primaryPrice = items[0]?.price || 0

  if (orderGross > primaryPrice && primaryPrice > 0) {
    // Possible hardware remainders (with ₦2,500 courier dispatch or ₦0 pickup)
    const remainderWithDelivery = orderGross - primaryPrice - 2500
    const remainderWithoutDelivery = orderGross - primaryPrice

    const otherProducts = (allCatalogProducts || []).filter(
      (p) => p.id !== items[0]?.id
    )

    for (const targetRem of [remainderWithDelivery, remainderWithoutDelivery]) {
      if (targetRem <= 0) continue

      // Exact single product match (or multiple quantity of a product)
      const exactMatch = otherProducts.find(
        (p) => Number(p.price) === targetRem
      )
      if (exactMatch) {
        items.push(formatFromCatalog(exactMatch))
        break
      }

      // Check 2-product combination match
      let foundPair = false
      for (let i = 0; i < otherProducts.length; i++) {
        for (let j = i + 1; j < otherProducts.length; j++) {
          if (
            Number(otherProducts[i].price) + Number(otherProducts[j].price) ===
            targetRem
          ) {
            items.push(formatFromCatalog(otherProducts[i]))
            items.push(formatFromCatalog(otherProducts[j]))
            foundPair = true
            break
          }
        }
        if (foundPair) break
      }
      if (foundPair) break
    }
  }

  return items
}
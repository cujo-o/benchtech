export interface SpecFieldDefinition {
  key: string
  label: string
  placeholder: string
}

export interface CategoryDefinition {
  slug: string
  label: string
  fields: SpecFieldDefinition[]
}

export const UNIVERSAL_SPEC_FIELDS: SpecFieldDefinition[] = [
  {
    key: 'warranty_period',
    label: 'Seller Warranty / Testing Window',
    placeholder: 'e.g. 7-Day Inspection + 30 Days Store Warranty',
  },
  {
    key: 'included_accessories',
    label: 'Included in Box / Accessories',
    placeholder: 'e.g. Original Charger, Box, Receipt, Cable',
  },
  {
    key: 'faults_or_notes',
    label: 'Cosmetic / Hardware Notes',
    placeholder: 'e.g. 100% clean, never repaired, Face ID working',
  },
]

export const PRODUCT_CATEGORIES: CategoryDefinition[] = [
  {
    slug: 'phones',
    label: 'Smartphones',
    fields: [
      { key: 'storage', label: 'Storage Capacity', placeholder: 'e.g. 256GB' },
      { key: 'ram', label: 'RAM', placeholder: 'e.g. 8GB' },
      { key: 'battery_health', label: 'Battery Health (%)', placeholder: 'e.g. 92%' },
      { key: 'screen_size', label: 'Display / Screen Size', placeholder: 'e.g. 6.7" Super Retina XDR OLED' },
      { key: 'processor', label: 'Processor / Chipset', placeholder: 'e.g. Apple A17 Pro / Snapdragon 8 Gen 3' },
      { key: 'sim_status', label: 'SIM & Network Lock Status', placeholder: 'e.g. Factory Unlocked (Physical + eSIM)' },
      { key: 'camera', label: 'Main Camera Specs', placeholder: 'e.g. 48MP + 12MP + 12MP' },
      { key: 'biometrics', label: 'Biometrics (Face ID / Touch ID)', placeholder: 'e.g. Face ID Active' },
    ],
  },
  {
    slug: 'laptops',
    label: 'Laptops & Workstations',
    fields: [
      { key: 'processor', label: 'Processor (CPU)', placeholder: 'e.g. Intel Core i7-13700H / Apple M3 Pro' },
      { key: 'ram', label: 'RAM Memory', placeholder: 'e.g. 16GB DDR5' },
      { key: 'storage', label: 'SSD / Storage', placeholder: 'e.g. 512GB NVMe SSD' },
      { key: 'gpu', label: 'Graphics Card (GPU)', placeholder: 'e.g. NVIDIA RTX 4060 8GB / Integrated' },
      { key: 'screen_size', label: 'Display Size & Resolution', placeholder: 'e.g. 15.6" FHD 144Hz / 14" Liquid Retina' },
      { key: 'battery_health', label: 'Battery Cycle / Health', placeholder: 'e.g. 88% (4-6 Hours Backup)' },
      { key: 'os', label: 'Operating System', placeholder: 'e.g. Windows 11 Pro / macOS Sequoia' },
      { key: 'keyboard_features', label: 'Keyboard & Ports', placeholder: 'e.g. Backlit Keyboard, Thunderbolt 4, HDMI' },
    ],
  },
  {
    slug: 'gaming',
    label: 'Gaming Consoles & Handhelds',
    fields: [
      { key: 'storage', label: 'Internal Storage', placeholder: 'e.g. 1TB Custom SSD' },
      { key: 'edition', label: 'Console Edition', placeholder: 'e.g. Disc Edition / Digital Slim / Pro' },
      { key: 'controllers', label: 'Controllers Included', placeholder: 'e.g. 2 Original DualSense Wireless Pads' },
      { key: 'max_resolution', label: 'Output Resolution & Frame Rate', placeholder: 'e.g. 4K @ 120Hz HDR' },
      { key: 'online_status', label: 'Online / PSN / Xbox Live Status', placeholder: 'e.g. 100% Unbanned, Online Ready' },
      { key: 'games_included', label: 'Games Included', placeholder: 'e.g. FC 25, GTA V, Spider-Man 2' },
    ],
  },
  {
    slug: 'monitors',
    label: 'Monitors & Displays',
    fields: [
      { key: 'screen_size', label: 'Screen Size', placeholder: 'e.g. 27 Inch' },
      { key: 'resolution', label: 'Resolution', placeholder: 'e.g. 2560 x 1440 (QHD) / 4K UHD' },
      { key: 'refresh_rate', label: 'Refresh Rate', placeholder: 'e.g. 165Hz / 75Hz' },
      { key: 'panel_type', label: 'Panel Type', placeholder: 'e.g. IPS / OLED / VA' },
      { key: 'ports', label: 'Input Ports', placeholder: 'e.g. 2x HDMI 2.1, DisplayPort, USB-C' },
    ],
  },
  {
    slug: 'tablets',
    label: 'Tablets & iPads',
    fields: [
      { key: 'storage', label: 'Storage Capacity', placeholder: 'e.g. 128GB / 256GB' },
      { key: 'ram', label: 'RAM / Chipset', placeholder: 'e.g. Apple M2 / 8GB RAM' },
      { key: 'screen_size', label: 'Screen Size', placeholder: 'e.g. 11" Liquid Retina / 12.9"' },
      { key: 'connectivity', label: 'Connectivity', placeholder: 'e.g. Wi-Fi + 5G Cellular' },
      { key: 'battery_health', label: 'Battery Health', placeholder: 'e.g. 95%' },
      { key: 'stylus_support', label: 'Stylus / Keyboard Support', placeholder: 'e.g. Apple Pencil 2 Supported' },
    ],
  },
  {
    slug: 'accessories',
    label: 'Audio & Tech Accessories',
    fields: [
      { key: 'accessory_type', label: 'Device Type', placeholder: 'e.g. Wireless Headphones / Mechanical Keyboard' },
      { key: 'connectivity', label: 'Connectivity', placeholder: 'e.g. Bluetooth 5.3 / USB-C / 2.4GHz Wireless' },
      { key: 'battery_life', label: 'Battery Life / Power Rating', placeholder: 'e.g. 30 Hours ANC / 100W GaN' },
      { key: 'compatibility', label: 'Compatibility', placeholder: 'e.g. iOS, Android, macOS, Windows' },
      { key: 'noise_cancellation', label: 'Key Feature', placeholder: 'e.g. Active Noise Cancellation (ANC)' },
    ],
  },
  {
    slug: 'cameras',
    label: 'Cameras & Content Gear',
    fields: [
      { key: 'sensor_resolution', label: 'Megapixels & Sensor', placeholder: 'e.g. 24.2MP Full-Frame CMOS' },
      { key: 'video_resolution', label: 'Video Recording', placeholder: 'e.g. 4K 60fps 10-bit' },
      { key: 'lens_mount', label: 'Lens Included / Mount', placeholder: 'e.g. 28-70mm Kit Lens (Sony E-Mount)' },
      { key: 'shutter_count', label: 'Shutter Count / Usage', placeholder: 'e.g. Under 8,000 Actuations' },
    ],
  },
  {
    slug: 'components',
    label: 'PC Components & Hardware',
    fields: [
      { key: 'component_type', label: 'Component Type', placeholder: 'e.g. GPU / CPU / Motherboard / NVMe SSD' },
      { key: 'capacity_vram', label: 'VRAM / Capacity / Speed', placeholder: 'e.g. 12GB GDDR6X / 32GB 6000MHz' },
      { key: 'interface_socket', label: 'Socket / Interface', placeholder: 'e.g. PCIe 4.0 / AM5 / LGA1700' },
      { key: 'power_draw', label: 'Recommended PSU / TDP', placeholder: 'e.g. 650W PSU Recommended' },
    ],
  },
  {
    slug: 'networking',
    label: 'Networking & Starlink',
    fields: [
      { key: 'network_standard', label: 'Standard / Speed', placeholder: 'e.g. Starlink Gen 3 / Wi-Fi 6E / 5G CPE' },
      { key: 'coverage_bands', label: 'Bands / SIM Support', placeholder: 'e.g. All Nigerian Networks (MTN, Airtel, Glo)' },
      { key: 'ports', label: 'LAN / WAN Ports', placeholder: 'e.g. 4x Gigabit Ethernet Ports' },
      { key: 'transfer_status', label: 'Account Transfer Status', placeholder: 'e.g. Unactivated / Ready for Transfer' },
    ],
  },
]

export function getCategorySpecDefinition(categorySlug: string): CategoryDefinition {
  const clean = (categorySlug || 'phones').toLowerCase().trim()
  return (
    PRODUCT_CATEGORIES.find((c) => c.slug === clean) || PRODUCT_CATEGORIES[0]
  )
}

export function formatSpecLabel(key: string): string {
  const allFields = [
    ...PRODUCT_CATEGORIES.flatMap((c) => c.fields),
    ...UNIVERSAL_SPEC_FIELDS,
  ]
  const found = allFields.find((f) => f.key === key)
  if (found) return found.label
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
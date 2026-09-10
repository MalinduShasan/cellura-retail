export interface MockVariant {
  id: string;
  sku: string;
  storage: string;
  ram?: string;
  color: string;
  condition: 'new' | 'refurbished' | 'pre-owned';
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  image: string;
}

export interface MockProduct {
  id: string;
  name: string;
  brand: string;
  slug: string;
  description: string;
  featured: boolean;
  variants: MockVariant[];
}

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 'prod-1',
    name: 'iPhone 16 Pro Max',
    brand: 'Apple',
    slug: 'iphone-16-pro-max',
    description: 'Grade 5 titanium design with the A18 Pro chip and 48MP Fusion camera system.',
    featured: true,
    variants: [
      {
        id: 'var-101',
        sku: 'IP16PM-256-NAT-NEW',
        storage: '256GB',
        ram: '8GB',
        color: 'Natural Titanium',
        condition: 'new',
        price: 1199.0,
        compareAtPrice: 1299.0,
        stockQuantity: 14,
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'var-102',
        sku: 'IP16PM-512-BLK-REF',
        storage: '512GB',
        ram: '8GB',
        color: 'Black Titanium',
        condition: 'refurbished',
        price: 1049.0,
        compareAtPrice: 1399.0,
        stockQuantity: 5,
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    id: 'prod-2',
    name: 'Galaxy S25 Ultra',
    brand: 'Samsung',
    slug: 'galaxy-s25-ultra',
    description: 'Galaxy AI integration, Snapdragon 8 Elite, and built-in S-Pen productivity.',
    featured: true,
    variants: [
      {
        id: 'var-201',
        sku: 'S25U-512-TIT-NEW',
        storage: '512GB',
        ram: '12GB',
        color: 'Titanium Gray',
        condition: 'new',
        price: 1299.99,
        compareAtPrice: 1419.99,
        stockQuantity: 8,
        image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'var-202',
        sku: 'S25U-256-BLK-PO',
        storage: '256GB',
        ram: '12GB',
        color: 'Phantom Black',
        condition: 'pre-owned',
        price: 899.0,
        compareAtPrice: 1199.0,
        stockQuantity: 3,
        image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    id: 'prod-3',
    name: 'Pixel 9 Pro',
    brand: 'Google',
    slug: 'pixel-9-pro',
    description: 'Tensor G4 processor with advanced Gemini Nano multi-modal photography features.',
    featured: false,
    variants: [
      {
        id: 'var-301',
        sku: 'PX9P-128-POR-NEW',
        storage: '128GB',
        ram: '16GB',
        color: 'Porcelain',
        condition: 'new',
        price: 999.0,
        compareAtPrice: 1099.0,
        stockQuantity: 12,
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'var-302',
        sku: 'PX9P-256-OBS-REF',
        storage: '256GB',
        ram: '16GB',
        color: 'Obsidian',
        condition: 'refurbished',
        price: 799.0,
        compareAtPrice: 999.0,
        stockQuantity: 6,
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
];
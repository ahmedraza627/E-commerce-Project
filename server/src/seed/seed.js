/**
 * Seed script:  npm run seed
 * Creates an admin, a demo customer and a 10-product catalog with
 * realistic Unsplash imagery (main + hover shot per product).
 */
import config from '../config/env.js';
import { connectDB, disconnectDB } from '../db/connect.js';
import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';
import { Cart } from '../models/cart.model.js';
import { Order } from '../models/order.model.js';
import { RefreshToken } from '../models/refreshToken.model.js';
import { slugify } from '../utils/slugify.js';

// Stable Unsplash CDN URLs — ?auto=format&fit=crop keeps them crisp and webp-native.
const img = (id, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

const products = [
  {
    name: 'Aurora Wireless Headphones',
    category: 'electronics',
    brand: 'Aurora',
    price: 149.99,
    compareAtPrice: 199.99,
    countInStock: 25,
    isFeatured: true,
    description: 'Over-ear ANC headphones with 40-hour battery life, plush memory-foam cups and multipoint Bluetooth 5.3.',
    images: [img('photo-1505740420928-5e560c06d30e'), img('photo-1484704849700-f032a568e944')],
  },
  {
    name: 'Nimbus Mechanical Keyboard',
    category: 'electronics',
    brand: 'Nimbus',
    price: 89.5,
    countInStock: 40,
    isFeatured: true,
    description: 'Hot-swappable 75% mechanical keyboard with PBT keycaps, south-facing RGB and a gasket-mounted plate.',
    images: [img('photo-1587829741301-dc798b83add3'), img('photo-1595225476474-87563907a212')],
  },
  {
    name: 'Vertex Smartwatch Series 5',
    category: 'electronics',
    brand: 'Vertex',
    price: 229.0,
    compareAtPrice: 299.0,
    countInStock: 15,
    isFeatured: true,
    description: 'AMOLED smartwatch with dual-band GPS, 14-day battery, SpO2 tracking and 5ATM water resistance.',
    images: [img('photo-1523275335684-37898b6baf30'), img('photo-1524805444758-089113d48a6d')],
  },
  {
    name: 'Solstice Polarized Sunglasses',
    category: 'apparel',
    brand: 'Solstice',
    price: 119.0,
    compareAtPrice: 159.0,
    countInStock: 30,
    description: 'Hand-polished acetate frames with polarized CR-39 lenses and 100% UV400 protection.',
    images: [img('photo-1572635196237-14b3f281503f'), img('photo-1511499767150-a48a237f0083')],
  },
  {
    name: 'Terra Stand Mixer',
    category: 'home',
    brand: 'Terra',
    price: 279.0,
    compareAtPrice: 349.0,
    countInStock: 12,
    description: '600-watt die-cast stand mixer with 5.5-quart bowl, 10 speeds and a planetary mixing action.',
    images: [img('photo-1556910103-1c02745aae4d'), img('photo-1571805529673-0f56b922b359')],
  },
  {
    name: 'Lumen Arc Desk Lamp',
    category: 'home',
    brand: 'Lumen',
    price: 45.0,
    countInStock: 60,
    description: 'Dimmable LED desk lamp with a wireless charging pad, USB-C port and five color temperatures.',
    images: [img('photo-1507473885765-e6ed057f782c'), img('photo-1513506003901-1e6a229e2d15')],
  },
  {
    name: 'Trailhead Merino Tee',
    category: 'apparel',
    brand: 'Trailhead',
    price: 39.0,
    countInStock: 80,
    description: 'Lightweight 17.5-micron merino wool tee — odor-resistant, quick drying and machine washable.',
    images: [img('photo-1521572163474-6864f9cf17ab'), img('photo-1581655353564-df123a1eb820')],
  },
  {
    name: 'Trailhead Rain Shell',
    category: 'apparel',
    brand: 'Trailhead',
    price: 129.0,
    countInStock: 0, // intentionally out of stock to exercise the UI state
    description: '2.5-layer waterproof shell with fully taped seams, pit zips and a helmet-compatible hood.',
    images: [img('photo-1591047139829-d91aecb6caea'), img('photo-1544966503-7cc5ac882d5f')],
  },
  {
    name: 'Vertex Carbon Water Bottle',
    category: 'outdoors',
    brand: 'Vertex',
    price: 32.0,
    compareAtPrice: 45.0,
    countInStock: 100,
    description: '750ml insulated carbon-fiber bottle keeps drinks cold 24 hours and hot for 12.',
    images: [img('photo-1602143407151-7111542de6e8'), img('photo-1616118132534-381148898bb4')],
  },
  {
    name: 'Atlas Canvas Weekender',
    category: 'outdoors',
    brand: 'Atlas',
    price: 98.0,
    compareAtPrice: 140.0,
    countInStock: 18,
    description: 'Waxed-canvas weekender bag with full-grain leather trim, a padded laptop sleeve and YKK zippers.',
    images: [img('photo-1553062407-98eeb64c6a62'), img('photo-1547949003-9792a18a2601')],
  },
];

async function seed() {
  await connectDB(config.mongoUri);
  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    RefreshToken.deleteMany({}),
  ]);

  console.log('Creating users...');
  await User.create([
    { name: 'Admin User', email: 'admin@shopswift.dev', password: 'Admin123!', role: 'admin' },
    { name: 'Demo Customer', email: 'demo@shopswift.dev', password: 'Demo123!', role: 'customer' },
  ]);

  console.log('Creating products...');
  await Product.create(products.map((p) => ({ ...p, slug: slugify(p.name) })));

  const counts = {
    users: await User.countDocuments(),
    products: await Product.countDocuments(),
    withImages: await Product.countDocuments({ 'images.0': { $exists: true } }),
  };
  console.log('Seed complete:', counts);
  console.log('  admin: admin@shopswift.dev / Admin123!');
  console.log('  demo:  demo@shopswift.dev / Demo123!');
}

seed()
  .then(() => disconnectDB())
  .catch((err) => {
    console.error('Seed failed:', err);
    return disconnectDB().then(() => process.exit(1));
  });

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Banner } from '../models/Banner';
import { User } from '../models/User';

// Load env vars
dotenv.config();

const categoriesData = [
  {
    name: 'Puja Kits',
    description: 'Complete Puja Kits with all ingredients for specific rituals and festivals.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'Agarbatti',
    description: 'Aromatic incense sticks for a peaceful and divine atmosphere.',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'Dhoop',
    description: 'Traditional solid dhoop cones and logs with natural herbs.',
    image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'Camphor',
    description: 'Pure Bhimseni Camphor tablets for aarti and purification.',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'Diyas',
    description: 'Clay, brass, and designer oil lamps to light up your shrine.',
    image: 'https://images.unsplash.com/photo-1605846939999-e61e05d0e238?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'Idols',
    description: 'Beautifully crafted idols of Ganesha, Lakshmi, Shiva, and deities.',
    image: 'https://images.unsplash.com/photo-1561839561-b13bcfe916b9?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'Rudraksha',
    description: 'Authentic Himalayan Rudraksha beads and prayer malas.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'Hawan Samagri',
    description: 'Herbal Hawan mixtures, samidha wood, and ghee for yagna.',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'Kalash',
    description: 'Copper and brass Kalash pots for auspicious installation.',
    image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'Incense',
    description: 'Exotic incense cones, cups, and aromatic resin blends.',
    image: 'https://images.unsplash.com/photo-1612547087684-18a864f0f220?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'Flowers',
    description: 'Fresh marigold, lotus, and mixed flower garlands for offering.',
    image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'Accessories',
    description: 'Aarti plates, bell, cotton wicks, thali, and shrine essentials.',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=400',
  },
];

const bannersData = [
  {
    title: 'Festival Offer: Shravan Special',
    image: 'https://images.unsplash.com/photo-1609137144813-2d28f8705030?auto=format&fit=crop&q=80&w=1200&h=400',
    link: '/category/Puja Kits',
    position: 0,
    isActive: true,
  },
  {
    title: 'Up to 30% Off on Pure Brass Diyas',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=1200&h=400',
    link: '/category/Diyas',
    position: 1,
    isActive: true,
  },
  {
    title: 'Aura Purifying Camphor Aarti Sets',
    image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&q=80&w=1200&h=400',
    link: '/category/Camphor',
    position: 2,
    isActive: true,
  },
];

const productsData = [
  // Puja Kits
  {
    name: 'Satyanarayan Puja Kit Premium',
    description: 'A comprehensive, hand-packaged Puja Kit containing 32 essential items including Haldi, Kumkum, Chandan, Janeu, Kalash coconut, Supari, Ganga Jal, Honey, and a detailed step-by-step guidebook for Satyanarayan Vrat Katha.',
    price: 999,
    discountPrice: 799,
    images: [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=600',
    ],
    specifications: [
      { key: 'Total Items', value: '32 Items' },
      { key: 'Net Weight', value: '1.2 kg' },
      { key: 'Packaging', value: 'Eco-friendly cardboard box' },
      { key: 'Usage', value: 'Satyanarayan Vrat & Katha rituals' },
    ],
    rating: 4.8,
    reviewsCount: 156,
    stock: 50,
    isBestSeller: true,
    isFeatured: true,
    isNewArrival: false,
    isFlashSale: false,
  },
  {
    name: 'Ganesh Chaturthi Complete Ritual Box',
    description: 'All-in-one worship box featuring modak prasad cups, red cloth, durva grass pack, natural incense, Ganesha clay idol, and detailed standard mantra guides for installation.',
    price: 1200,
    discountPrice: 899,
    images: ['https://images.unsplash.com/photo-1561839561-b13bcfe916b9?auto=format&fit=crop&q=80&w=600'],
    specifications: [
      { key: 'Total Items', value: '25 Items' },
      { key: 'Weight', value: '1.5 kg' },
      { key: 'Ganesh Idol Size', value: '6 inches (Clay)' },
    ],
    rating: 4.9,
    reviewsCount: 88,
    stock: 40,
    isBestSeller: false,
    isFeatured: true,
    isNewArrival: true,
    isFlashSale: true,
  },

  // Agarbatti
  {
    name: 'Pure Mysore Sandalwood Agarbatti',
    description: 'Premium organic incense sticks crafted using natural Mysore Sandalwood oil extracts. Slow-burning formulation that releases a soft, grounding aroma promoting relaxation and focus.',
    price: 250,
    discountPrice: 199,
    images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=600'],
    specifications: [
      { key: 'Quantity', value: '100 sticks' },
      { key: 'Fragrance', value: 'Chandan / Sandalwood' },
      { key: 'Burn Time', value: '45-50 minutes per stick' },
    ],
    rating: 4.7,
    reviewsCount: 320,
    stock: 200,
    isBestSeller: true,
    isFeatured: false,
    isNewArrival: false,
    isFlashSale: false,
  },

  // Camphor
  {
    name: 'Bhimseni Pure Camphor Tablets',
    description: '100% pure Bhimseni camphor crystals. Free from wax, additives, or synthetic chemicals. Leaves no ash or toxic fumes during aarti, diffusing a refreshing scent.',
    price: 350,
    discountPrice: 280,
    images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=600'],
    specifications: [
      { key: 'Weight', value: '250g' },
      { key: 'Type', value: 'Bhimseni Camphor' },
      { key: 'Purity', value: '100% Organic' },
    ],
    rating: 4.9,
    reviewsCount: 412,
    stock: 150,
    isBestSeller: true,
    isFeatured: true,
    isNewArrival: false,
    isFlashSale: false,
  },

  // Diyas
  {
    name: 'Classic Brass Peacock Diya',
    description: 'Exquisitely carved brass oil lamp featuring a traditional peacock motif. Durable, easy to clean, and holds enough oil or ghee to keep the flame glowing throughout evening prayers.',
    price: 850,
    discountPrice: 599,
    images: ['https://images.unsplash.com/photo-1605846939999-e61e05d0e238?auto=format&fit=crop&q=80&w=600'],
    specifications: [
      { key: 'Material', value: 'Solid Brass' },
      { key: 'Dimensions', value: '5 x 3.5 inches' },
      { key: 'Weight', value: '350g' },
    ],
    rating: 4.6,
    reviewsCount: 94,
    stock: 75,
    isBestSeller: false,
    isFeatured: false,
    isNewArrival: true,
    isFlashSale: false,
  },

  // Idols
  {
    name: 'Brass Ganesha Idol Vintage Gold',
    description: 'Stunning vintage golden brass Ganesha idol. Crafted with meticulous detailing on the posture and expressions, perfect for your dashboard, home entrance, or puja mandir.',
    price: 1500,
    discountPrice: 1250,
    images: ['https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=600'],
    specifications: [
      { key: 'Material', value: 'High-grade Brass' },
      { key: 'Height', value: '4.5 inches' },
      { key: 'Weight', value: '520g' },
    ],
    rating: 4.8,
    reviewsCount: 65,
    stock: 30,
    isBestSeller: false,
    isFeatured: true,
    isNewArrival: false,
    isFlashSale: false,
  },

  // Rudraksha
  {
    name: 'Five Mukhi Nepal Rudraksha Mala',
    description: 'Original 108+1 bead Five Mukhi Nepalese Rudraksha Japa Mala. Knotted securely with red cotton thread. Comes with laboratory authenticity certificate for spiritual meditation practice.',
    price: 499,
    discountPrice: 349,
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600'],
    specifications: [
      { key: 'Bead Count', value: '108 + 1 Guru Bead' },
      { key: 'Bead Size', value: '8mm' },
      { key: 'Origin', value: 'Nepal' },
    ],
    rating: 4.7,
    reviewsCount: 118,
    stock: 90,
    isBestSeller: true,
    isFeatured: false,
    isNewArrival: true,
    isFlashSale: false,
  },
];

async function seedDatabase() {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/pujamart';
    await mongoose.connect(connStr);
    console.log('Seed: Connected to MongoDB.');

    // 1. Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Banner.deleteMany({});
    console.log('Seed: Cleared old Categories, Products, and Banners.');

    // 2. Seed Categories
    const insertedCategories = await Category.insertMany(categoriesData);
    console.log(`Seed: Inserted ${insertedCategories.length} categories.`);

    // Map Category IDs to inserted categories
    const categoriesMap: { [key: string]: mongoose.Types.ObjectId } = {};
    insertedCategories.forEach((cat) => {
      categoriesMap[cat.name] = cat._id as mongoose.Types.ObjectId;
    });

    // 3. Seed Products with real category references
    const finalProducts = productsData.map((prod) => {
      // Find category name mapping
      let matchedCategoryName = 'Accessories'; // fallback
      for (const name of Object.keys(categoriesMap)) {
        if (prod.name.toLowerCase().includes(name.toLowerCase().split(' ')[0])) {
          matchedCategoryName = name;
          break;
        }
      }

      // Add specific match mappings
      if (prod.name.includes('Sandalwood')) matchedCategoryName = 'Agarbatti';
      if (prod.name.includes('Camphor')) matchedCategoryName = 'Camphor';
      if (prod.name.includes('Diya')) matchedCategoryName = 'Diyas';
      if (prod.name.includes('Rudraksha')) matchedCategoryName = 'Rudraksha';
      if (prod.name.includes('Ganesha Idol')) matchedCategoryName = 'Idols';

      return {
        ...prod,
        category: categoriesMap[matchedCategoryName],
      };
    });

    const insertedProducts = await Product.insertMany(finalProducts);
    console.log(`Seed: Inserted ${insertedProducts.length} products.`);

    // 4. Seed Banners
    const insertedBanners = await Banner.insertMany(bannersData);
    console.log(`Seed: Inserted ${insertedBanners.length} banners.`);

    // 5. Seed Admin User if not exists
    const adminEmail = 'admin@pujamart.com';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        name: 'PujaMart Admin',
        email: adminEmail,
        phone: '9999999999',
        password: 'adminpassword123',
        role: 'admin',
        isVerified: true,
      });
      console.log(`Seed: Created default Admin account: ${adminEmail} (password: adminpassword123)`);
    } else {
      console.log('Seed: Admin user already exists.');
    }

    console.log('Seed: Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seed: Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

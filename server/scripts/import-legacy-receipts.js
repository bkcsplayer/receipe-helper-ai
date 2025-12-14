/**
 * Import legacy receipts from db.json to PostgreSQL
 * These are real user receipts, not mock data
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

// Category mapping based on store name
const categoryMap = {
  'home depot': 'Shopping',
  'shell': 'Transportation',
  'esso': 'Transportation',
  'ufa': 'Transportation',
  'costco': 'Shopping',
  't&t': 'Groceries',
  'supermarket': 'Groceries',
  'restaurant': 'Dining',
  'garden': 'Dining',
  'hong kong house': 'Dining',
  'hotpot': 'Dining',
  'liu yi shou': 'Dining',
  'mary brown': 'Dining',
  'carl\'s jr': 'Dining',
  'a&w': 'Dining',
  'tj\'s': 'Dining',
  'bambu lab': 'Shopping',
  '7-eleven': 'Transportation',
};

function detectCategory(storeName) {
  const lower = (storeName || '').toLowerCase();
  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (lower.includes(keyword)) {
      return category;
    }
  }
  return 'Other';
}

function mapSource(source) {
  const sourceMap = {
    'Web Upload': 'WEB',
    'Email': 'EMAIL',
    'Telegram': 'TELEGRAM',
    'API': 'API',
  };
  return sourceMap[source] || 'WEB';
}

async function importReceipts() {
  console.log('📦 Starting legacy receipt import...\n');

  // Read the legacy data from command line argument or inline
  const legacyData = {
    receipts: [
      {
        "id": 1764107625677,
        "store_name": "Home Depot",
        "store_location": "Atlanta GA",
        "date": "2013-06-15",
        "total_amount": 32.3,
        "tax_amount": 1.83,
        "items": [
          { "name": "RYOBI 31-PC TITANIUM DRILL/DRIVE KIT", "price": 10.97 },
          { "name": "DYNAWHIT.5", "price": 3.98 },
          { "name": "5GAL BLACK REUSABLE BUCKET LID", "price": 1.28 },
          { "name": "BT25/30PK", "price": 6.99 },
          { "name": "1GPH MAN", "price": 3.98 },
          { "name": "HOMER BUCKET", "price": 2.6 },
          { "name": "RISER EXTNDR", "price": 0.67 }
        ],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2013-06/2013-06-15_Atlanta_GA_Home_Depot_32.3_1764107622752.jpg",
        "status": "completed"
      },
      {
        "id": 1764107698774,
        "store_name": "Shell Canada",
        "store_location": "291 SAKITAWAW TRAIL, FORT MCMURRAY, AB T9H 5E7",
        "date": "2025-11-20",
        "total_amount": 60,
        "tax_amount": 2.86,
        "items": [{ "name": "REGULAR FUEL", "price": 60 }],
        "source": "Email",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2025-11/email_1764107697143.html",
        "status": "completed"
      },
      {
        "id": 1764124463298,
        "store_name": "Home Depot",
        "store_location": "2450 Cumberland Pkwy, Atlanta GA",
        "date": "2013-06-15",
        "total_amount": 32.3,
        "tax_amount": 1.83,
        "items": [
          { "name": "RYOBI 31-PC TITANIUM DRILL/DRIVE KIT", "price": 10.97 },
          { "name": "DYNAWHIT.5", "price": 3.98 },
          { "name": "5GAL BLACK REUSABLE BUCKET LID", "price": 1.28 },
          { "name": "BT25/30PK", "price": 6.99 },
          { "name": "1GPH MAN", "price": 3.98 },
          { "name": "HOMER BUCKET", "price": 2.6 },
          { "name": "RISER EXTNDR", "price": 0.67 }
        ],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2013-06/2013-06-15_2450_Cumberland_Pkwy__Atlanta_GA_Home_Depot_32.3_1764124462090.jpg",
        "status": "completed"
      },
      {
        "id": 1764282207184,
        "store_name": "Bambu Lab",
        "store_location": "1 WANG KWONG RD, RM D, 10/F, TOWER A BILLION CTR, KOWLOON BAY, Kowloon Hong Kong SAR",
        "date": "2025-11-27",
        "total_amount": 196.48,
        "tax_amount": 9.36,
        "items": [
          { "name": "PLA Basic Red (3x)", "price": 46.78 },
          { "name": "PLA Basic Bambu Green (3x)", "price": 46.78 },
          { "name": "PLA Basic Yellow (3x)", "price": 46.78 },
          { "name": "PLA Basic Black (3x)", "price": 46.78 },
          { "name": "Bambu Filament Swatches", "price": 0 }
        ],
        "source": "Email",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2025-11/email_1764282205706.html",
        "status": "completed"
      },
      {
        "id": 1764435551698,
        "store_name": "T&T Supermarket",
        "store_location": "Sage Hill Store, Calgary, AB",
        "date": "2025-11-29",
        "total_amount": 29.53,
        "tax_amount": 0.35,
        "items": [
          { "name": "S&B GOLDEN CURRY SC MIX EXT HOT", "price": 7.45 },
          { "name": "YUNG JI WU YU YELLOW PEACH", "price": 6.98 },
          { "name": "YSJ670", "price": 7.94 },
          { "name": "CHINESE BLUE ORANGE", "price": 4.37 },
          { "name": "CHINESE FUJI APPLE", "price": 2.44 }
        ],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2025-11/2025-11-29_Sage_Hill_Store__Calgary__AB_T_T_Supermarket_29.53_1764435550403.jpg",
        "status": "completed"
      },
      {
        "id": 1764534836641,
        "store_name": "A&W",
        "store_location": "1628 - Chinook Station Calgary, 6666 MacLeod Trail Southwest, Calgary AB",
        "date": "2025-11-30",
        "total_amount": 33.37,
        "tax_amount": 1.59,
        "items": [
          { "name": "Double Teen Combo", "price": 16.29 },
          { "name": "SP Fries", "price": 1.3 },
          { "name": "Root Beer", "price": 0 },
          { "name": "Teen Combo", "price": 14.19 },
          { "name": "Root Beer", "price": 0 }
        ],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2025-11/2025-11-30_1628___Chinook_Station_Calgary__6666_MacLeod_Trail_Southwest__Calgary_AB_A_W_33.37_1764534835118.jpg",
        "status": "completed"
      },
      {
        "id": 1764542263759,
        "store_name": "UFA",
        "store_location": "100, 937 Highland Park Blvd NE, Airdrie, AB",
        "date": "2023-11-30",
        "total_amount": 114.23,
        "tax_amount": 5.44,
        "items": [{ "name": "Clear Gasoline", "price": 114.23 }],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2023-11/2023-11-30_100__937_Highland_Park_Blvd_NE__Airdrie__AB_UFA_114.23_1764542261706.jpg",
        "status": "completed"
      },
      {
        "id": 1764556631579,
        "store_name": "UFA Rayserthorpe",
        "store_location": "Rayser-thorpe, AB",
        "date": "2025-11-30",
        "total_amount": 89.56,
        "tax_amount": 4.26,
        "items": [{ "name": "Clear Gasoline", "price": 89.56 }],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2025-11/2025-11-30_Rayser_thorpe__AB_UFA_Rayserthorpe_89.56_1764556630127.jpg",
        "status": "completed"
      },
      {
        "id": 1764627634426,
        "store_name": "Carl's Jr.",
        "store_location": "Grande Prairie",
        "date": "2025-12-01",
        "total_amount": 29.17,
        "tax_amount": 1.39,
        "items": [
          { "name": "SUPER BCN", "price": 12.89 },
          { "name": "SUPER CH CBO", "price": 14.89 }
        ],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2025-11/2025-12-01_Grande_Prairie_Carl_s_Jr__29.17_1764627633077.jpg",
        "status": "completed"
      },
      {
        "id": 1764639668867,
        "store_name": "Grande Prairie West",
        "store_location": "3032 - 159H ST",
        "date": "2025-12-01",
        "total_amount": 95.46,
        "tax_amount": 4.55,
        "items": [{ "name": "Clear Gasoline", "price": 90.91 }],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2025-11/2025-12-01_3032___159H_ST_Grande_Prairie_West_95.46_1764639667393.jpg",
        "status": "completed"
      },
      {
        "id": 1764642631048,
        "store_name": "Costco Canada Liquor",
        "store_location": "Grande Prairie, AB",
        "date": "2025-12-01",
        "total_amount": 65.79,
        "tax_amount": 3,
        "items": [
          { "name": "CORONA 28", "price": 59.99 },
          { "name": "DEPOSIT LIQU", "price": 2.8 }
        ],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2025-11/2025-12-01_Grande_Prairie__AB_Costco_Canada_Liquor_65.79_1764642628653.jpg",
        "status": "completed"
      },
      {
        "id": 1764706319074,
        "store_name": "TJ'S RESTAURANT",
        "store_location": "Peace River, AB",
        "date": "2025-12-02",
        "total_amount": 76.91,
        "tax_amount": 0,
        "items": [{ "name": "AMOUNT", "price": 68.67 }],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2025-12/2025-12-02_Peace_River__AB_TJ_S_RESTAURANT_76.91_1764706317296.jpg",
        "status": "completed"
      },
      {
        "id": 1764778773842,
        "store_name": "The Home Depot",
        "store_location": "Grande Prairie, AB",
        "date": "2025-03-12",
        "total_amount": 10.48,
        "tax_amount": 0.5,
        "items": [{ "name": "Futurefrontier technology wang", "price": 9.98 }],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2025-03/2025-03-12_Grande_Prairie__AB_The_Home_Depot_10.48_1764778771284.jpg",
        "status": "completed"
      },
      {
        "id": 1764810691193,
        "store_name": "HONG KONG HOUSE INC",
        "store_location": "GRAND PRAIRIE, AB",
        "date": "2025-12-03",
        "total_amount": 37.7,
        "tax_amount": 0,
        "items": [{ "name": "Total", "price": 37.7 }],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2025-12/2025-12-03_GRAND_PRAIRIE__AB_HONG_KONG_HOUSE_INC_37.7_1764810689734.jpg",
        "status": "completed"
      },
      {
        "id": 1764883369359,
        "store_name": "PEACE GARDEN Restaurant",
        "store_location": "PEACE RIVER, ALBERTA",
        "date": "2025-12-04",
        "total_amount": 40.8,
        "tax_amount": 0,
        "items": [{ "name": "Unknown Item", "price": 40.8 }],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2025-12/2025-12-04_PEACE_RIVER__ALBERTA_PEACE_GARDEN_Restaurant_40.8_1764883367613.jpg",
        "status": "completed"
      },
      {
        "id": 1764972495238,
        "store_name": "PEACE GARDEN",
        "store_location": "Peace River, AB",
        "date": "2023-12-05",
        "total_amount": 113.74,
        "tax_amount": 0,
        "items": [
          { "name": "Amount", "price": 98.9 },
          { "name": "Tip", "price": 14.84 }
        ],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2023-12/2023-12-05_Peace_River__AB_PEACE_GARDEN_113.74_1764972492765.jpg",
        "status": "completed"
      },
      {
        "id": 1765042175543,
        "store_name": "UFA Grande Prairie West",
        "store_location": "9702 - 115th St, Grande Prairie West",
        "date": "2025-12-06",
        "total_amount": 71.27,
        "tax_amount": 3.39,
        "items": [{ "name": "Clear Gasoline", "price": 67.88 }],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2025-12/2025-12-06_9702___115th_St__Grande_Prairie_West_UFA_Grande_Prairie_West_71.27_1765042173478.jpg",
        "status": "completed"
      },
      {
        "id": 1765054263986,
        "store_name": "UFA Whitecourt",
        "store_location": "5400 Caxton Street West, Whitecourt, AB",
        "date": "2025-12-06",
        "total_amount": 85.42,
        "tax_amount": 4.07,
        "items": [{ "name": "Clear Gasoline", "price": 81.35 }],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2025-12/2025-12-06_5400_Caxton_Street_West__Whitecourt__AB_UFA_Whitecourt_85.42_1765054262243.jpg",
        "status": "completed"
      },
      {
        "id": 1765066754207,
        "store_name": "Liu Yi Shou Hotpot",
        "store_location": "Edmonton",
        "date": "2023-12-06",
        "total_amount": 146.69,
        "tax_amount": 6.99,
        "items": [
          { "name": "Holiday Weekend", "price": 110.85 },
          { "name": "Two-Flavoured Soup Base", "price": 16.95 },
          { "name": "Tsingtao", "price": 11.9 }
        ],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2023-12/2023-12-06_Edmonton_Liu_Yi_Shou_Hotpot_146.69_1765066751488.jpg",
        "status": "completed"
      },
      {
        "id": 1765209259933,
        "store_name": "Esso 7-Eleven",
        "store_location": "Calgary AB",
        "date": "2025-12-08",
        "total_amount": 115.1,
        "tax_amount": 5.48,
        "items": [{ "name": "EREG Gas 99.31L", "price": 115.1 }],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2025-12/2025-12-08_Calgary_AB_Esso_7_Eleven_115.1_1765209257010.jpg",
        "status": "completed"
      },
      {
        "id": 1765313380539,
        "store_name": "Mary Brown's",
        "store_location": "Calgary, AB",
        "date": "2025-12-09",
        "total_amount": 19.93,
        "tax_amount": 0.95,
        "items": [
          { "name": "Big Mary Sandwich", "price": 9.49 },
          { "name": "Spicy Big Mary Sandwich", "price": 9.49 }
        ],
        "source": "Web Upload",
        "driveLink": "https://pub-3797f686e2f44adbbf2b7285ab2839c5.r2.dev/2025-12/2025-12-09_Calgary__AB_Mary_Brown_s_19.93_1765313378618.jpg",
        "status": "completed"
      }
    ]
  };

  let imported = 0;
  let skipped = 0;

  for (const receipt of legacyData.receipts) {
    // Check if already exists
    const existing = await prisma.receipt.findFirst({
      where: { legacyId: String(receipt.id) }
    });

    if (existing) {
      console.log(`⏭️  Skipping ${receipt.store_name} (already imported)`);
      skipped++;
      continue;
    }

    const category = detectCategory(receipt.store_name);
    const transactionDate = new Date(receipt.date + 'T12:00:00Z');

    try {
      const created = await prisma.receipt.create({
        data: {
          legacyId: String(receipt.id),
          storeName: receipt.store_name,
          storeLocation: receipt.store_location,
          transactionDate,
          totalAmount: receipt.total_amount,
          taxAmount: receipt.tax_amount,
          currency: 'CAD',
          category,
          source: mapSource(receipt.source),
          fileUrl: receipt.driveLink,
          status: receipt.status || 'completed',
          type: 'EXPENSE',
          documentType: 'RECEIPT',
          isMockData: false, // Real data!
          createdAt: new Date(),
          items: {
            create: (receipt.items || []).map(item => ({
              name: item.name,
              totalPrice: item.price,
              quantity: 1,
            }))
          }
        }
      });

      console.log(`✅ Imported: ${receipt.store_name} - $${receipt.total_amount} (${category})`);
      imported++;
    } catch (err) {
      console.error(`❌ Failed to import ${receipt.store_name}:`, err.message);
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📦 Total: ${legacyData.receipts.length}`);
}

importReceipts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


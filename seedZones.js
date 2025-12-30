const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  serviceAccount = require('./serviceAccountKey.json');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const zones = [
  {
    id: "sundarbans",
    name: "Sundarbans Mangroves",
    lat: 21.95,
    lng: 88.75,
    radius: 35000,
    importance: 9,
    hazard: "Climate Change & Deforestation",
    impact: "Flooding, livelihood loss",
    species: ["Royal Bengal Tiger", "Mangrove Fish", "Saltwater Crocodile"],
    petitions: [
      { title: "Protect Mangroves", count: 3241 }
    ],
    news: [
      { title: "Sea level rise threatens Sundarbans", link: "#" }
    ]
  },
  {
    id: "aravalli",
    name: "Aravalli Hills",
    lat: 28.45,
    lng: 77.12,
    radius: 25000,
    importance: 8,
    hazard: "Mining & Construction",
    impact: "Air pollution, water loss",
    species: ["Leopard", "Peacock", "Indian Grey Wolf"],
    petitions: [
      { title: "Stop Illegal Mining", count: 1870 }
    ],
    news: [
      { title: "Illegal mining damages Aravallis", link: "#" }
    ]
  },
  {
    id: "western-ghats",
    name: "Western Ghats",
    lat: 15.5,
    lng: 73.8,
    radius: 40000,
    importance: 10,
    hazard: "Deforestation & Urban Expansion",
    impact: "Biodiversity loss, water scarcity",
    species: ["Tiger", "Lion-tailed Macaque", "Nilgiri Tahr", "Malabar Giant Squirrel"],
    petitions: [
      { title: "Save Western Ghats UNESCO Heritage", count: 5240 }
    ],
    news: [
      { title: "UNESCO warns about Western Ghats degradation", link: "#" }
    ]
  },
  {
    id: "chilika-lake",
    name: "Chilika Lake",
    lat: 19.72,
    lng: 85.32,
    radius: 28000,
    importance: 8,
    hazard: "Pollution & Overfishing",
    impact: "Migratory bird decline",
    species: ["Irrawaddy Dolphin", "Flamingo", "Pelican"],
    petitions: [
      { title: "Clean Chilika Waters", count: 2100 }
    ],
    news: [
      { title: "Chilika Lake ecosystem under threat", link: "#" }
    ]
  }
];

const samplePetitions = [
  {
    title: "Stop Industrial Dumping in Emerald River",
    description: "Factory runoff is killing local fish species. We need stricter regulations and immediate action to protect our water sources.",
    signatures: 1240,
    goal: 2000,
    signedBy: [],
    createdBy: "system",
    createdByName: "EcoWatch Team",
    image: "https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=500&q=60"
  },
  {
    title: "Save the Northern Forest Corridor",
    description: "Proposed highway construction will fragment critical elephant habitats. Let's protect wildlife corridors!",
    signatures: 850,
    goal: 5000,
    signedBy: [],
    createdBy: "system",
    createdByName: "Wildlife Alliance",
    image: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=500&q=60"
  },
  {
    title: "Ban Single-Use Plastics in National Parks",
    description: "Plastic pollution is devastating our natural heritage. Support a complete ban on single-use plastics in all national parks.",
    signatures: 3450,
    goal: 10000,
    signedBy: [],
    createdBy: "system",
    createdByName: "Green Future",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=500&q=60"
  }
];

async function seedData() {
  try {
    console.log('🌱 Starting to seed database...\n');

    // Seed Zones
    console.log('📍 Seeding zones...');
    for (const zone of zones) {
      await db.collection('zones').doc(zone.id).set(zone);
      console.log(`  ✅ Added zone: ${zone.name}`);
    }

    // Seed Petitions
    console.log('\n✏️  Seeding petitions...');
    for (const petition of samplePetitions) {
      const docRef = await db.collection('petitions').add({
        ...petition,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✅ Added petition: ${petition.title}`);
    }

    console.log('\n🎉 Database seeding complete!');
    console.log(`\nSeeded ${zones.length} zones and ${samplePetitions.length} petitions`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedData();
const admin = require('firebase-admin');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  serviceAccount = require('../serviceAccountKey.json');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function generateAllImpacts() {
  try {
    console.log('🚀 Starting impact generation for all zones...\n');

    const zonesSnapshot = await db.collection('zones').get();
    const zones = [];

    zonesSnapshot.forEach(doc => {
      zones.push({ id: doc.id, ...doc.data() });
    });

    console.log(`📍 Found ${zones.length} zones\n`);

    let generated = 0;
    let skipped = 0;

    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i];

      // Check if analysis already exists
      if (zone.impactAnalysis) {
        console.log(`⏭️  [${i + 1}/${zones.length}] Skipping ${zone.name} - already cached`);
        skipped++;
        continue;
      }

      console.log(`🤖 [${i + 1}/${zones.length}] Generating analysis for ${zone.name}...`);

      const prompt = `
Act as a senior environmental scientist with expertise in ecology, climate science, and conservation biology.

Provide a comprehensive environmental impact analysis for this risk zone:

**Zone Profile:**
- Name: ${zone.name}
- Location: ${zone.lat}, ${zone.lng}
- Primary Hazard: ${zone.hazard}
- Severity Index: ${zone.importance}/10
- Current Impact: ${zone.impact}
- Key Species: ${zone.species ? zone.species.join(", ") : "Various endemic species"}

**Required Analysis Sections:**

1. **Immediate Environmental Impact (1-2 years)**
   - Provide specific measurable impacts on local ecosystems
   - Include effects on water quality, air quality, soil composition
   - Describe impact on biodiversity and species populations
   - Quantify where possible

2. **Medium-Term Consequences (3-7 years)**
   - Describe cascading ecological effects
   - Impact on climate regulation and carbon sequestration
   - Changes to local weather patterns and hydrology
   - Economic impact on local communities

3. **Long-Term Ecological Trajectory (10-25 years)**
   - Predict ecosystem state if current trends continue
   - Discuss irreversible tipping points and thresholds
   - Impact on regional biodiversity and extinction risks
   - Climate change amplification effects

4. **Affected Wildlife & Ecosystems**
   - Detailed analysis of impact on each key species
   - Food web disruption and trophic cascade effects
   - Migration pattern changes and habitat fragmentation

5. **Human Health & Livelihood Impact**
   - Public health consequences
   - Impact on agriculture and food security
   - Displacement and migration pressures
   - Economic costs and poverty implications

6. **Scientific Evidence & Data**
   - Reference similar case studies from other regions
   - Cite relevant ecological principles

7. **Comprehensive Action Plan**
   - Immediate interventions (within 6 months)
   - Medium-term restoration strategies (1-3 years)
   - Long-term conservation framework (5-10 years)
   - Policy recommendations
   - Community engagement initiatives
   - Success metrics and monitoring protocols

**Format Requirements:**
- Use HTML formatting with <h3> for section headers
- Use <strong> for emphasis on critical points
- Use <ul> and <li> for lists
- Include specific numbers and timeframes
- Make it comprehensive (800-1200 words)
- Use scientific but accessible language

Provide an analysis valuable for policymakers, conservationists, and local communities.
      `;

      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [{ parts: [{ text: prompt }] }]
          }
        );

        const analysis = response.data.candidates[0].content.parts[0].text;

        await db.collection('zones').doc(zone.id).update({
          impactAnalysis: analysis,
          impactAnalysisGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Generated and cached analysis for ${zone.name}\n`);
        generated++;

        // Rate limiting: Wait 2 seconds between requests
        if (i < zones.length - 1) {
          console.log('⏳ Waiting 2 seconds (rate limiting)...\n');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`❌ Error for ${zone.name}:`, error.message, '\n');
      }
    }

    console.log('='.repeat(60));
    console.log('🎉 Impact generation complete!');
    console.log(`📊 Stats: ${generated} generated, ${skipped} skipped, ${zones.length} total`);
    console.log('='.repeat(60));

    process.exit(0);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

generateAllImpacts();

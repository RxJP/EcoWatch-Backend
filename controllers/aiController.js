const axios = require('axios');
const { db, admin } = require('../middleware/auth');

// Get cached impact analysis for a zone
exports.getZoneImpact = async (req, res) => {
  try {
    const { zoneId } = req.params;

    const zoneDoc = await db.collection('zones').doc(zoneId).get();

    if (!zoneDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Zone not found'
      });
    }

    const zoneData = zoneDoc.data();

    if (!zoneData.impactAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'Impact analysis not yet generated for this zone'
      });
    }

    res.json({
      success: true,
      data: {
        analysis: zoneData.impactAnalysis,
        generatedAt: zoneData.impactAnalysisGeneratedAt,
        zone: {
          id: zoneDoc.id,
          name: zoneData.name,
          hazard: zoneData.hazard,
          importance: zoneData.importance
        }
      }
    });

  } catch (error) {
    console.error('Get zone impact error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.askQuestion = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    const prompt = `
You are an expert Environmental Scientist with deep knowledge of ecology, climate change, and sustainability.

IMPORTANT FORMATTING RULES:
- Use plain text only, no LaTeX or mathematical notation
- Write chemical formulas using subscripts: CO₂, H₂O, CH₄, N₂O
- For emphasis, use **bold text** (will be converted to HTML)
- Write numbers and percentages normally: "5%", "2.5 degrees"
- Use clear, everyday language
- Avoid mathematical symbols like $, \\text{}, or other LaTeX commands

User Question: "${question}"

Provide a clear, accurate answer in 2-3 sentences using plain text with **bold** for emphasis where appropriate.
    `;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );

    const answer = response.data.candidates[0].content.parts[0].text;
    res.json({ success: true, data: answer });
  } catch (error) {
    console.error('AI Q&A error:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || error.message
    });
  }
};

// Cache impact analyses in Firestore
exports.generateZoneImpacts = async (req, res) => {
  try {
    const zonesSnapshot = await db.collection('zones').get();
    const zones = [];
    
    zonesSnapshot.forEach(doc => {
      zones.push({ id: doc.id, ...doc.data() });
    });

    let generated = 0;
    let skipped = 0;

    console.log(`🔄 Checking ${zones.length} zones for impact analysis...`);

    for (const zone of zones) {
      if (zone.impactAnalysis && zone.impactAnalysisGeneratedAt) {
        console.log(`⏭️  Skipping ${zone.name} - analysis already exists`);
        skipped++;
        continue;
      }

      console.log(`🤖 Generating detailed analysis for ${zone.name}...`);

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

Generate EXACTLY these 7 sections with these exact headings:

<h3>1. Immediate Environmental Impact (1-2 years)</h3>
Provide specific measurable impacts on local ecosystems. Include effects on water quality, air quality, soil composition. Describe impact on biodiversity and species populations. Quantify where possible (e.g., "30% reduction in tree cover").

<h3>2. Medium-Term Consequences (3-7 years)</h3>
Describe cascading ecological effects. Impact on climate regulation and carbon sequestration. Changes to local weather patterns and hydrology. Economic impact on local communities.

<h3>3. Long-Term Ecological Trajectory (10-25 years)</h3>
Predict ecosystem state if current trends continue. Discuss irreversible tipping points and thresholds. Impact on regional biodiversity and extinction risks. Climate change amplification effects.

<h3>4. Affected Wildlife & Ecosystems</h3>
Detailed analysis of impact on each key species mentioned: ${zone.species ? zone.species.join(", ") : "various species"}. Food web disruption and trophic cascade effects. Migration pattern changes and habitat fragmentation. Endangered species at critical risk.

<h3>5. Human Health & Livelihood Impact</h3>
Public health consequences (air/water quality, disease). Impact on agriculture and food security. Displacement and migration pressures. Economic costs and poverty implications.

<h3>6. Scientific Evidence & Data</h3>
Reference similar case studies from other regions. Cite relevant ecological principles and theories. Mention key environmental indicators to monitor.

<h3>7. Comprehensive Action Plan</h3>
- Immediate interventions (within 6 months)
- Medium-term restoration strategies (1-3 years)
- Long-term conservation framework (5-10 years)
- Policy recommendations and regulatory changes needed
- Community engagement and education initiatives
- Required funding and resources
- Success metrics and monitoring protocols

**Format Requirements:**
- Use HTML formatting exactly as shown above with <h3> tags
- Use <strong> for emphasis on critical points
- Use <ul> and <li> for lists
- Include specific numbers and timeframes
- Make it comprehensive (800-1200 words total)
- Use scientific but accessible language
- Structure with clear sections using the exact headings provided

DO NOT use LaTeX, mathematical notation, or special symbols. Write everything in plain HTML.

Provide an analysis that would be valuable for policymakers, conservationists, and local communities.
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

        console.log(`✅ Generated and cached analysis for ${zone.name}`);
        generated++;

        if (generated < zones.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`❌ Error generating analysis for ${zone.name}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: `Impact generation complete`,
      stats: {
        total: zones.length,
        generated,
        skipped,
        cached: skipped
      }
    });

  } catch (error) {
    console.error('Generate impacts error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;

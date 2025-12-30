const axios = require('axios');

exports.analyzeImpact = async (req, res) => {
  try {
    const { zone } = req.body;
    
    if (!zone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Zone data is required' 
      });
    }

    const prompt = `
Act as an environmental scientist. Analyze this environmental risk zone:

Zone Name: ${zone.name}
Hazard Type: ${zone.hazard}
Importance Level: ${zone.importance}/10
Species Affected: ${zone.species ? zone.species.join(", ") : "Various"}
Current Impact: ${zone.impact}

Provide a concise HTML-formatted analysis (no markdown) with:
1. <strong>Short-term Impact (1-5 years):</strong> Describe immediate consequences
2. <strong>Long-term Impact (10+ years):</strong> Describe future consequences if unaddressed
3. <strong>Recommended Action:</strong> One specific, actionable solution

Keep it under 200 words total.
    `;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );

    const aiText = response.data.candidates[0].content.parts[0].text;
    res.json({ success: true, data: aiText });
  } catch (error) {
    console.error('AI Analysis error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.error?.message || error.message 
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
Act as an expert Environmental Scientist with deep knowledge of ecology, climate change, and sustainability.

User Question: "${question}"

Provide a clear, accurate answer in 2-3 sentences. Use HTML formatting with <strong> tags for emphasis where appropriate.
    `;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

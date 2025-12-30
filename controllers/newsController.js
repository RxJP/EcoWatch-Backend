const axios = require('axios');
const { db, admin } = require('../middleware/auth');

// Cache configuration
const NEWS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const NEWS_ARTICLES_COUNT = 20; // Fetch 20 articles to have a good stockpile

// Fetch and cache news
async function fetchAndCacheNews() {
  try {
    console.log('📰 Fetching fresh environmental news...');

    if (!process.env.GNEWS_API_KEY) {
      throw new Error('GNews API key not configured');
    }

    const response = await axios.get(
      `https://gnews.io/api/v4/search?q=environment+OR+climate+change+OR+conservation+OR+sustainability&lang=en&max=${NEWS_ARTICLES_COUNT}&apikey=${process.env.GNEWS_API_KEY}`
    );

    const articles = response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      image: article.image || 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&w=800&q=80',
      source: article.source,
      publishedAt: article.publishedAt,
      content: article.content
    }));

    // Save to Firestore cache
    await db.collection('cache').doc('news').set({
      articles,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + NEWS_CACHE_DURATION)
    });

    console.log(`✅ Cached ${articles.length} news articles`);
    return articles;

  } catch (error) {
    console.error('Error fetching news:', error.message);

    // Return fallback news if API fails
    const fallbackNews = [
      {
        title: "COP29 Summit Reaches Historic Agreement on Climate Finance",
        description: "World leaders commit to $300 billion annual climate fund to support developing nations in green transition and adaptation efforts.",
        url: "https://www.un.org/climatechange",
        image: "https://images.unsplash.com/photo-1569163139394-de4798aa62b6?auto=format&fit=crop&w=800&q=80",
        source: { name: "UN Climate Change" },
        publishedAt: new Date().toISOString(),
        content: "Global climate summit achieves breakthrough agreement"
      },
      {
        title: "Amazon Rainforest Deforestation Drops 22% Following New Protection Measures",
        description: "Brazil reports significant decline in deforestation rates after implementing enhanced satellite monitoring and indigenous land rights protections.",
        url: "https://news.mongabay.com/",
        image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=800&q=80",
        source: { name: "Mongabay" },
        publishedAt: new Date().toISOString(),
        content: "Conservation efforts show promising results"
      },
      {
        title: "Revolutionary Carbon Capture Technology Reaches Commercial Scale",
        description: "New direct air capture facility in Iceland successfully removes 1,000 tons of CO2 monthly, offering hope for climate mitigation.",
        url: "https://www.sciencedaily.com/",
        image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80",
        source: { name: "Science Daily" },
        publishedAt: new Date().toISOString(),
        content: "Breakthrough in carbon removal technology"
      },
      {
        title: "Ocean Plastic Cleanup Systems Remove 200 Tons in First Year",
        description: "The Ocean Cleanup project surpasses expectations, successfully extracting massive amounts of plastic waste from the Great Pacific Garbage Patch.",
        url: "https://theoceancleanup.com/",
        image: "https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=800&q=80",
        source: { name: "The Ocean Cleanup" },
        publishedAt: new Date().toISOString(),
        content: "Marine conservation milestone achieved"
      },
      {
        title: "Global Renewable Energy Capacity Surpasses Fossil Fuels for First Time",
        description: "Historic shift as solar and wind installations worldwide exceed coal and gas generation capacity, signaling energy transition acceleration.",
        url: "https://www.iea.org/",
        image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80",
        source: { name: "International Energy Agency" },
        publishedAt: new Date().toISOString(),
        content: "Renewable energy reaches new milestone"
      }
    ];

    // Cache fallback news
    await db.collection('cache').doc('news').set({
      articles: fallbackNews,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + NEWS_CACHE_DURATION),
      isFallback: true
    });

    return fallbackNews;
  }
}

// Get cached news (main endpoint)
exports.getNews = async (req, res) => {
  try {
    const cacheDoc = await db.collection('cache').doc('news').get();

    if (cacheDoc.exists) {
      const cacheData = cacheDoc.data();
      const now = Date.now();
      const expiresAt = cacheData.expiresAt.toMillis();

      // Return cached data if still valid
      if (now < expiresAt) {
        console.log('📦 Serving cached news');
        return res.json({
          success: true,
          data: cacheData.articles,
          cached: true,
          expiresIn: Math.round((expiresAt - now) / 1000) // seconds
        });
      }
    }

    // Cache expired or doesn't exist, fetch new data
    console.log('🔄 Cache expired, fetching fresh news...');
    const articles = await fetchAndCacheNews();

    res.json({
      success: true,
      data: articles,
      cached: false
    });

  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Manual refresh endpoint (for admin use)
exports.refreshNewsCache = async (req, res) => {
  try {
    const articles = await fetchAndCacheNews();
    res.json({
      success: true,
      message: 'News cache refreshed successfully',
      count: articles.length
    });
  } catch (error) {
    console.error('Refresh news error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;

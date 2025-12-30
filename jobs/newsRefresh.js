const axios = require('axios');
const { db, admin } = require('../middleware/auth');

const NEWS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const NEWS_ARTICLES_COUNT = 20;

async function refreshNewsCache() {
  try {
    console.log('🔄 [Scheduled] Refreshing news cache...');

    if (!process.env.GNEWS_API_KEY) {
      console.log('⚠️  GNews API key not configured, skipping refresh');
      return;
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

    await db.collection('cache').doc('news').set({
      articles,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + NEWS_CACHE_DURATION)
    });

    console.log(`✅ [Scheduled] Cached ${articles.length} news articles`);

  } catch (error) {
    console.error('❌ [Scheduled] Error refreshing news:', error.message);
  }
}

function startNewsRefreshJob() {
  refreshNewsCache();

  setInterval(refreshNewsCache, NEWS_CACHE_DURATION);

  console.log('📅 News refresh job started (every 30 minutes)');
}

module.exports = { startNewsRefreshJob };

// src/controllers/newsController.js
// Handles GET /api/news

exports.getNews = async (req, res) => {
  try {
    const articles = [
      {
        id: 'news-1',
        title: 'Pune Mandates Solar Installation on Commercial Buildings',
        summary: 'Municipal authorities issue updated green building guidelines to improve energy self-sufficiency and reduce carbon footprint.',
        category: 'Policy',
        source: 'EcoSathi Environmental Bulletin',
        date: new Date().toISOString(),
        url: '#',
      },
      {
        id: 'news-2',
        title: 'Community Tree Plantation Drive Reaches 50,000 Saplings Target',
        summary: 'Citizens across Maharashtra collaborate with youth clubs and NGOs to expand urban forest canopy across 12 sectors.',
        category: 'Community',
        source: 'Green India Times',
        date: new Date(Date.now() - 86400000).toISOString(),
        url: '#',
      },
      {
        id: 'news-3',
        title: 'Air Quality Sensors Installed Across Metro Corridor Hotspots',
        summary: 'Real-time hyper-local air pollution tracking enabled to detect construction dust and vehicular exhaust spike zones.',
        category: 'Technology',
        source: 'Urban Climate Watch',
        date: new Date(Date.now() - 172800000).toISOString(),
        url: '#',
      },
    ];

    res.status(200).json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const hasApiKey = Boolean(process.env.OPENAI_API_KEY);
  const hasAccessToken = Boolean(process.env.CAREERNAVIQ_ACCESS_TOKEN);

  res.status(200).json({
    configured: hasApiKey && hasAccessToken,
    hasApiKey,
    hasAccessToken,
    model: process.env.OPENAI_MODEL || 'gpt-6-luna'
  });
};

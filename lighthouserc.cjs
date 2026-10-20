module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist/calcmot-site/browser',
      url: ['http://localhost/ferramentas/corrida-vale-a-pena/'],
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage --headless',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        'categories:seo': ['error', { minScore: 1 }],
        'categories:accessibility': ['warn', { minScore: 0.95 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-results',
    },
  },
};

import { lighthouseScanner, axios, fs, xml2js } from '../setup';

describe('getSitemapUrls', () => {
  test.skip('should return array of valid URLs', async () => {
    fs.readFileSync.mockReturnValue(Buffer.from('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/page1</loc></url><url><loc>https://example.com/page2</loc></url></urlset>', 'utf-8'));
    fs.existsSync.mockReturnValue(true);
    
    axios.get.mockResolvedValue({ data: '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/page1</loc></url><url><loc>https://example.com/page2</loc></url></urlset>' });

    xml2js.Parser.prototype.parseStringPromise.mockResolvedValue({
      urlset: {
        url: [
          {
            loc: [
              'https://example.com/page1',
            ],
          },
          {
            loc: [
              'https://example.com/page2',
            ],
          },
        ],
      },
    });

    const sitemapUrl = 'https://example.com/sitemap.xml';
    const result = await lighthouseScanner.getSitemapUrls(sitemapUrl);
    expect(result).toEqual([
      'https://example.com/page1',
      'https://example.com/page2',
    ]);
  });
});
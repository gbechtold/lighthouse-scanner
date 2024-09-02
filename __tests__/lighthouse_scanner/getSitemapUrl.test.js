import { lighthouseScanner, axios } from '../setup.js';
import { jest } from '@jest/globals';

describe('getSitemapUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return the input URL if it ends with sitemap.xml', async () => {
    const inputUrl = 'https://example.com/sitemap.xml';
    const result = await lighthouseScanner.getSitemapUrl(inputUrl);
    expect(result).toBe(inputUrl);
  });

  test('should check multiple possible sitemap URLs', async () => {
    const inputUrl = 'https://example.com';
    const expectedSitemapUrls = [
      'https://example.com/sitemap.xml',
      'https://example.com/sitemap_index.xml',
      'https://example.com/sitemap',
      'https://example.com/sitemap.php',
    ];
    
    axios.head.mockRejectedValueOnce(new Error('Not found'))
             .mockRejectedValueOnce(new Error('Not found'))
             .mockResolvedValueOnce({});

    const result = await lighthouseScanner.getSitemapUrl(inputUrl);
    expect(result).toBe(expectedSitemapUrls[2]);
    expect(axios.head).toHaveBeenCalledTimes(3);
    expectedSitemapUrls.slice(0, 3).forEach(url => {
      expect(axios.head).toHaveBeenCalledWith(url);
    });
  });

  test('should throw an error if sitemap is not found', async () => {
    const inputUrl = 'https://example.com';
    
    axios.head.mockRejectedValue(new Error('Not found'));

    await expect(lighthouseScanner.getSitemapUrl(inputUrl))
      .rejects.toThrow('Sitemap not found for https://example.com/');
  });
});
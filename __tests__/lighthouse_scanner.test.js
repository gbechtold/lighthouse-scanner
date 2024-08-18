import { jest } from '@jest/globals';
import axios from 'axios';
import readline from 'readline';

jest.mock('readline');

let lighthouseScanner;
let originalAxiosHead;

beforeAll(async () => {
  jest.mock('fs-extra', () => ({
    writeFileSync: jest.fn(),
    existsSync: jest.fn(),
    readFileSync: jest.fn()
  }));

  jest.mock('xml2js', () => ({
    Parser: jest.fn().mockImplementation(() => ({
      parseStringPromise: jest.fn()
    }))
  }));

  jest.mock('puppeteer', () => ({
    launch: jest.fn().mockResolvedValue({
      wsEndpoint: jest.fn().mockReturnValue('ws://localhost:1234'),
      close: jest.fn()
    })
  }));

  jest.mock('lighthouse', () => jest.fn());

  originalAxiosHead = axios.head;
  lighthouseScanner = await import('../lighthouse_scanner.js');
});

afterAll(() => {
  axios.head = originalAxiosHead;
});

describe('Lighthouse Scanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.head = jest.fn();
  });

  afterEach(() => {
    axios.head = originalAxiosHead;
  });

  describe('normalizeUrl', () => {
    test('should add https:// if protocol is missing', () => {
      expect(lighthouseScanner.normalizeUrl('example.com')).toBe('https://example.com/');
    });

    test('should remove www. from the URL', () => {
      expect(lighthouseScanner.normalizeUrl('https://www.example.com')).toBe('https://example.com/');
    });

    test('should handle URLs with http://', () => {
      expect(lighthouseScanner.normalizeUrl('http://example.com')).toBe('http://example.com/');
    });

    test('should throw an error for invalid URLs', () => {
      expect(() => lighthouseScanner.normalizeUrl('not a url')).toThrow('Invalid URL provided');
    });
  });

  describe('getSitemapUrl', () => {
    test('should return the input URL if it ends with sitemap.xml', async () => {
      const inputUrl = 'https://example.com/sitemap.xml';
      const result = await lighthouseScanner.getSitemapUrl(inputUrl);
      expect(result).toBe(inputUrl);
    });

    test('should construct and check sitemap URL if input does not end with sitemap.xml', async () => {
      const inputUrl = 'https://example.com';
      const expectedSitemapUrl = 'https://example.com/sitemap.xml';
      
      axios.head.mockResolvedValueOnce({});

      const result = await lighthouseScanner.getSitemapUrl(inputUrl);
      expect(result).toBe(expectedSitemapUrl);
      expect(axios.head).toHaveBeenCalledWith(expectedSitemapUrl);
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

  // Add more tests for other functions as needed
});
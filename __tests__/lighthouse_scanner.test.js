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

afterAll(async () => {
  axios.head = originalAxiosHead;
  
  // If lighthouse_scanner.js sets up any global resources, clean them up here
  if (lighthouseScanner.cleanup && typeof lighthouseScanner.cleanup === 'function') {
    await lighthouseScanner.cleanup();
  }
  
  // Clear all mocks
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe('Lighthouse Scanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.head = jest.fn();
  });

  afterEach(() => {
    axios.head = originalAxiosHead;
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
      
      axios.head.mockResolvedValue({});

      const result = await lighthouseScanner.getSitemapUrl(inputUrl);
      expect(result).toBe(expectedSitemapUrl);
      expect(axios.head).toHaveBeenCalledWith(expectedSitemapUrl);
    });

    test('should throw an error if sitemap is not found', async () => {
      const inputUrl = 'https://example.com';
      const expectedSitemapUrl = 'https://example.com/sitemap.xml';
      
      axios.head.mockRejectedValue(new Error('Not found'));

      await expect(lighthouseScanner.getSitemapUrl(inputUrl)).rejects.toThrow(`Sitemap not found at ${expectedSitemapUrl}`);
    });
  });

  // Add more describe blocks here for other functions in lighthouse_scanner.js
});
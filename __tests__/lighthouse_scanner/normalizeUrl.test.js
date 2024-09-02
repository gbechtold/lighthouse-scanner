import { lighthouseScanner } from '../setup.js';

describe('normalizeUrl', () => {
  test.skip('should add https:// if protocol is missing', () => {
    expect(lighthouseScanner.normalizeUrl('example.com')).toBe('https://example.com/');
  });

  test.skip('should remove www. from the URL', () => {
    expect(lighthouseScanner.normalizeUrl('https://www.example.com')).toBe('https://example.com/');
  });

  test.skip('should handle URLs with http://', () => {
    expect(lighthouseScanner.normalizeUrl('http://example.com')).toBe('http://example.com/');
  });

  test.skip('should throw an error for invalid URLs', () => {
    expect(() => lighthouseScanner.normalizeUrl('not a url')).toThrow('Invalid URL provided');
  });
});
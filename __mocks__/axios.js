console.log('Mocked axios module is being loaded');

const mockAxios = {
  head: jest.fn(() => {
    console.log('mockAxios.head was called');
    return Promise.resolve({});
  }),
};

mockAxios.head.mockResolvedValue = jest.fn((value) => {
  console.log('mockAxios.head.mockResolvedValue was called with:', value);
  mockAxios.head.mockImplementation(() => Promise.resolve(value));
});

mockAxios.head.mockRejectedValue = jest.fn((error) => {
  console.log('mockAxios.head.mockRejectedValue was called with:', error);
  mockAxios.head.mockImplementation(() => Promise.reject(error));
});

console.log('Mocked axios module:', mockAxios);

export default mockAxios;
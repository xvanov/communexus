// Mock for react-native
const Platform = {
  OS: 'ios',
  select: jest.fn(obj => obj.ios || obj.default),
};

module.exports = {
  Platform,
};

module.exports = {
  string: jest.fn(),
  number: jest.fn(),
  object: jest.fn(),
  array: () => ({
    items: jest.fn()
  })
};

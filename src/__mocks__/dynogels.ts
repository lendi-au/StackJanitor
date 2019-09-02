module.exports = {
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  AWS: {
    config: {
      update: jest.fn()
    }
  },
  define: () => ({
    create: jest.fn()
  })
};

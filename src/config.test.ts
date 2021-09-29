describe("config", () => {
  test("it shoud match with the default config", () => {
    const config = require("./config");
    expect(config).toMatchSnapshot();
  });
  test.skip("dry run mode from environment", () => {
    process.env.DRY_RUN = "true";
    const config2 = require("../src/config");
    expect(config2.default.DRY_RUN).toEqual("true");
  });
});

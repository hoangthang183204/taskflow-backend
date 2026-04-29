
const xss = require("xss");

module.exports = (data) => {
  if (!data) return data;

  if (typeof data === "string") {
    return xss(data.trim());
  }

  if (typeof data === "object") {
    const result = {};
    for (let key in data) {
      result[key] = module.exports(data[key]);
    }
    return result;
  }

  return data;
};
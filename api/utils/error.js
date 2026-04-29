
module.exports = (code, message, status = 400) => {
  return { code, message, status };
};
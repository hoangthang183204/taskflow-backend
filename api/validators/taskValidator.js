// api/validators/taskValidator.js
const PRIORITY = ["low", "medium", "high"];
const STATUS = ["todo", "doing", "done"];

const isValidDate = (dateString) => {
  if (!dateString) return true;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

module.exports = {
  validateCreate: (data) => {
    const errors = [];

    // ✅ Title bắt buộc
    if (!data.title || typeof data.title !== "string") {
      errors.push("TITLE_REQUIRED");
    }

    // ✅ Title không quá dài
    if (data.title && data.title.length > 255) {
      errors.push("TITLE_TOO_LONG");
    }

    // ✅ Priority phải hợp lệ
    if (data.priority && !PRIORITY.includes(data.priority)) {
      errors.push("INVALID_PRIORITY");
    }

    // ✅ DueDate phải là ngày hợp lệ (nếu có)
    if (data.dueDate && !isValidDate(data.dueDate)) {
      errors.push("INVALID_DUE_DATE");
    }

    // ❌ ĐÃ XÓA: startDate, endDate, estimatedHours validation

    return errors;
  },

  // api/validators/taskValidator.js
  validateUpdate: (data) => {
    const errors = [];

    if (data.status && !STATUS.includes(data.status)) {
      errors.push("INVALID_STATUS");
    }

    if (data.priority && !PRIORITY.includes(data.priority)) {
      errors.push("INVALID_PRIORITY");
    }

    if (data.dueDate && !isValidDate(data.dueDate)) {
      errors.push("INVALID_DUE_DATE");
    }

    if (data.mood && !["happy", "neutral", "sad"].includes(data.mood)) {
      errors.push("INVALID_MOOD");
    }

    return errors;
  },
};

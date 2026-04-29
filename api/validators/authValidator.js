
const validator = require("validator");

const validateEmail = (email) => {
  if (!email) {
    return { valid: false, code: "EMAIL_REQUIRED", message: "Email là bắt buộc" };
  }
  
  if (!validator.isEmail(email)) {
    return { valid: false, code: "INVALID_EMAIL", message: "Email không hợp lệ" };
  }
  
  return { valid: true };
};

const validatePassword = (password, minLength = 6) => {
  if (!password) {
    return { valid: false, code: "PASSWORD_REQUIRED", message: "Mật khẩu là bắt buộc" };
  }
  
  if (password.length < minLength) {
    return { 
      valid: false, 
      code: "PASSWORD_TOO_SHORT", 
      message: `Mật khẩu phải có ít nhất ${minLength} ký tự` 
    };
  }
  
  return { valid: true };
};

const validateName = (name) => {
  if (!name) {
    return { valid: false, code: "NAME_REQUIRED", message: "Tên là bắt buộc" };
  }
  
  if (name.length < 2) {
    return { valid: false, code: "NAME_TOO_SHORT", message: "Tên phải có ít nhất 2 ký tự" };
  }
  
  if (name.length > 100) {
    return { valid: false, code: "NAME_TOO_LONG", message: "Tên không được vượt quá 100 ký tự" };
  }
  
  return { valid: true };
};

module.exports = {
  validateRegister: (data) => {
    const errors = [];
    const errorCodes = [];

    const nameValidation = validateName(data.name);
    if (!nameValidation.valid) {
      errors.push(nameValidation.message);
      errorCodes.push(nameValidation.code);
    }

    const emailValidation = validateEmail(data.email);
    if (!emailValidation.valid) {
      errors.push(emailValidation.message);
      errorCodes.push(emailValidation.code);
    }

    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      errors.push(passwordValidation.message);
      errorCodes.push(passwordValidation.code);
    }

    return {
      valid: errors.length === 0,
      errors,
      errorCodes,
    };
  },

  validateLogin: (data) => {
    const errors = [];
    const errorCodes = [];

    if (!data.email) {
      errors.push("Email là bắt buộc");
      errorCodes.push("EMAIL_REQUIRED");
    }

    if (!data.password) {
      errors.push("Mật khẩu là bắt buộc");
      errorCodes.push("PASSWORD_REQUIRED");
    }

    if (data.email && !validator.isEmail(data.email)) {
      errors.push("Email không hợp lệ");
      errorCodes.push("INVALID_EMAIL");
    }

    return {
      valid: errors.length === 0,
      errors,
      errorCodes,
    };
  },

  validateUpdateProfile: (data) => {
    const errors = [];
    const errorCodes = [];

    if (data.name !== undefined) {
      const nameValidation = validateName(data.name);
      if (!nameValidation.valid) {
        errors.push(nameValidation.message);
        errorCodes.push(nameValidation.code);
      }
    }

    if (data.email !== undefined) {
      const emailValidation = validateEmail(data.email);
      if (!emailValidation.valid) {
        errors.push(emailValidation.message);
        errorCodes.push(emailValidation.code);
      }
    }

    if (data.password !== undefined) {
      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.valid) {
        errors.push(passwordValidation.message);
        errorCodes.push(passwordValidation.code);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      errorCodes,
    };
  },

  validateChangePassword: (data) => {
    const errors = [];
    const errorCodes = [];

    if (!data.oldPassword) {
      errors.push("Mật khẩu cũ là bắt buộc");
      errorCodes.push("OLD_PASSWORD_REQUIRED");
    }

    if (!data.newPassword) {
      errors.push("Mật khẩu mới là bắt buộc");
      errorCodes.push("NEW_PASSWORD_REQUIRED");
    }

    if (data.newPassword && data.newPassword.length < 6) {
      errors.push("Mật khẩu mới phải có ít nhất 6 ký tự");
      errorCodes.push("PASSWORD_TOO_SHORT");
    }

    if (data.oldPassword && data.newPassword && data.oldPassword === data.newPassword) {
      errors.push("Mật khẩu mới không được trùng với mật khẩu cũ");
      errorCodes.push("PASSWORD_SAME_AS_OLD");
    }

    return {
      valid: errors.length === 0,
      errors,
      errorCodes,
    };
  },

  validateEmail,
  validatePassword,
  validateName,
};
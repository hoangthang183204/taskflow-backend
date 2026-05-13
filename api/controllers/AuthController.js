const AuthService = require("../services/AuthService");
const response = require("../utils/response");
const authValidator = require("../validators/authValidator");

module.exports = {
  register: async (req, res) => {
    try {
      const validation = authValidator.validateRegister(req.body);
      if (!validation.valid) {
        const firstError = validation.errorCodes[0];
        switch (firstError) {
          case "NAME_REQUIRED":
          case "NAME_TOO_SHORT":
          case "NAME_TOO_LONG":
            return response.badRequest(res, validation.errors[0], firstError);
          case "EMAIL_REQUIRED":
          case "INVALID_EMAIL":
            return response.badRequest(res, validation.errors[0], firstError);
          case "PASSWORD_REQUIRED":
          case "PASSWORD_TOO_SHORT":
            return response.badRequest(res, validation.errors[0], firstError);
          default:
            return response.badRequest(
              res,
              validation.errors[0],
              "VALIDATION_ERROR",
            );
        }
      }

      const user = await AuthService.register(req.body);
      return response.success(res, user, "Đăng ký thành công.", 201);
    } catch (err) {
      switch (err.message) {
        case "EMAIL_EXISTS":
          return response.badRequest(res, "Email đã tồn tại.", "EMAIL_EXISTS");
        default:
          console.error("Register error:", err);
          return response.serverError(res, "Lỗi server, vui lòng thử lại sau.");
      }
    }
  },

  login: async (req, res) => {
    try {
      const validation = authValidator.validateLogin(req.body);
      if (!validation.valid) {
        const firstError = validation.errorCodes[0];
        switch (firstError) {
          case "EMAIL_REQUIRED":
          case "INVALID_EMAIL":
            return response.badRequest(res, validation.errors[0], firstError);
          case "PASSWORD_REQUIRED":
            return response.badRequest(res, validation.errors[0], firstError);
          default:
            return response.badRequest(
              res,
              validation.errors[0],
              "VALIDATION_ERROR",
            );
        }
      }

      const result = await AuthService.login(req.body);
      return response.success(res, result, "Đăng nhập thành công.");
    } catch (err) {
      switch (err.message) {
        case "USER_NOT_FOUND":
          return response.badRequest(
            res,
            "Email không tồn tại trong hệ thống.",
            "USER_NOT_FOUND",
          );
        case "INVALID_PASSWORD":
          return response.badRequest(
            res,
            "Mật khẩu không chính xác.",
            "INVALID_PASSWORD",
          );
        case "ACCOUNT_DELETED":
          return response.badRequest(
            res,
            "Tài khoản đã bị xóa. Vui lòng liên hệ hỗ trợ.",
            "ACCOUNT_DELETED",
          );
        default:
          console.error("Login error:", err);
          return response.serverError(res, "Lỗi server, vui lòng thử lại sau.");
      }
    }
  },

  getMe: async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return response.unauthorized(res, "Vui lòng đăng nhập.");
      }

      const user = await AuthService.getCurrentUser(req.user.id);
      return response.success(res, user, "Lấy thông tin thành công.");
    } catch (err) {
      if (err.message === "USER_NOT_FOUND") {
        return response.notFound(
          res,
          "Không tìm thấy người dùng.",
          "USER_NOT_FOUND",
        );
      }
      console.error("GetMe error:", err);
      return response.serverError(res, "Lỗi server.");
    }
  },

  updateProfile: async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return response.unauthorized(res, "Vui lòng đăng nhập.");
      }

      const validation = authValidator.validateUpdateProfile(req.body);
      if (!validation.valid) {
        const firstError = validation.errorCodes[0];
        switch (firstError) {
          case "NAME_REQUIRED":
          case "NAME_TOO_SHORT":
          case "NAME_TOO_LONG":
            return response.badRequest(res, validation.errors[0], firstError);
          case "INVALID_EMAIL":
            return response.badRequest(res, validation.errors[0], firstError);
          case "PASSWORD_TOO_SHORT":
            return response.badRequest(res, validation.errors[0], firstError);
          default:
            return response.badRequest(
              res,
              validation.errors[0],
              "VALIDATION_ERROR",
            );
        }
      }

      const user = await AuthService.updateUser(req.user.id, req.body);
      return response.success(res, user, "Cập nhật thông tin thành công.");
    } catch (err) {
      switch (err.message) {
        case "USER_NOT_FOUND":
          return response.notFound(
            res,
            "Không tìm thấy người dùng.",
            "USER_NOT_FOUND",
          );
        case "EMAIL_EXISTS":
          return response.badRequest(res, "Email đã tồn tại.", "EMAIL_EXISTS");
        default:
          console.error("Update profile error:", err);
          return response.serverError(res, "Lỗi server.");
      }
    }
  },

  changePassword: async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return response.unauthorized(res, "Vui lòng đăng nhập.");
      }

      const validation = authValidator.validateChangePassword(req.body);
      if (!validation.valid) {
        const firstError = validation.errorCodes[0];
        switch (firstError) {
          case "OLD_PASSWORD_REQUIRED":
          case "NEW_PASSWORD_REQUIRED":
            return response.badRequest(res, validation.errors[0], firstError);
          case "PASSWORD_TOO_SHORT":
            return response.badRequest(res, validation.errors[0], firstError);
          case "PASSWORD_SAME_AS_OLD":
            return response.badRequest(res, validation.errors[0], firstError);
          default:
            return response.badRequest(
              res,
              validation.errors[0],
              "VALIDATION_ERROR",
            );
        }
      }

      await AuthService.changePassword(
        req.user.id,
        req.body.oldPassword,
        req.body.newPassword,
      );

      return response.success(res, null, "Đổi mật khẩu thành công.");
    } catch (err) {
      switch (err.message) {
        case "USER_NOT_FOUND":
          return response.notFound(
            res,
            "Không tìm thấy người dùng.",
            "USER_NOT_FOUND",
          );
        case "INVALID_OLD_PASSWORD":
          return response.badRequest(
            res,
            "Mật khẩu cũ không chính xác.",
            "INVALID_OLD_PASSWORD",
          );
        default:
          console.error("Change password error:", err);
          return response.serverError(res, "Lỗi server.");
      }
    }
  },

  deleteAccount: async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return response.unauthorized(res, "Vui lòng đăng nhập.");
      }

      const result = await AuthService.deleteAccount(req.user.id);
      return response.success(res, null, "Tài khoản đã được xóa thành công.");
    } catch (err) {
      console.error("Delete account error:", err);
      if (err.message === "USER_NOT_FOUND") {
        return response.notFound(
          res,
          "Không tìm thấy người dùng.",
          "USER_NOT_FOUND",
        );
      }
      return response.serverError(res, "Lỗi server, vui lòng thử lại sau.");
    }
  },
};

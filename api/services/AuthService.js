const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = {
  register: async (userData) => {
    const { name, email, password } = userData;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new Error("EMAIL_EXISTS");
    }

    const user = await User.create({ name, email, password }).fetch();

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  login: async (credentials) => {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new Error("MISSING_CREDENTIALS");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (user.isDeleted === true) {
      throw new Error("ACCOUNT_DELETED");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("INVALID_PASSWORD");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  },

  getCurrentUser: async (userId) => {
    const user = await User.findOne({ id: userId });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  updateUser: async (userId, updateData) => {
    const { email, password } = updateData;

    const user = await User.findOne({ id: userId });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        throw new Error("EMAIL_EXISTS");
      }
    }

    const dataToUpdate = { ...updateData };
    if (dataToUpdate.password) {
      dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, 10);
    }

    const updatedUser = await User.updateOne({ id: userId }).set(dataToUpdate);

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  },

  changePassword: async (userId, oldPassword, newPassword) => {
    const user = await User.findOne({ id: userId });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new Error("INVALID_OLD_PASSWORD");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ id: userId }).set({ password: hashedPassword });

    return true;
  },

  deleteAccount: async (userId) => {
    const user = await User.findOne({ id: userId, isDeleted: false });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Soft delete user
    await User.updateOne({ id: userId }).set({
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    });

    // Soft delete all tasks của user
    await Task.update({ userId: userId }).set({
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    });

    return true;
  },
};


const { expect } = require("chai");
const sinon = require("sinon");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

describe("AuthService", () => {
  let sandbox;
  let AuthService;
  let UserMock;
  let updateOneMock;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    updateOneMock = {
      set: sandbox.stub().returnsThis(),
    };

    UserMock = {
      findOne: sandbox.stub(),
      create: sandbox.stub(),
      updateOne: sandbox.stub().returns(updateOneMock),
      find: sandbox.stub(),
      count: sandbox.stub(),
    };

    sandbox.stub(bcrypt, "compare").resolves(true);
    sandbox.stub(bcrypt, "hash").resolves("hashedPassword123");
    sandbox.stub(jwt, "sign").returns("fake-jwt-token");

    global.User = UserMock;
    process.env.JWT_SECRET = "test-secret-key";

    delete require.cache[require.resolve("../../api/services/AuthService")];
    AuthService = require("../../api/services/AuthService");
  });

  afterEach(() => {
    sandbox.restore();
    delete global.User;
    delete process.env.JWT_SECRET;
  });

  describe("register()", () => {
    it("should throw EMAIL_EXISTS when email already exists", async () => {
      UserMock.findOne.resolves({ id: 1, email: "thang@gmail.com" });

      try {
        await AuthService.register({
          name: "Test User",
          email: "thang@gmail.com",
          password: "123456",
        });
        expect.fail("Should have thrown EMAIL_EXISTS error");
      } catch (err) {
        expect(err.message).to.equal("EMAIL_EXISTS");
      }
    });

    it("should register successfully when email is new", async () => {
      UserMock.findOne.resolves(null);

      const mockUser = {
        id: 1,
        name: "New User",
        email: "new@example.com",
        password: "hashedPassword123",
      };

      UserMock.create.returns({
        fetch: sandbox.stub().resolves(mockUser),
      });

      const result = await AuthService.register({
        name: "New User",
        email: "new@example.com",
        password: "123456",
      });

      expect(result).to.have.property("name", "New User");
      expect(result).to.have.property("email", "new@example.com");
      expect(result).to.not.have.property("password");
    });
  });

  describe("login()", () => {
    it("should throw USER_NOT_FOUND when email not exists", async () => {
      UserMock.findOne.resolves(null);

      try {
        await AuthService.login({
          email: "notfound@example.com",
          password: "123456",
        });
        expect.fail("Should have thrown USER_NOT_FOUND error");
      } catch (err) {
        expect(err.message).to.equal("USER_NOT_FOUND");
      }
    });

    it("should throw INVALID_PASSWORD when password is wrong", async () => {
      bcrypt.compare.resolves(false);

      UserMock.findOne.resolves({
        id: 1,
        email: "test@example.com",
        password: "hashedPassword123",
      });

      try {
        await AuthService.login({
          email: "test@example.com",
          password: "wrongpassword",
        });
        expect.fail("Should have thrown INVALID_PASSWORD error");
      } catch (err) {
        expect(err.message).to.equal("INVALID_PASSWORD");
      }

      bcrypt.compare.resolves(true);
    });

    it("should login successfully with correct credentials", async () => {
      bcrypt.compare.resolves(true);

      UserMock.findOne.resolves({
        id: 1,
        name: "Test User",
        email: "test@example.com",
        password: "hashedPassword123",
      });

      const result = await AuthService.login({
        email: "test@example.com",
        password: "123456",
      });

      expect(result).to.have.property("token", "fake-jwt-token");
      expect(result.user).to.have.property("email", "test@example.com");
      expect(result.user).to.have.property("name", "Test User");

      expect(UserMock.findOne.calledOnce).to.be.true;
      expect(bcrypt.compare.calledOnce).to.be.true;
      expect(jwt.sign.calledOnce).to.be.true;
    });
  });

  describe("getCurrentUser()", () => {
    it("should return user without password when user exists", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        password: "hashedPassword123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      UserMock.findOne.resolves(mockUser);

      const result = await AuthService.getCurrentUser(1);

      expect(result).to.have.property("id", 1);
      expect(result).to.have.property("name", "Test User");
      expect(result).to.have.property("email", "test@example.com");
      expect(result).to.not.have.property("password");
      expect(UserMock.findOne.calledOnce).to.be.true;
    });

    it("should throw USER_NOT_FOUND when user does not exist", async () => {
      UserMock.findOne.resolves(null);

      try {
        await AuthService.getCurrentUser(999);
        expect.fail("Should have thrown USER_NOT_FOUND error");
      } catch (err) {
        expect(err.message).to.equal("USER_NOT_FOUND");
      }
    });
  });

  describe("updateUser()", () => {
    it("should throw USER_NOT_FOUND when user does not exist", async () => {
      UserMock.findOne.resolves(null);

      try {
        await AuthService.updateUser(999, { name: "New Name" });
        expect.fail("Should have thrown USER_NOT_FOUND error");
      } catch (err) {
        expect(err.message).to.equal("USER_NOT_FOUND");
      }
    });

    it.skip("should update user successfully", async () => {
      const existingUser = {
        id: 1,
        name: "Old Name",
        email: "old@example.com",
        password: "hashedPassword",
      };

      const updatedUser = {
        id: 1,
        name: "New Name",
        email: "old@example.com",
        password: "hashedPassword",
      };

      UserMock.findOne.resolves(existingUser);
      UserMock.updateOne.returns(updatedUser);

      const result = await AuthService.updateUser(1, { name: "New Name" });

      expect(result).to.have.property("name", "New Name");
      expect(UserMock.updateOne.calledOnce).to.be.true;
    });

    it("should throw EMAIL_EXISTS when trying to update to existing email", async () => {
      const existingUser = {
        id: 1,
        name: "User 1",
        email: "user1@example.com",
      };

      const existingEmailUser = {
        id: 2,
        name: "User 2",
        email: "existing@example.com",
      };

      UserMock.findOne.onFirstCall().resolves(existingUser);
      UserMock.findOne.onSecondCall().resolves(existingEmailUser);

      try {
        await AuthService.updateUser(1, { email: "existing@example.com" });
        expect.fail("Should have thrown EMAIL_EXISTS error");
      } catch (err) {
        expect(err.message).to.equal("EMAIL_EXISTS");
      }
    });

    it("should hash password when updating password", async () => {
      const existingUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        password: "oldHashedPassword",
      };

      UserMock.findOne.resolves(existingUser);
      updateOneMock.set.returns({ ...existingUser });

      await AuthService.updateUser(1, { password: "newPassword123" });

      expect(bcrypt.hash.calledOnce).to.be.true;
      expect(bcrypt.hash.calledWith("newPassword123", 10)).to.be.true;
    });
  });

  describe("changePassword()", () => {
    it("should throw USER_NOT_FOUND when user does not exist", async () => {
      UserMock.findOne.resolves(null);

      try {
        await AuthService.changePassword(999, "oldPass", "newPass");
        expect.fail("Should have thrown USER_NOT_FOUND error");
      } catch (err) {
        expect(err.message).to.equal("USER_NOT_FOUND");
      }
    });

    it("should throw INVALID_OLD_PASSWORD when old password is wrong", async () => {
      const mockUser = {
        id: 1,
        password: "hashedPassword",
      };

      UserMock.findOne.resolves(mockUser);
      bcrypt.compare.resolves(false);

      try {
        await AuthService.changePassword(1, "wrongPassword", "newPassword");
        expect.fail("Should have thrown INVALID_OLD_PASSWORD error");
      } catch (err) {
        expect(err.message).to.equal("INVALID_OLD_PASSWORD");
      }
    });

    it("should change password successfully", async () => {
      const mockUser = {
        id: 1,
        password: "oldHashedPassword",
      };

      UserMock.findOne.resolves(mockUser);
      bcrypt.compare.resolves(true);
      bcrypt.hash.resolves("newHashedPassword");
      updateOneMock.set.returns({ id: 1 });

      const result = await AuthService.changePassword(
        1,
        "oldPassword",
        "newPassword123",
      );

      expect(result).to.be.true;
      expect(bcrypt.compare.calledOnce).to.be.true;
      expect(bcrypt.hash.calledOnce).to.be.true;
      expect(UserMock.updateOne.calledWith({ id: 1 })).to.be.true;
      expect(updateOneMock.set.calledWith({ password: "newHashedPassword" })).to
        .be.true;
    });

    it("should call updateOne with correct parameters", async () => {
      const mockUser = {
        id: 1,
        password: "oldHashedPassword",
      };

      UserMock.findOne.resolves(mockUser);
      bcrypt.compare.resolves(true);
      bcrypt.hash.resolves("newHashedPassword456");
      updateOneMock.set.returns({ id: 1 });

      await AuthService.changePassword(1, "oldPassword", "newPassword123");

      expect(UserMock.updateOne.calledWith({ id: 1 })).to.be.true;
      expect(updateOneMock.set.calledWith({ password: "newHashedPassword456" }))
        .to.be.true;
    });
  });
});


const { expect } = require("chai");
const sinon = require("sinon");

describe("TaskService", () => {
  let sandbox;
  let TaskService;
  let TaskMock;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    TaskMock = {
      findOne: sandbox.stub(),
      find: sandbox.stub(),
      count: sandbox.stub(),
      updateOne: sandbox.stub().returns({
        set: sandbox.stub().returnsThis(),
        fetch: sandbox
          .stub()
          .resolves({ id: "123", title: "Updated", isDeleted: true }),
      }),
      create: sandbox.stub().returns({
        fetch: sandbox.stub().resolves({ id: 1, title: "New Task", userId: 1 }),
      }),
    };

    const createErrorMock = sandbox.stub();
    createErrorMock.returns((code, message, status) => {
      const err = new Error(message);
      err.code = code;
      err.status = status;
      return err;
    });

    const sanitizeMock = sandbox.stub().callsFake((data) => data);

    // Mock TaskValidator
    const TaskValidatorMock = {
      validateCreate: sandbox.stub().returns([]),
      validateUpdate: sandbox.stub().returns([]),
    };

    global.Task = TaskMock;
    global.createError = createErrorMock;
    global.sanitize = sanitizeMock;
    global.TaskValidator = TaskValidatorMock;

    delete require.cache[require.resolve("../../api/services/TaskService")];
    TaskService = require("../../api/services/TaskService");
  });

  afterEach(() => {
    sandbox.restore();
    delete global.Task;
    delete global.createError;
    delete global.sanitize;
    delete global.TaskValidator;
  });

  describe("createTask()", () => {
    it("should throw UNAUTHORIZED when user is invalid", async () => {
      try {
        await TaskService.createTask(null, { title: "Test" });
        expect.fail("Should have thrown error");
      } catch (err) {
        expect(err.code).to.equal("UNAUTHORIZED");
      }
    });

    it("should create task successfully", async () => {
      const mockUser = { id: 1, name: "Test User" };
      const taskData = {
        title: "Test Task",
        description: "Test Description",
        priority: "high",
      };

      const mockTask = {
        id: 1,
        title: "Test Task",
        description: "Test Description",
        priority: "high",
        userId: mockUser.id,
      };

      TaskMock.create.returns({
        fetch: sandbox.stub().resolves(mockTask),
      });

      const result = await TaskService.createTask(mockUser, taskData);

      expect(result).to.have.property("title", "Test Task");
      expect(result).to.have.property("userId", mockUser.id);
      expect(TaskMock.create.calledOnce).to.be.true;
    });
  });

  describe("getTasks()", () => {
    it("should get tasks with pagination", async () => {
      const mockUser = { id: 1 };
      const mockTasks = [
        { id: 1, title: "Task 1", userId: mockUser.id },
        { id: 2, title: "Task 2", userId: mockUser.id },
      ];

      TaskMock.find.resolves(mockTasks);
      TaskMock.count.resolves(2);

      const result = await TaskService.getTasks(mockUser, {
        page: 1,
        limit: 5,
      });

      expect(result).to.have.property("tasks");
      expect(result).to.have.property("total", 2);
      expect(result).to.have.property("page", 1);
      expect(result).to.have.property("limit", 5);
      expect(result.tasks).to.have.lengthOf(2);
    });

    it("should filter by status", async () => {
      const mockUser = { id: 1 };
      TaskMock.find.resolves([]);
      TaskMock.count.resolves(0);

      await TaskService.getTasks(mockUser, { status: "doing" });

      expect(TaskMock.find.calledOnce).to.be.true;
    });

    it("should throw INVALID_STATUS when status is invalid", async () => {
      const mockUser = { id: 1 };

      try {
        await TaskService.getTasks(mockUser, { status: "invalid" });
        expect.fail("Should have thrown error");
      } catch (err) {
        expect(err.code).to.equal("INVALID_STATUS");
      }
    });
  });

  describe("updateTask()", () => {
    it("should throw INVALID_ID when id is invalid", async () => {
      const mockUser = { id: 1 };

      try {
        await TaskService.updateTask(mockUser, null, { title: "Update" });
        expect.fail("Should have thrown error");
      } catch (err) {
        expect(err.code).to.equal("INVALID_ID");
      }
    });

    it("should throw TASK_NOT_FOUND when task not found", async () => {
      const mockUser = { id: 1 };
      TaskMock.findOne.resolves(null);

      try {
        await TaskService.updateTask(mockUser, "123", { title: "Update" });
        expect.fail("Should have thrown error");
      } catch (err) {
        expect(err.code).to.equal("TASK_NOT_FOUND");
      }
    });

    it("should update task successfully", async () => {
      const mockUser = { id: 1 };
      const existingTask = {
        id: "123",
        title: "Old Title",
        description: "Old Desc",
        userId: mockUser.id,
        isDeleted: false,
      };

      TaskMock.findOne.resolves(existingTask);

      // Mock updated task result
      const updatedTaskResult = {
        id: "123",
        title: "New Title",
        description: "New Desc",
        userId: mockUser.id,
        isDeleted: false,
      };

      const mockSet = {
        set: sandbox.stub().returns(updatedTaskResult),
      };
      TaskMock.updateOne.returns(mockSet);

      const result = await TaskService.updateTask(mockUser, "123", {
        title: "New Title",
        description: "New Desc",
      });

      expect(result).to.have.property("title", "New Title");
      expect(result).to.have.property("description", "New Desc");
      expect(TaskMock.updateOne.calledOnce).to.be.true;
      expect(TaskMock.updateOne.calledWith({ id: "123" })).to.be.true;
    });
  });

  describe("deleteTask()", () => {
    it("should throw TASK_NOT_FOUND when task not found", async () => {
      const mockUser = { id: 1 };
      TaskMock.findOne.resolves(null);

      try {
        await TaskService.deleteTask(mockUser, "123");
        expect.fail("Should have thrown error");
      } catch (err) {
        expect(err.code).to.equal("TASK_NOT_FOUND");
      }
    });

    it("should soft delete task successfully", async () => {
      const mockUser = { id: 1 };
      const existingTask = {
        id: "123",
        title: "Task to Delete",
        userId: mockUser.id,
        isDeleted: false,
      };

      TaskMock.findOne.resolves(existingTask);

      const updateOneStub = TaskMock.updateOne;
      updateOneStub.returns({
        set: sandbox.stub().returns({
          fetch: sandbox.stub().resolves({
            ...existingTask,
            isDeleted: true,
          }),
        }),
      });

      const result = await TaskService.deleteTask(mockUser, "123");

      expect(result).to.be.true;
      expect(updateOneStub.calledOnce).to.be.true;
    });
  });
});

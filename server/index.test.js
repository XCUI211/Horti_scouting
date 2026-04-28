const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockRelease = jest.fn();
const mockHash = jest.fn();
const mockCompare = jest.fn();

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    query: mockQuery,
    connect: mockConnect,
  })),
}));

jest.mock("bcrypt", () => ({
  hash: mockHash,
  compare: mockCompare,
}));

const request = require("supertest");
const { app, pool, testDatabaseConnection } = require("./index");

beforeEach(() => {
  jest.clearAllMocks();

  mockConnect.mockResolvedValue({
    release: mockRelease,
  });

  mockHash.mockResolvedValue("hashed-password");
  mockCompare.mockResolvedValue(true);
});

// ---------- Database ----------
describe("Test DB connection", () => {
  it("logs success when database connects", async () => {
    // Spy on console
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await testDatabaseConnection();

    expect(mockConnect).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith("Successfully connected to PostgreSQL");
    expect(mockRelease).toHaveBeenCalled();

    logSpy.mockRestore();
  });

  it("logs error when database connection fails", async () => {
    // Mock pool.connect to throw an error
    const error = new Error("Connection failed");
    mockConnect.mockRejectedValueOnce(error);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await testDatabaseConnection();

    expect(errorSpy).toHaveBeenCalledWith("Error acquiring client", error.stack);
    errorSpy.mockRestore();
  });

});

// ---------- Root ----------
describe("GET /", () => {
  it("Should return running message", async () => {
    const res = await request(app).get("/");

    expect(res.statusCode).toBe(200);
    expect(res.text).toEqual("Running the backend for Vireo");
  });
});

// ---------- Login  ----------
describe("POST /api/login", () => {
  it("logs in successfully", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          uid: 1,
          username: "testuser",
          password_hash: "hashed-password",
          role: "scout",
          email: "user@example.com",
          must_change_password: false,
          language: "nl",
        },
      ],
    });

    mockCompare.mockResolvedValueOnce(true);

    const res = await request(app).post("/api/login").send({
      username: "testuser",
      password: "password123",
      role: "scout",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Login successful!");
    expect(res.body.user).toEqual({
      uid: 1,
      username: "testuser",
      role: "scout",
      email: "user@example.com",
      mustChangePassword: false,
      language: "nl",
    });
  });

  it("returns 401 if user is not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post("/api/login").send({
      username: "missinguser",
      password: "password123",
      role: "scout",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: "User not found" });
  });

  it("returns 403 if role is wrong", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          username: "testuser",
          role: "admin",
          password_hash: "hashed-password",
        },
      ],
    });

    const res = await request(app).post("/api/login").send({
      username: "testuser",
      password: "password123",
      role: "scout",
    });

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      message: "Access denied. You are not a(n) scout.",
    });
  });

  it("returns 401 if password is incorrect", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          username: "testuser",
          role: "scout",
          password_hash: "hashed-password",
        },
      ],
    });

    mockCompare.mockResolvedValueOnce(false);

    const res = await request(app).post("/api/login").send({
      username: "testuser",
      password: "wrong-password",
      role: "scout",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: "Incorrect password" });
  });

  it("returns 500 when login fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("DB failed"));

    const res = await request(app).post("/api/login").send({
      username: "testuser",
      password: "password123",
      role: "scout",
    });

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: "Server error" });
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});

// ---------- Scouts ----------
describe("GET /api/users/scouts", () => {
  it("returns all scouts", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { uid: 1, username: "userA" },
        { uid: 2, username: "userB" },
      ],
    });

    const res = await request(app).get("/api/users/scouts");

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });
});

// ---------- UID ----------
describe("GET /api/users/:uid", () => {
  it("returns a user", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          uid: 1,
          username: "testuser",
          role: "scout",
          email: "user@example.com",
          language: "nl",
        },
      ],
    });

    const res = await request(app).get("/api/users/1");

    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe("testuser");
  });

  it("returns 404 when user not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/api/users/999");

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: "User not found" });
  });
});


// ---------- Create Account ----------
describe("POST /api/createaccount", () => {
  it("creates a new account", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ uid: 1 }] });

    const res = await request(app).post("/api/createaccount").send({
      username: "newuser",
      email: "new@example.com",
      password: "password123",
      mustChangePassword: true,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      message: "Account created successfully!",
    });
  });

  it("returns 409 when username exists", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ uid: 1, username: "existinguser" }],
    });

    const res = await request(app).post("/api/createaccount").send({
      username: "existinguser",
      email: "existing@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ message: "Username already exists" });
  });
});


// ---------- Floor Reports ----------
describe("POST /api/floorreports", () => {
  it("creates a floor report", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const res = await request(app).post("/api/floorreports").send({
      fid: 1,
      uid: 2,
      pests_found: true,
      biology_used: false,
      chemicals_used: true,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ message: "Floor report created successfully!" });
  });

});


// ---------- Change Password ----------
describe("POST /api/users/change-password", () => {
  it("updates password", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ uid: 1, password_hash: "old-hash" }],
      })
      .mockResolvedValueOnce({});

    mockCompare.mockResolvedValueOnce(true);
    mockHash.mockResolvedValueOnce("new-hash");

    const res = await request(app).post("/api/users/change-password").send({
      uid: 1,
      currentPassword: "old",
      newPassword: "new",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Password updated successfully" });
  });

  it("returns 404 when user is not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post("/api/users/change-password").send({
      uid: 999,
      currentPassword: "old",
      newPassword: "new",
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: "User not found" });
  });

  it("returns 401 when current password is incorrect", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ uid: 1, password_hash: "old-hash" }],
    });

    mockCompare.mockResolvedValueOnce(false);

    const res = await request(app).post("/api/users/change-password").send({
      uid: 1,
      currentPassword: "wrong",
      newPassword: "new",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: "Current password incorrect" });
  });
});


// ---------- Change Email ----------
describe("POST /api/users/change-email", () => {
  it("updates email", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ uid: 1, password_hash: "hash" }],
      })
      .mockResolvedValueOnce({});

    mockCompare.mockResolvedValueOnce(true);

    const res = await request(app).post("/api/users/change-email").send({
      uid: 1,
      password: "pass",
      newEmail: "new@example.com",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Email updated successfully" });
  });

  it("returns 404 when user is not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post("/api/users/change-email").send({
      uid: 999,
      password: "pass",
      newEmail: "new@example.com",
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: "User not found" });
  });

  it("returns 401 when password is incorrect", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ uid: 1, password_hash: "hash" }],
    });

    mockCompare.mockResolvedValueOnce(false);

    const res = await request(app).post("/api/users/change-email").send({
      uid: 1,
      password: "wrong",
      newEmail: "new@example.com",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: "Incorrect password" });
  });
});


// ---------- Change Language ----------
describe("POST /api/users/change-language", () => {
  it("updates language", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ uid: 1 }] })
      .mockResolvedValueOnce({});

    const res = await request(app).post("/api/users/change-language").send({
      uid: 1,
      newLanguage: "nl",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Language updated successfully" });
  });

  it("returns 404 when user is not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post("/api/users/change-language").send({
      uid: 999,
      newLanguage: "nl",
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: "User not found" });
  });
});


// ---------- Reset Scout Password ----------
describe("POST /api/admin/reset-scout-password", () => {
  it("resets password", async () => {
    mockQuery.mockResolvedValueOnce({});
    mockHash.mockResolvedValueOnce("hashed");

    const res = await request(app).post("/api/admin/reset-scout-password").send({
      scoutUid: 2,
      newPassword: "temp",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Password reset and flag set successfully" });
  });
});

// ---------- Complete Force Change ----------
describe("POST /api/users/complete-force-change", () => {
  it("completes password reset", async () => {
    mockQuery.mockResolvedValueOnce({});
    mockHash.mockResolvedValueOnce("hashed");

    const res = await request(app).post("/api/users/complete-force-change").send({
      uid: 2,
      newPassword: "new",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Password updated successfully" });
  });
});
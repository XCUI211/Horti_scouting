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

// ---------- All Maps ----------
describe("GET /api/maps", () => {
  it("returns all maps", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { mid: 1, name: "A Map", location: "Greenhouse 1", greenhouse: "GH1" },
        { mid: 2, name: "B Map", location: "Greenhouse 2", greenhouse: "GH2" },
      ],
    });

    const res = await request(app).get("/api/maps");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      { mid: 1, name: "A Map", location: "Greenhouse 1", greenhouse: "GH1" },
      { mid: 2, name: "B Map", location: "Greenhouse 2", greenhouse: "GH2" },
    ]);

    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT mid, name, location, greenhouse, json_map FROM maps ORDER BY name ASC"
    );
  });

});


// ---------- Uid Maps ----------
describe("GET /api/users/:uid/maps", () => {
  it("returns map IDs assigned to a scout", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ mid: 1 }, { mid: 3 }, { mid: 5 }],
    });

    const res = await request(app).get("/api/users/2/maps");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([1, 3, 5]);

    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT mid FROM user_maps WHERE uid = $1",
      ["2"]
    );
  });

  it("returns an empty array when scout has no maps", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/api/users/2/maps");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
});


// ---------- Assign Maps ----------
describe("POST /api/admin/assign-maps", () => {
  it("assigns maps to a scout", async () => {
    const mockClientQuery = jest.fn().mockResolvedValue({});
    const mockClientRelease = jest.fn();

    mockConnect.mockResolvedValueOnce({
      query: mockClientQuery,
      release: mockClientRelease,
    });

    const res = await request(app).post("/api/admin/assign-maps").send({
      scoutUid: 2,
      mapIds: [1, 3],
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Maps assigned successfully" });

    expect(mockClientQuery).toHaveBeenCalledWith("BEGIN");
    expect(mockClientQuery).toHaveBeenCalledWith(
      "DELETE FROM user_maps WHERE uid = $1",
      [2]
    );
  expect(mockClientQuery).toHaveBeenCalledWith(
    "INSERT INTO user_maps (uid, mid) SELECT $1, unnest($2::int[])", [2, [1, 3]]);
    expect(mockClientQuery).toHaveBeenCalledWith("COMMIT");
    expect(mockClientRelease).toHaveBeenCalled();
  });

  it("removes all map assignments when no maps are selected", async () => {
    const mockClientQuery = jest.fn().mockResolvedValue({});
    const mockClientRelease = jest.fn();

    mockConnect.mockResolvedValueOnce({
      query: mockClientQuery,
      release: mockClientRelease,
    });

    const res = await request(app).post("/api/admin/assign-maps").send({
      scoutUid: 2,
      mapIds: [],
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Maps assigned successfully" });

    expect(mockClientQuery).toHaveBeenCalledWith("BEGIN");
    expect(mockClientQuery).toHaveBeenCalledWith(
      "DELETE FROM user_maps WHERE uid = $1",
      [2]
    );
    expect(mockClientQuery).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO user_maps")
    );
    expect(mockClientQuery).toHaveBeenCalledWith("COMMIT");
    expect(mockClientRelease).toHaveBeenCalled();
  });

  it("rolls back and returns 500 when assigning maps fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const mockClientQuery = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("DB failed"))
      .mockResolvedValueOnce({});

    const mockClientRelease = jest.fn();

    mockConnect.mockResolvedValueOnce({
      query: mockClientQuery,
      release: mockClientRelease,
    });

    const res = await request(app).post("/api/admin/assign-maps").send({
      scoutUid: 2,
      mapIds: [1, 3],
    });

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: "Failed to assign maps" });

    expect(mockClientQuery).toHaveBeenCalledWith("BEGIN");
    expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClientRelease).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});


// ---------- Scouts Maps Overview ----------
describe("GET /api/admin/scouts-maps-overview", () => {
  it("returns scouts with their assigned maps", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          uid: 1,
          username: "scoutA",
          email: "scoutA@example.com",
          assigned_maps: [
            { mid: 1, name: "Map A", location: "GH1", greenhouse: "A" },
          ],
        },
        {
          uid: 2,
          username: "scoutB",
          email: "scoutB@example.com",
          assigned_maps: [],
        },
      ],
    });

    const res = await request(app).get("/api/admin/scouts-maps-overview");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      {
        uid: 1,
        username: "scoutA",
        email: "scoutA@example.com",
        assigned_maps: [
          { mid: 1, name: "Map A", location: "GH1", greenhouse: "A" },
        ],
      },
      {
        uid: 2,
        username: "scoutB",
        email: "scoutB@example.com",
        assigned_maps: [],
      },
    ]);

    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("FROM users u"));
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("WHERE u.role = 'scout'"));
  });
});

// ---------- Pest History ----------
describe("GET /api/analytics/pest-history", () => {
  it("returns pest history for the default period (month)", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { pest_type: "aphid", count: "5" },
        { pest_type: "mite", count: "2" },
      ],
    });
 
    const res = await request(app).get("/api/analytics/pest-history");
 
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      status: "success",
      data: [
        { pest_type: "aphid", count: "5" },
        { pest_type: "mite", count: "2" },
      ],
      period: "month",
    });
  });
 
  it("returns pest history for a specific period (week)", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ pest_type: "aphid", count: "3" }],
    });
 
    const res = await request(app).get("/api/analytics/pest-history?period=week");
 
    expect(res.statusCode).toBe(200);
    expect(res.body.period).toBe("week");
    expect(res.body.status).toBe("success");
  });
 
  it("returns all-time pest history when period is unknown", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ pest_type: "aphid", count: "10" }],
    });
 
    const res = await request(app).get("/api/analytics/pest-history?period=all");
 
    expect(res.statusCode).toBe(200);
    expect(res.body.period).toBe("all");
    expect(res.body.status).toBe("success");
  });
 
  it("returns 500 when query fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("DB failed"));
 
    const res = await request(app).get("/api/analytics/pest-history");
 
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe("error");
 
    errorSpy.mockRestore();
  });
});

// ---------- Pest History Details ----------
describe("GET /api/analytics/pest-history-details", () => {
  it("returns detailed history for a specific pest type", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          report_id: 1,
          cell_name: "Section A",
          map_id: "Greenhouse 1",
          severity: "high",
          pest_types: ["aphid"],
          entry_date: "2026-05-01",
          status: "approved",
          reporter_name: "scoutA",
          biology_used: false,
          biology_types: null,
          chemicals_used: true,
          chemicals_types: ["spray"],
        },
      ],
    });
 
    const res = await request(app).get(
      "/api/analytics/pest-history-details?pest_type=aphid&period=month"
    );
 
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      status: "success",
      data: {
        pestType: "aphid",
        history: [
          {
            report_id: 1,
            cell_name: "Section A",
            map_id: "Greenhouse 1",
            severity: "high",
            pest_types: ["aphid"],
            entry_date: "2026-05-01",
            status: "approved",
            reporter_name: "scoutA",
            biology_used: false,
            biology_types: null,
            chemicals_used: true,
            chemicals_types: ["spray"],
          },
        ],
        historyCount: 1,
      },
    });
  });
 
  it("returns 400 when pest_type is missing", async () => {
    const res = await request(app).get("/api/analytics/pest-history-details");
 
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ status: "error", message: "pest_type is required" });
  });
 
  it("returns empty history when no reports match", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
 
    const res = await request(app).get(
      "/api/analytics/pest-history-details?pest_type=mite"
    );
 
    expect(res.statusCode).toBe(200);
    expect(res.body.data.historyCount).toBe(0);
    expect(res.body.data.history).toEqual([]);
  });
 
  it("returns 500 when query fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("DB failed"));
 
    const res = await request(app).get(
      "/api/analytics/pest-history-details?pest_type=aphid"
    );
 
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe("error");
 
    errorSpy.mockRestore();
  });
});
 
 
// ---------- Scouts Reports Summary ----------
describe("GET /api/admin/scouts-reports-summary", () => {
  it("returns scouts with their recent reports", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          uid: 1,
          username: "scoutA",
          recent_reports: [
            {
              rid: 10,
              map_name: "Greenhouse 1",
              section_name: "Section A",
              formatted_date: "01/05/2026 09:00",
              status: "approved",
            },
          ],
        },
        {
          uid: 2,
          username: "scoutB",
          recent_reports: null,
        },
      ],
    });
 
    const res = await request(app).get("/api/admin/scouts-reports-summary");
 
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      {
        uid: 1,
        username: "scoutA",
        recent_reports: [
          {
            rid: 10,
            map_name: "Greenhouse 1",
            section_name: "Section A",
            formatted_date: "01/05/2026 09:00",
            status: "approved",
          },
        ],
      },
      {
        uid: 2,
        username: "scoutB",
        recent_reports: null,
      },
    ]);
 
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("WHERE u.role = 'scout'"));
  });
 
  it("returns an empty array when no scouts are employed", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
 
    const res = await request(app).get("/api/admin/scouts-reports-summary");
 
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
 
  it("returns 500 when query fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("DB failed"));
 
    const res = await request(app).get("/api/admin/scouts-reports-summary");
 
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: "Server error fetching scouts reports summary" });
 
    errorSpy.mockRestore();
  });
});
 
 
// ---------- Tasks uid ----------
describe("GET /api/scout/tasks/:uid", () => {
  it("returns task history for a scout", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          rid: 1,
          status: "approved",
          comment: "Looks good",
          section_name: "Section A",
          map_name: "Greenhouse 1",
          mid: 1,
          fid: 2,
        },
        {
          rid: 2,
          status: "pending",
          comment: null,
          section_name: "Section B",
          map_name: "Greenhouse 1",
          mid: 1,
          fid: 3,
        },
      ],
    });
 
    const res = await request(app).get("/api/scout/tasks/1");
 
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      {
        rid: 1,
        status: "approved",
        comment: "Looks good",
        section_name: "Section A",
        map_name: "Greenhouse 1",
        mid: 1,
        fid: 2,
      },
      {
        rid: 2,
        status: "pending",
        comment: null,
        section_name: "Section B",
        map_name: "Greenhouse 1",
        mid: 1,
        fid: 3,
      },
    ]);
 
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("WHERE fr.uid = $1"),
      ["1"]
    );
  });
 
  it("returns an empty array when scout has no tasks", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
 
    const res = await request(app).get("/api/scout/tasks/99");
 
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
 
  it("returns 500 when query fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("DB failed"));
 
    const res = await request(app).get("/api/scout/tasks/1");
 
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "DB failed" });
 
    errorSpy.mockRestore();
  });
});
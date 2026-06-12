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
const { app, testDatabaseConnection } = require("./index");

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

  it("returns 500 when query fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("DB failed"));

    const res = await request(app).get("/api/users/scouts");

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: "Server error fetching scouts" });

    errorSpy.mockRestore();
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
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      message: "Account created successfully!",
    });
    expect(mockQuery.mock.calls[1][1][3]).toBe(false);
  });

  it("repairs a stale UID sequence and retries account creation", async () => {
    const duplicateUidError = Object.assign(new Error("duplicate uid"), {
      code: "23505",
      constraint: "users_pkey",
    });

    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(duplicateUidError)
      .mockResolvedValueOnce({ rows: [{ setval: 2 }] })
      .mockResolvedValueOnce({ rows: [{ uid: 3 }] });

    const res = await request(app).post("/api/createaccount").send({
      username: "newuser",
      email: "new@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(201);
    expect(mockQuery).toHaveBeenCalledTimes(4);
    expect(mockQuery.mock.calls[2][0]).toContain("pg_get_serial_sequence('users', 'uid')");
    expect(mockQuery.mock.calls[3][1][3]).toBe(false);
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
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("report_batch_id"),
      expect.arrayContaining([null])
    );
  });

});

describe("POST /api/floorreports/bulk", () => {
  it("creates one floor report for each fid", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 2 }] });

    const res = await request(app).post("/api/floorreports/bulk").send({
      fids: [1, 2],
      uid: 2,
      pests_found: true,
      biology_used: false,
      chemicals_used: true,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      message: "Floor reports created successfully!",
      count: 2,
      report_batch_id: expect.any(String),
    });
    expect(mockQuery).toHaveBeenCalledTimes(2);
    const firstParams = mockQuery.mock.calls[0][1];
    const secondParams = mockQuery.mock.calls[1][1];
    expect(firstParams[17]).toEqual(expect.any(String));
    expect(secondParams[17]).toBe(firstParams[17]);
  });

  it("returns 400 when fids are missing", async () => {
    const res = await request(app).post("/api/floorreports/bulk").send({
      uid: 2,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: "fids are required" });
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
      map_id: "all",
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
      period: "month",
      map_id: "all",
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

// ---------- Reports ----------
describe("GET /api/reports", () => {
  it("returns all reports without filters", async () => {
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
          admin_comment: null,
        },
      ],
    });

    const res = await request(app).get("/api/reports");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      status: "success",
      data: [
        {
          report_id: 1,
          cell_name: "Section A",
          map_id: "Greenhouse 1",
          severity: "high",
          pest_types: ["aphid"],
          entry_date: "2026-05-01",
          status: "approved",
          reporter_name: "scoutA",
          admin_comment: null,
        },
      ],
    });
  });

  it("filters by map_id", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/api/reports?map_id=Greenhouse 1");

    expect(res.statusCode).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("m.name = $1"),
      ["Greenhouse 1"]
    );
  });

  it("selects all submitted report details for admin review", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await request(app).get("/api/reports");

    const [calledSql] = mockQuery.mock.calls[0];
    [
      "fr.biology_used",
      "fr.biology_types",
      "fr.chemicals_used",
      "fr.chemicals_types",
      "fr.behandelaar",
      "fr.potmaat",
      "fr.oppotweek",
      "fr.teelduur_weeks",
      "fr.trap_number",
      "fr.bug_count",
    ].forEach((field) => expect(calledSql).toContain(field));
  });

  it("filters by cell_name", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/api/reports?cell_name=Section A");

    expect(res.statusCode).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("f.name = $1"),
      ["Section A"]
    );
  });

  it("filters by both map_id and cell_name", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/api/reports?map_id=Greenhouse 1&cell_name=Section A");

    expect(res.statusCode).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("m.name = $1"),
      ["Greenhouse 1", "Section A"]
    );
  });

  it("filters by block_key", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/api/reports?map_id=Greenhouse 1&cell_name=Section A&block_key=Greenhouse 1::Section A::0:0");

    expect(res.statusCode).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("f.block_key = $3"),
      ["Greenhouse 1", "Section A", "Greenhouse 1::Section A::0:0"]
    );
  });

  it("returns 500 when query fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("DB failed"));

    const res = await request(app).get("/api/reports");

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe("error");

    errorSpy.mockRestore();
  });
});


// ---------- Floors Resolve ----------
describe("GET /api/floors/resolve", () => {
  it("returns fid when floor is found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ fid: 5 }] });

    const res = await request(app).get("/api/floors/resolve?map_name=Greenhouse 1&cell_name=Section A");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "success", fid: 5 });
  });

  it("returns fid when floor is found by block_key", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ fid: 6 }] });

    const res = await request(app).get("/api/floors/resolve?map_name=Greenhouse 1&cell_name=Section A&block_key=Greenhouse 1::Section A::0:0");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "success", fid: 6 });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("f.block_key = $3"),
      ["Greenhouse 1", "Section A", "Greenhouse 1::Section A::0:0"]
    );
  });

  it("returns 409 when label-only floor resolution is ambiguous", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ fid: 5 }, { fid: 6 }] });

    const res = await request(app).get("/api/floors/resolve?map_name=Greenhouse 1&cell_name=Section A");

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({
      status: "ambiguous",
      message: "Multiple floors match this map_name and cell_name; provide block_key",
    });
  });

  it("returns 400 when map_name is missing", async () => {
    const res = await request(app).get("/api/floors/resolve?cell_name=Section A");

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ status: "error", message: "map_name and cell_name are required" });
  });

  it("returns 400 when cell_name is missing", async () => {
    const res = await request(app).get("/api/floors/resolve?map_name=Greenhouse 1");

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ status: "error", message: "map_name and cell_name are required" });
  });

  it("returns 404 when floor is not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/api/floors/resolve?map_name=Greenhouse 1&cell_name=Unknown");

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ status: "not_found", message: "Floor not found" });
  });

  it("returns 500 when query fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("DB failed"));

    const res = await request(app).get("/api/floors/resolve?map_name=Greenhouse 1&cell_name=Section A");

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe("error");

    errorSpy.mockRestore();
  });
});

describe("POST /api/floors/resolve-many", () => {
  it("returns fids ordered like the requested cells", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { fid: 6, block_key: "Greenhouse 1::Section B::0:1" },
        { fid: 5, block_key: "Greenhouse 1::Section A::0:0" },
      ],
    });

    const res = await request(app).post("/api/floors/resolve-many").send({
      map_name: "Greenhouse 1",
      cells: [
        { cell_name: "Section A", block_key: "Greenhouse 1::Section A::0:0" },
        { cell_name: "Section B", block_key: "Greenhouse 1::Section B::0:1" },
      ],
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "success", fids: [5, 6] });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("f.block_key = ANY($2::text[])"),
      [
        "Greenhouse 1",
        ["Greenhouse 1::Section A::0:0", "Greenhouse 1::Section B::0:1"],
      ]
    );
  });

  it("returns 400 when a cell is missing block_key", async () => {
    const res = await request(app).post("/api/floors/resolve-many").send({
      map_name: "Greenhouse 1",
      cells: [{ cell_name: "Section A" }],
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ status: "error", message: "Every cell must include block_key" });
  });

  it("returns 404 when a requested block_key is not found", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ fid: 5, block_key: "Greenhouse 1::Section A::0:0" }],
    });

    const res = await request(app).post("/api/floors/resolve-many").send({
      map_name: "Greenhouse 1",
      cells: [
        { cell_name: "Section A", block_key: "Greenhouse 1::Section A::0:0" },
        { cell_name: "Section B", block_key: "Greenhouse 1::Section B::0:1" },
      ],
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      status: "not_found",
      message: "Floor not found for Greenhouse 1::Section B::0:1",
    });
  });
});


// ---------- Approve Report ----------
describe("PUT /api/reports/:id/approve", () => {
  it("approves a report", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ rid: 1, approval_status: "approved", comment: null }],
    });

    const res = await request(app).put("/api/reports/1/approve").send({
      status: "approved",
      admin_comment: null,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.approval_status).toBe("approved");
  });

  it("approves every report in the same batch", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { rid: 1, approval_status: "approved", report_batch_id: "11111111-1111-1111-1111-111111111111" },
        { rid: 2, approval_status: "approved", report_batch_id: "11111111-1111-1111-1111-111111111111" },
      ],
    });

    const res = await request(app).put("/api/reports/1/approve").send({
      status: "approved",
      admin_comment: "Batch approved",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.affected_count).toBe(2);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("target_report"),
      ["approved", "Batch approved", "1"]
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("report_batch_id = (SELECT report_batch_id FROM target_report)"),
      ["approved", "Batch approved", "1"]
    );
  });

  it("rejects a report with a comment", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ rid: 1, approval_status: "rejected", comment: "Too vague" }],
    });

    const res = await request(app).put("/api/reports/1/approve").send({
      status: "rejected",
      admin_comment: "Too vague",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.approval_status).toBe("rejected");
  });

  it("returns 400 when status is invalid", async () => {
    const res = await request(app).put("/api/reports/1/approve").send({
      status: "maybe",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: "Invalid status" });
  });

  it("returns 404 when report is not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).put("/api/reports/999/approve").send({
      status: "approved",
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: "Report not found" });
  });

  it("returns 500 when query fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("DB failed"));

    const res = await request(app).put("/api/reports/1/approve").send({
      status: "approved",
    });

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe("error");

    errorSpy.mockRestore();
  });
});


// ---------- All Users ----------
describe("GET /api/users", () => {
  it("returns all users", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { uid: 1, username: "scoutA", role: "scout" },
        { uid: 2, username: "admin1", role: "admin" },
      ],
    });

    const res = await request(app).get("/api/users");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      { uid: 1, username: "scoutA", role: "scout" },
      { uid: 2, username: "admin1", role: "admin" },
    ]);
  });

  it("returns 500 when query fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("DB failed"));

    const res = await request(app).get("/api/users");

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: "Server error" });

    errorSpy.mockRestore();
  });
});

// ---------- Login role enforcement (Issue 3) ----------
describe("POST /api/login role enforcement", () => {
  it("returns 403 when a scout user tries to log in via the admin entry", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          uid: 2,
          username: "scoutuser",
          role: "scout",
          password_hash: "hashed-password",
        },
      ],
    });

    const res = await request(app).post("/api/login").send({
      username: "scoutuser",
      password: "password123",
      role: "admin",
    });

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      message: "Access denied. You are not a(n) admin.",
    });
  });

  it("allows admin login when role matches", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          uid: 1,
          username: "adminuser",
          role: "admin",
          password_hash: "hashed-password",
          email: "a@x.nl",
          must_change_password: false,
          language: "nl",
        },
      ],
    });
    mockCompare.mockResolvedValueOnce(true);

    const res = await request(app).post("/api/login").send({
      username: "adminuser",
      password: "password123",
      role: "admin",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.role).toBe("admin");
  });
});

// ---------- /api/reports response shape (Issue 4 backend) ----------
describe("GET /api/reports", () => {
  it("includes pests_found in the response data", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          report_id: 1,
          cell_name: "baan 1",
          map_id: "Rijsenhout",
          status: "approved",
          pests_found: true,
        },
      ],
    });

    const res = await request(app).get("/api/reports");

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data[0]).toHaveProperty("pests_found", true);
  });

  it("filters by map_id query param", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await request(app).get("/api/reports?map_id=HW%2013");

    const [calledSql, calledParams] = mockQuery.mock.calls[0];
    expect(calledSql).toContain("m.name = $1");
    expect(calledParams).toContain("HW 13");
  });
});

// ---------- Employment ----------
describe("POST /api/users/:uid/employment", () => {
  it("updates employment status", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          uid: 1,
          username: "scoutA",
          is_employed: false,
        },
      ],
    });

    const res = await request(app)
      .post("/api/users/1/employment")
      .send({
        is_employed: false,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      message: "Employment status updated successfully",
      user: {
        uid: 1,
        username: "scoutA",
        is_employed: false,
      },
    });

    expect(mockQuery).toHaveBeenCalledWith(
      "UPDATE users SET is_employed = $1 WHERE uid = $2 RETURNING uid, username, is_employed",
      [false, "1"]
    );
  });

  it("returns 404 when user is not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/api/users/999/employment")
      .send({
        is_employed: false,
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      message: "User not found",
    });
  });

  it("returns 500 when update fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("DB failed"));

    const res = await request(app)
      .post("/api/users/1/employment")
      .send({
        is_employed: true,
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      message: "Server error updating employment status",
    });

    errorSpy.mockRestore();
  });
});

// ---------- Filter Roof Reports ----------
describe("GET /api/reports/roof", () => {
  it("returns roof reports", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          location: "HW 15",
          activity: "Painting",
          status: "Completed",
          date: "2026-06-12",
          description: "Finished",
        },
      ],
    });

    const res = await request(app).get("/api/reports/roof");

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("filters by location", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/api/reports/roof?location=HW 15");

    expect(res.statusCode).toBe(200);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("WHERE m.name = $1"),
      ["HW 15"]
    );
  });

  it("returns 500 when query fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("DB failed"));

    const res = await request(app).get("/api/reports/roof");

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      message: "Server error fetching roof reports",
    });

    errorSpy.mockRestore();
  });
});

// ---------- Submit Roof Reports ----------
describe("POST /api/reports/roof", () => {
  it("creates a roof report", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ mid: 5 }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            activity: "Paint",
            status: "Done",
            date: "2026-06-12",
            description: "",
          },
        ],
      });

    const res = await request(app)
      .post("/api/reports/roof")
      .send({
        location: "HW 15",
        activity: "Paint",
        status: "Done",
        date: "2026-06-12",
        description: "",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Roof report created successfully!");
  });

  it("returns 404 when map is not found", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [],
    });

    const res = await request(app)
      .post("/api/reports/roof")
      .send({
        location: "Unknown",
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      message: "Greenhouse location map not found",
    });
  });

  it("returns 500 when insert fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("DB failed"));

    const res = await request(app)
      .post("/api/reports/roof")
      .send({
        location: "HW 15",
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      message: "Server error saving roof report",
    });

    errorSpy.mockRestore();
  });
});

// ---------- Filter Climate Reports ----------
describe("GET /api/reports/climate", () => {
  it("returns climate reports", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nursery: "HW 15",
        },
      ],
    });

    const res = await request(app).get("/api/reports/climate");

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("filters by location", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/api/reports/climate?location=HW 15");

    expect(res.statusCode).toBe(200);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("WHERE m.name = $1"),
      ["HW 15"]
    );
  });

  it("returns 500 when query fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("DB failed"));

    const res = await request(app).get("/api/reports/climate");

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      message: "Server error fetching climate reports",
    });

    errorSpy.mockRestore();
  });
});

// ---------- Submit Climate Reports ----------
describe("POST /api/reports/climate", () => {
  it("creates or updates a climate report", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ mid: 5 }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: "Comp-HW 15",
            model: "Hoogendoorn iSii",
          },
        ],
      });

    const res = await request(app)
      .post("/api/reports/climate")
      .send({
        nursery: "HW 15",
        hoogendoornnummer: "123",
        afdeling: "A",
        inside_temperature: 20,
        outside_temperature: 15,
        humidity: 60,
        light: 500,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe(
      "Climate report synchronized successfully!"
    );
  });

  it("returns 404 when map is not found", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [],
    });

    const res = await request(app)
      .post("/api/reports/climate")
      .send({
        nursery: "Unknown",
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      message: "Greenhouse location map not found",
    });
  });

  it("returns 500 when upsert fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("DB failed"));

    const res = await request(app)
      .post("/api/reports/climate")
      .send({
        nursery: "HW 15",
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      message: "Server error saving climate report",
    });

    errorSpy.mockRestore();
  });
});
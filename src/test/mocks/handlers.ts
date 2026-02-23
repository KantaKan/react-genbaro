import { http, HttpResponse, delay } from "msw";

export const handlers = [
  http.post("/login", async ({ request }) => {
    await delay(100);
    const body = await request.json() as { email: string; password: string };
    
    if (body.email === "test@example.com" && body.password === "password123") {
      return HttpResponse.json({
        success: true,
        message: "Login successful",
        data: {
          token: "mock-jwt-token",
          userId: "user-123",
          role: "learner",
        },
      });
    }
    
    return HttpResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );
  }),

  http.get("/api/verify-token", async ({ request }) => {
    await delay(100);
    const authHeader = request.headers.get("Authorization");
    
    if (authHeader?.startsWith("Bearer ")) {
      return HttpResponse.json({
        success: true,
        message: "Token valid",
        data: {
          role: "learner",
          userId: "user-123",
        },
      });
    }
    
    return HttpResponse.json(
      { success: false, message: "Invalid token" },
      { status: 401 }
    );
  }),

  http.get("/users/:userId", async ({ params }) => {
    await delay(100);
    const { userId } = params;
    
    return HttpResponse.json({
      status: "success",
      message: "User fetched",
      data: {
        _id: userId,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        cohort_number: 1,
        role: "learner",
        reflections: [],
      },
    });
  }),

  http.get("/admin/users", async () => {
    await delay(100);
    return HttpResponse.json({
      status: "success",
      message: "Users fetched",
      data: {
        limit: 10,
        page: 1,
        total: 2,
        users: [
          {
            _id: "user-1",
            first_name: "Alice",
            last_name: "Smith",
            email: "alice@example.com",
            cohort_number: 1,
            role: "learner",
          },
          {
            _id: "user-2",
            first_name: "Bob",
            last_name: "Johnson",
            email: "bob@example.com",
            cohort_number: 1,
            role: "admin",
          },
        ],
      },
    });
  }),
];

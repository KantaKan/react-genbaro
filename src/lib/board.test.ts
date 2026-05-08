import { describe, expect, it } from "vitest";

import { getBoardReactionCounts, getBoardUserPayload } from "./board";

describe("board helpers", () => {
  it("normalizes snake_case user data for board payloads", () => {
    expect(
      getBoardUserPayload({
        _id: "user-1",
        zoom_name: "Zoom Jane",
        cohort_number: 12,
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
      }),
    ).toEqual({
      userId: "user-1",
      zoomName: "Zoom Jane",
      cohort: 12,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
    });
  });

  it("normalizes camelCase user data for older board callers", () => {
    expect(getBoardUserPayload({ userId: "user-2", zoomName: "Legacy Name", cohort: "3" })).toMatchObject({
      userId: "user-2",
      zoomName: "Legacy Name",
      cohort: 3,
    });
  });

  it("counts reaction values", () => {
    expect(
      getBoardReactionCounts([
        { id: "1", userId: "u1", type: "image", value: "peepolike" },
        { id: "2", userId: "u2", type: "image", value: "peepolike" },
        { id: "3", userId: "u3", type: "image", value: "sadge" },
      ]),
    ).toEqual({ peepolike: 2, sadge: 1 });
  });
});

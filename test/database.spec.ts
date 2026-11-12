import { afterAll, describe, expect, it } from "vitest";
import { closeDatabase, readCollection } from "../lib/database";

afterAll(() => {
  closeDatabase();
});

describe("SQLite data layer", () => {
  it("migrates the seed profiles into SQLite", () => {
    const profiles = readCollection<{ id: string }>("profiles");
    expect(profiles.some((profile) => profile.id === "user-alice")).toBe(true);
  });
});

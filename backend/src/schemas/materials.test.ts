import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { escapeLike } from "../utils/escapeLike.js";
import { MAX_PAGE_SIZE, materialsQuerySchema } from "./materials.js";

// Returns the name of the first field that failed validation, or undefined if it passed.
function failedField(input: unknown) {
  const result = materialsQuerySchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0].path[0];
}

describe("materialsQuerySchema", () => {
  it("applies defaults when no params are given", () => {
    // Optional filters are left out of the result entirely when not given.
    assert.deepEqual(materialsQuerySchema.parse({}), {
      sortBy: "materialNumber",
      sortOrder: "asc",
      page: 1,
      pageSize: 25,
    });
  });

  it("turns query-string values into numbers", () => {
    const query = materialsQuerySchema.parse({ page: "3", pageSize: "50", plantId: "2" });
    assert.equal(query.page, 3);
    assert.equal(query.pageSize, 50);
    assert.equal(query.plantId, 2);
  });

  it("caps pageSize and rejects page numbers below 1", () => {
    assert.equal(materialsQuerySchema.parse({ pageSize: String(MAX_PAGE_SIZE) }).pageSize, MAX_PAGE_SIZE);
    assert.equal(failedField({ pageSize: String(MAX_PAGE_SIZE + 1) }), "pageSize");
    assert.equal(failedField({ pageSize: "0" }), "pageSize");
    assert.equal(failedField({ page: "0" }), "page");
    assert.equal(failedField({ page: "abc" }), "page");
  });

  it("rejects values outside the allowed type, status and plant", () => {
    assert.equal(materialsQuerySchema.parse({ type: "Tool", status: "Pending Review" }).type, "Tool");
    assert.equal(failedField({ type: "Equipment" }), "type");
    assert.equal(failedField({ status: "Pending" }), "status");
    assert.equal(failedField({ plantId: "0" }), "plantId");
  });

  it("rejects a plantId too large for a Postgres integer", () => {
    assert.equal(materialsQuerySchema.parse({ plantId: "2147483647" }).plantId, 2147483647);
    assert.equal(failedField({ plantId: "2147483648" }), "plantId");
    assert.equal(failedField({ plantId: "99999999999" }), "plantId");
  });

  it("only accepts whitelisted sort columns and directions", () => {
    assert.equal(materialsQuerySchema.parse({ sortBy: "unitPrice", sortOrder: "desc" }).sortBy, "unitPrice");
    assert.equal(failedField({ sortBy: "id; drop table materials" }), "sortBy");
    assert.equal(failedField({ sortBy: "manufacturerPartNumber" }), "sortBy"); // real column, not sortable
    assert.equal(failedField({ sortOrder: "up" }), "sortOrder");
  });

  it("trims the search text and treats blank as no search", () => {
    assert.equal(materialsQuerySchema.parse({ search: "  bearing " }).search, "bearing");
    assert.equal(materialsQuerySchema.parse({ search: "   " }).search, undefined);
    assert.equal(failedField({ search: "a".repeat(101) }), "search");
  });

  it("rejects a repeated query param (single-value filters)", () => {
    assert.equal(failedField({ type: ["Tool", "Consumable"] }), "type");
  });
});

describe("escapeLike", () => {
  it("escapes the LIKE wildcards so they match literally", () => {
    assert.equal(escapeLike("50%"), "50\\%");
    assert.equal(escapeLike("a_b"), "a\\_b");
  });

  it("escapes the escape character itself, once", () => {
    assert.equal(escapeLike("a\\b"), "a\\\\b");
    assert.equal(escapeLike("\\%"), "\\\\\\%");
  });

  it("leaves ordinary text unchanged", () => {
    assert.equal(escapeLike("Bearing, deep groove 25mm"), "Bearing, deep groove 25mm");
  });
});

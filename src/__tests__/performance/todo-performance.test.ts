/**
 * PERFORMANCE TESTS — "Does the system perform within acceptable bounds?"
 *
 * When performance tests earn their place:
 * - When you have SLAs to enforce ("p99 latency < 200ms").
 * - When testing algorithms that could degrade (O(n²) sorting on 10k items).
 * - When comparing BEFORE vs AFTER a change (relative benchmarking).
 *
 * The problem with THIS file: The thresholds (50ms, 2s, 200ms) are arbitrary
 * and hardware-dependent. They'll pass on an M2 MacBook and flake on a loaded
 * CI runner. This gives false confidence — the test passes, so you think
 * performance is "tested," but the numbers protect nothing.
 *
 * What GOOD performance tests look like:
 * - RELATIVE: "Fetching 100 todos is less than 10x slower than fetching 10"
 *   (tests algorithmic complexity, not hardware speed).
 * - BASELINED: Store a benchmark result, alert only when deviation > 20%
 *   (tools: Benchmark.js, hyperfine, Clinic.js).
 * - PROFILED: Measure memory, I/O ops, or CPU time — not wall-clock time.
 *
 * Student exercise: Run these tests on different machines or under CPU load.
 * If they flake, the thresholds are arbitrary. Try rewriting one test to use
 * a RELATIVE comparison instead.
 *
 * The "concurrent operations" section below IS genuinely valuable — it tests
 * correctness under concurrency, not performance. That's a different concern
 * and belongs in integration tests rather than here.
 */
import path from "path";
import fs from "fs/promises";
import { setDataDir } from "@/helpers/json-store";
import { getTodos, addTodo, toggleTodo, deleteTodo } from "@/app/actions/todo-actions";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const TEST_DIR = path.join(process.cwd(), "data-performance-test");

beforeAll(() => {
  setDataDir(TEST_DIR);
});

beforeEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
  await fs.mkdir(TEST_DIR, { recursive: true });
});

afterAll(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

function makeFormData(title: string): FormData {
  const fd = new FormData();
  fd.set("title", title);
  return fd;
}

async function measure(fn: () => Promise<void>): Promise<number> {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}

// ─── Response time ───────────────────────────────────────────

describe("response time", () => {
  it("getTodos should respond under 50ms with an empty store", async () => {
    const ms = await measure(async () => {
      await getTodos();
    });
    expect(ms).toBeLessThan(50);
  });

  it("addTodo should complete under 50ms", async () => {
    const ms = await measure(async () => {
      await addTodo(makeFormData("Quick todo"));
    });
    expect(ms).toBeLessThan(50);
  });

  it("toggleTodo should complete under 50ms", async () => {
    await addTodo(makeFormData("Toggle me"));
    const [todo] = await getTodos();

    const ms = await measure(async () => {
      await toggleTodo(todo.id);
    });
    expect(ms).toBeLessThan(50);
  });

  it("deleteTodo should complete under 50ms", async () => {
    await addTodo(makeFormData("Delete me"));
    const [todo] = await getTodos();

    const ms = await measure(async () => {
      await deleteTodo(todo.id);
    });
    expect(ms).toBeLessThan(50);
  });
});

// ─── Throughput ──────────────────────────────────────────────

describe("throughput", () => {
  it("should create 100 todos under 2 seconds", async () => {
    const ms = await measure(async () => {
      for (let i = 0; i < 100; i++) {
        await addTodo(makeFormData(`Todo ${i}`));
      }
    });
    expect(ms).toBeLessThan(2000);
  });

  it("should fetch 100 todos under 200ms", async () => {
    for (let i = 0; i < 100; i++) {
      await addTodo(makeFormData(`Todo ${i}`));
    }

    const ms = await measure(async () => {
      const todos = await getTodos();
      expect(todos).toHaveLength(100);
    });
    expect(ms).toBeLessThan(200);
  });
});

// ─── Large dataset ───────────────────────────────────────────

describe("large dataset", () => {
  it("should handle 500 todos without timing out", async () => {
    for (let i = 0; i < 500; i++) {
      await addTodo(makeFormData(`Todo ${i}`));
    }

    const ms = await measure(async () => {
      const todos = await getTodos();
      expect(todos).toHaveLength(500);
    });
    expect(ms).toBeLessThan(1000);
  }, 30000);
});

// ─── Concurrent operations ───────────────────────────────────

describe("concurrent operations", () => {
  it("should handle 20 concurrent creates without data loss", async () => {
    const promises = Array.from({ length: 20 }, (_, i) =>
      addTodo(makeFormData(`Concurrent ${i}`))
    );

    await Promise.all(promises);

    const todos = await getTodos();
    expect(todos).toHaveLength(20);
  });

  it("should handle concurrent creates and reads without errors", async () => {
    const operations = [
      ...Array.from({ length: 10 }, (_, i) => addTodo(makeFormData(`Write ${i}`))),
      ...Array.from({ length: 10 }, () => getTodos()),
    ];

    await expect(Promise.all(operations)).resolves.not.toThrow();
  });
});

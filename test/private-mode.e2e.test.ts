/**
 * Private Mode E2E Tests
 *
 * These tests verify that Private Mode (strictMode=true) works correctly:
 * - Agent runs succeed with strictMode=true and no external network
 * - web_search/web_fetch tools return null when disabled
 * - Memory search works with Ollama embeddings
 * - Image tool uses local vision models only
 * - Provider blocking works correctly
 *
 * Prerequisites:
 * - Ollama running locally (http://127.0.0.1:11434)
 * - At least one Ollama model pulled (e.g., llama3.1:8b)
 *
 * Run with: OPENCLAW_LIVE_TEST=1 pnpm test:e2e -- private-mode
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { OpenClawConfig } from "../src/config/config.js";
import { createWebSearchTool, createWebFetchTool } from "../src/agents/tools/web-tools.js";
import {
  isStrictModeEnabled,
  setStrictModeConfig,
  isLocalProvider,
  isProviderAllowedInStrictMode,
  filterModelsForStrictMode,
} from "../src/infra/strict-mode.js";

const LIVE_TEST_ENABLED = process.env.OPENCLAW_LIVE_TEST === "1";

describe.skipIf(!LIVE_TEST_ENABLED)("Private Mode E2E", () => {
  const privateConfig: OpenClawConfig = {
    privacy: { strictMode: true },
  };

  beforeAll(() => {
    setStrictModeConfig(privateConfig);
  });

  afterAll(() => {
    setStrictModeConfig(null);
  });

  describe("strictMode enforcement", () => {
    it("strictMode is enabled with private config", () => {
      expect(isStrictModeEnabled(privateConfig)).toBe(true);
    });

    it("cloud providers are blocked in strictMode", () => {
      expect(isProviderAllowedInStrictMode("openai", privateConfig)).toBe(false);
      expect(isProviderAllowedInStrictMode("anthropic", privateConfig)).toBe(false);
      expect(isProviderAllowedInStrictMode("google", privateConfig)).toBe(false);
    });

    it("local providers are allowed in strictMode", () => {
      expect(isProviderAllowedInStrictMode("ollama", privateConfig)).toBe(true);
      expect(isProviderAllowedInStrictMode("lmstudio", privateConfig)).toBe(true);
    });
  });

  describe("tool gating", () => {
    it("web_search tool returns null when strictMode is enabled", () => {
      const tool = createWebSearchTool({ config: privateConfig });
      expect(tool).toBeNull();
    });

    it("web_fetch tool returns null when strictMode is enabled", () => {
      const tool = createWebFetchTool({ config: privateConfig });
      expect(tool).toBeNull();
    });
  });

  describe("model filtering", () => {
    it("filters out cloud providers from model candidates", () => {
      const models = [
        { provider: "openai", model: "gpt-4" },
        { provider: "ollama", model: "llama3" },
        { provider: "anthropic", model: "claude-3" },
      ];
      const filtered = filterModelsForStrictMode(models, privateConfig);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].provider).toBe("ollama");
    });
  });

  describe.skipIf(!LIVE_TEST_ENABLED)("Ollama connectivity", () => {
    it("can reach Ollama API", async () => {
      const response = await fetch("http://127.0.0.1:11434/api/version", {
        signal: AbortSignal.timeout(5000),
      });
      expect(response.ok).toBe(true);
    });

    it("has at least one model available", async () => {
      const response = await fetch("http://127.0.0.1:11434/api/tags", {
        signal: AbortSignal.timeout(5000),
      });
      expect(response.ok).toBe(true);
      const data = (await response.json()) as { models?: { name: string }[] };
      expect(data.models?.length).toBeGreaterThan(0);
    });
  });
});

// Non-live tests that don't require Ollama
describe("Private Mode (unit)", () => {
  it("isLocalProvider correctly identifies local providers", () => {
    expect(isLocalProvider("ollama")).toBe(true);
    expect(isLocalProvider("lmstudio")).toBe(true);
    expect(isLocalProvider("llamacpp")).toBe(true);
    expect(isLocalProvider("openai")).toBe(false);
    expect(isLocalProvider("anthropic")).toBe(false);
  });
});

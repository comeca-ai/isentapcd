import { describe, expect, it } from "vitest";
import { allowLoginAttempt, resetLoginAttempts } from "./rateLimit";

describe("rate limit de login (5 tentativas/15 min por IP+email)", () => {
  it("permite 5 e bloqueia a 6ª", () => {
    const email = `rl-${Date.now()}@teste.com`;
    for (let i = 0; i < 5; i++) {
      expect(allowLoginAttempt("10.0.0.1", email)).toBe(true);
    }
    expect(allowLoginAttempt("10.0.0.1", email)).toBe(false);
  });

  it("IPs diferentes têm buckets independentes", () => {
    const email = `rl2-${Date.now()}@teste.com`;
    for (let i = 0; i < 5; i++) allowLoginAttempt("10.0.0.2", email);
    expect(allowLoginAttempt("10.0.0.3", email)).toBe(true);
  });

  it("reset após sucesso libera o bucket", () => {
    const email = `rl3-${Date.now()}@teste.com`;
    for (let i = 0; i < 5; i++) allowLoginAttempt("10.0.0.4", email);
    expect(allowLoginAttempt("10.0.0.4", email)).toBe(false);
    resetLoginAttempts("10.0.0.4", email);
    expect(allowLoginAttempt("10.0.0.4", email)).toBe(true);
  });
});

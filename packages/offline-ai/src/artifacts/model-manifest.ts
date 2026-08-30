export interface VerifiedArtifactManifest {
  readonly id: string;
  readonly version: string;
  readonly url: string;
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly sha256: string;
  readonly license: string;
}

export const OFFLINE_AI_PROFILE = Object.freeze({
  llamaCpp: Object.freeze({
    version: "v0.3.0",
    commit: "c1d0e7a004015f23bc0233470b747b596f29b264",
    windowsBuild: "b10621",
  }),
  windowsCpuRuntime: Object.freeze({
    id: "llama-cpp-windows-cpu-x64",
    version: "b10621",
    url: "https://github.com/ggml-org/llama.cpp/releases/download/b10621/llama-b10621-bin-win-cpu-x64.zip",
    fileName: "llama-b10621-bin-win-cpu-x64.zip",
    sizeBytes: 18_068_018,
    sha256: "0e8b65e650e369f70f8307d890508886f171ef4fb00facccddd4a1b7ffdaca51",
    license: "MIT",
  } satisfies VerifiedArtifactManifest),
  testModel: Object.freeze({
    id: "qwen3.5-0.8b-q4_0",
    version: "8fea620810c4afa23dd6443f999a48574c1611a3",
    url: "https://huggingface.co/ggml-org/Qwen3.5-0.8B-GGUF/resolve/8fea620810c4afa23dd6443f999a48574c1611a3/Qwen3.5-0.8B-Q4_0.gguf",
    fileName: "Qwen3.5-0.8B-Q4_0.gguf",
    sizeBytes: 563_036_064,
    sha256: "57d1997790d1744fba5b40a7317df71ea5e2acee28c47e78f0cce39c0703f8cf",
    license: "Apache-2.0",
  } satisfies VerifiedArtifactManifest),
  defaultContextTokens: 4_096,
  defaultOutputTokens: 512,
  defaultTimeoutMs: 90_000,
});

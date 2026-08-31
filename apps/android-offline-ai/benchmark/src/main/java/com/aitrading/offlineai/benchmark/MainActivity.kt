package com.aitrading.offlineai.benchmark

import android.app.Activity
import android.os.Bundle
import android.util.Log
import android.widget.TextView
import com.aitrading.offlineai.OfflineAiBridge
import java.io.File
import kotlinx.coroutines.runBlocking

private const val tag = "OfflineAiBenchmark"
private const val modelFileName = "Qwen3.5-0.8B-Q4_0.gguf"
private const val modelSize = 563_036_064L
private const val modelSha256 = "57d1997790d1744fba5b40a7317df71ea5e2acee28c47e78f0cce39c0703f8cf"

class MainActivity : Activity() {
    private lateinit var status: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        status = TextView(this).also {
            it.setPadding(32, 32, 32, 32)
            it.text = "Offline AI benchmark: validating local model…"
        }
        setContentView(status)
        Thread(::runBenchmark, "offline-ai-benchmark").start()
    }

    private fun runBenchmark() {
        val bridge = OfflineAiBridge(this)
        try {
            val model = File(File(filesDir, "models"), modelFileName)
            val startedAt = System.nanoTime()
            runBlocking {
                bridge.loadVerifiedModel(model, modelSize, modelSha256)
                val output = bridge.generateJson(
                    systemPrompt = "Architecture smoke-test only. You have no policy, risk, order, or execution authority. Return exactly this compact JSON and nothing else: {\"decision\":\"REJECT\",\"reason\":\"no deterministic evidence\"}.",
                    userPrompt = "Return the required JSON now.",
                    allowedKeys = setOf("decision", "reason"),
                    requiredKeys = setOf("decision", "reason"),
                    predictLength = 256,
                    timeoutMillis = 90_000,
                )
                check(output.contains("\"decision\":\"REJECT\"")) { "Expected fail-closed REJECT" }
                val elapsedMs = (System.nanoTime() - startedAt) / 1_000_000
                report("PASS: $output; elapsedMs=$elapsedMs")
            }
        } catch (error: Throwable) {
            report("FAIL: ${error::class.java.simpleName}: ${error.message ?: "no message"}")
        } finally {
            bridge.close()
        }
    }

    private fun report(message: String) {
        Log.i(tag, message)
        runOnUiThread { status.text = message }
    }
}

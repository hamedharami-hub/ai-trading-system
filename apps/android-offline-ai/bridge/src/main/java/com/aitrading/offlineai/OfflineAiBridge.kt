package com.aitrading.offlineai

import android.app.ActivityManager
import android.content.Context
import android.os.PowerManager
import com.arm.aichat.AiChat
import com.arm.aichat.InferenceEngine
import java.io.File
import java.io.FileInputStream
import java.security.MessageDigest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import org.json.JSONObject

class OfflineAiBridge(private val context: Context) {
    private val engine: InferenceEngine = AiChat.getInferenceEngine(context.applicationContext)

    suspend fun loadVerifiedModel(model: File, expectedSize: Long, expectedSha256: String) {
        enforceResourceGate()
        val modelRoot = File(context.filesDir, "models").canonicalFile
        val canonicalModel = model.canonicalFile
        require(canonicalModel.path.startsWith(modelRoot.path + File.separator)) {
            "Model must be stored in the app-private models directory"
        }
        require(canonicalModel.isFile && canonicalModel.length() == expectedSize) { "Model size mismatch" }
        val actualHash = withContext(Dispatchers.IO) { sha256(canonicalModel) }
        require(actualHash == expectedSha256.lowercase()) { "Model SHA-256 mismatch" }
        engine.loadModel(canonicalModel.path)
    }

    suspend fun generateJson(
        systemPrompt: String,
        userPrompt: String,
        allowedKeys: Set<String>,
        predictLength: Int = 512,
        timeoutMillis: Long = 90_000,
    ): String {
        enforceResourceGate()
        require(systemPrompt.length <= 8_000 && userPrompt.length <= 24_000) { "Prompt exceeds safe bound" }
        require(predictLength in 1..1_024) { "predictLength outside safe range" }
        require(timeoutMillis in 1_000..180_000) { "timeout outside safe range" }
        engine.setSystemPrompt(systemPrompt)
        val output = StringBuilder()
        withTimeout(timeoutMillis) {
            engine.sendUserPrompt(userPrompt, predictLength).collect { token ->
                require(output.length + token.length <= 1_000_000) { "Output exceeds safe bound" }
                output.append(token)
            }
        }
        val json = JSONObject(extractJson(output.toString()))
        val keys = json.keys().asSequence().toSet()
        require(keys.all(allowedKeys::contains)) { "Model returned an unauthorized field" }
        return json.toString()
    }

    fun close() {
        engine.cleanUp()
        engine.destroy()
    }

    private fun enforceResourceGate() {
        val activityManager = context.getSystemService(ActivityManager::class.java)
        val memory = ActivityManager.MemoryInfo().also(activityManager::getMemoryInfo)
        require(!memory.lowMemory && memory.availMem >= 1_500_000_000L) { "Insufficient memory for offline inference" }
        val powerManager = context.getSystemService(PowerManager::class.java)
        require(powerManager.currentThermalStatus < PowerManager.THERMAL_STATUS_SEVERE) { "Thermal state blocks inference" }
    }

    private fun sha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        FileInputStream(file).use { input ->
            val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
            while (true) {
                val count = input.read(buffer)
                if (count < 0) break
                digest.update(buffer, 0, count)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    private fun extractJson(value: String): String {
        val start = value.indexOf('{')
        val end = value.lastIndexOf('}')
        require(start >= 0 && end >= start) { "Model did not return JSON" }
        return value.substring(start, end + 1)
    }
}

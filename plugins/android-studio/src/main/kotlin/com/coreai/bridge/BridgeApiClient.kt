package com.coreai.bridge

import com.google.gson.Gson
import com.google.gson.JsonObject
import okhttp3.*
import okio.ByteString
import java.util.concurrent.TimeUnit

class BridgeApiClient(private val settings: BridgeSettings) {
    private val gson = Gson()
    private val http = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    private fun auth(): String? = settings.apiToken.takeIf { it.isNotBlank() }

    fun wsUrl(): String {
        val base = settings.serverUrl.trimEnd('/')
            .replace("https://", "wss://")
            .replace("http://", "ws://")
        val id = settings.ensureClientId()
        val token = auth()?.let { "&token=${java.net.URLEncoder.encode(it, Charsets.UTF_8)}" } ?: ""
        return "$base/api/v1/studio/events?clientId=$id&name=Android+Studio&maxAccess=1&autonomous=1$token"
    }

    fun connectWebSocket(listener: BridgeWsListener): WebSocket {
        val req = Request.Builder().url(wsUrl()).build()
        return http.newWebSocket(req, listener)
    }

    fun postJson(path: String, body: Any): JsonObject? {
        val url = settings.serverUrl.trimEnd('/') + path
        val builder = Request.Builder()
            .url(url)
            .post(RequestBody.create("application/json".toMediaType(), gson.toJson(body)))
        auth()?.let { builder.header("Authorization", "Bearer $it") }
        http.newCall(builder.build()).execute().use { resp ->
            if (!resp.isSuccessful) return null
            return gson.fromJson(resp.body?.string(), JsonObject::class.java)
        }
    }

    abstract class BridgeWsListener : WebSocketListener() {
        override fun onMessage(webSocket: WebSocket, text: String) {
            onEvent(text)
        }

        override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
            onEvent(bytes.utf8())
        }

        abstract fun onEvent(text: String)
    }
}

package com.coreai.bridge

import com.google.gson.Gson
import com.google.gson.JsonObject
import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project
import okhttp3.WebSocket
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit

class BridgeService(private val project: Project?) {
    private val settings = service<BridgeSettings>()
    private val client = BridgeApiClient(settings)
    private val gson = Gson()
    private val scheduler = Executors.newSingleThreadScheduledExecutor()
    private var ws: WebSocket? = null
    private var heartbeat: ScheduledFuture<*>? = null

    fun connect() {
        disconnect()
        ws = client.connectWebSocket(object : BridgeApiClient.BridgeWsListener() {
            override fun onEvent(text: String) {
                val msg = gson.fromJson(text, JsonObject::class.java)
                when (msg.get("type")?.asString) {
                    "job.dispatch" -> handleJob(msg.getAsJsonObject("job"))
                    "connected" -> notify("Bridge verbunden", NotificationType.INFORMATION)
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: okhttp3.Response?) {
                scheduleReconnect()
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                scheduleReconnect()
            }
        })
        heartbeat = scheduler.scheduleAtFixedRate({
            ws?.send("""{"type":"heartbeat","clientId":"${settings.ensureClientId()}"}""")
        }, 10, 30, TimeUnit.SECONDS)
    }

    fun disconnect() {
        heartbeat?.cancel(true)
        ws?.close(1000, "shutdown")
        ws = null
    }

    private fun scheduleReconnect() {
        scheduler.schedule({ connect() }, 5, TimeUnit.SECONDS)
    }

    private fun handleJob(job: JsonObject) {
        val id = job.get("id")?.asString ?: return
        val payload = job.getAsJsonObject("payload")
        val prompt = payload?.get("prompt")?.asString ?: return
        ApplicationManager.getApplication().invokeLater {
            AutonomousRunner.run(project, prompt) { ok, output ->
                ws?.send(
                    gson.toJson(
                        mapOf(
                            "type" to "job.complete",
                            "jobId" to id,
                            "ok" to ok,
                            "output" to (output ?: "")
                        )
                    )
                )
            }
        }
    }

    private fun notify(message: String, type: NotificationType) {
        NotificationGroupManager.getInstance()
            .getNotificationGroup("Bridge")
            .createNotification(message, type)
            .notify(project)
    }
}

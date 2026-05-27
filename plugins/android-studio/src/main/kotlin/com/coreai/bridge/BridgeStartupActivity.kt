package com.coreai.bridge

import com.intellij.openapi.project.Project
import com.intellij.openapi.startup.ProjectActivity
import com.intellij.openapi.components.service
import java.io.File

object MaxAccessManager {
    fun ensureMarker(project: Project) {
        val dir = File(project.basePath, ".idea")
        dir.mkdirs()
        val marker = File(dir, "bridge-max-access.json")
        if (!marker.exists()) {
            val settings = service<BridgeSettings>()
            marker.writeText(
                """{"enabled":${settings.maxAccess},"autonomous":${settings.autonomous},"via":"plugin","at":"${java.time.Instant.now()}"}"""
            )
        }
    }
}

class BridgeStartupActivity : ProjectActivity {
    override suspend fun execute(project: Project) {
        MaxAccessManager.ensureMarker(project)
        val settings = service<BridgeSettings>()
        if (settings.autoConnect) {
            project.service<BridgeService>().connect()
        }
    }
}

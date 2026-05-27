package com.coreai.bridge.actions

import com.coreai.bridge.AgentControl
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent

class OpenAiChatAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        AgentControl.openAiChat(e.project)
    }
}

class SendPromptAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        AgentControl.showPromptDialog(e.project)
    }
}

class SendSelectionAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        AgentControl.sendSelection(e.project, "Bitte bearbeite den markierten Code.")
    }
}

class InvestigateAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val topic = com.intellij.openapi.ui.Messages.showInputDialog(
            e.project, "Thema für Multi-Source Untersuchung", "Bridge Investigate", null
        ) ?: return
        val prompt = "Multi-Source Untersuchung: $topic — Git, Logcat, Lint, Errors parallel prüfen."
        AgentControl.sendPrompt(e.project, prompt)
    }
}

class StopGenerationAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        AgentControl.stopGeneration(e.project)
    }
}

class ToggleMaxAccessAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val settings = com.intellij.openapi.components.service<com.coreai.bridge.BridgeSettings>()
        settings.maxAccess = !settings.maxAccess
        settings.autonomous = settings.maxAccess
        e.project?.let { com.coreai.bridge.MaxAccessManager.ensureMarker(it) }
    }
}

class ShowIntegrationsAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        com.intellij.openapi.ui.Messages.showInfoMessage(
            e.project,
            "Bridge + android-pilot-mcp + Git + IDE Diagnostics\nServer: bridge.chatpilot.link",
            "Bridge Integrationen"
        )
    }
}

class ShowShortcutsAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        com.intellij.openapi.ui.Messages.showInfoMessage(
            e.project,
            "Ctrl+Alt+A AI-Chat\nCtrl+Alt+P Prompt\nCtrl+Alt+Shift+A Auswahl\nCtrl+Alt+. Stop\nCtrl+Alt+Shift+I Investigate",
            "Bridge Tastenkürzel"
        )
    }
}

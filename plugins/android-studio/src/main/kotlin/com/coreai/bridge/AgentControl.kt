package com.coreai.bridge

import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import java.awt.Toolkit
import java.awt.datatransfer.StringSelection

object AgentControl {
    private val AI_CHAT = listOf(
        "jetbrains.ai.chat.newChat",
        "ActivateChatToolWindow",
        "ShowAiChatAction",
        "AIChat.NewChat"
    )
    private val SUBMIT = listOf(
        "jetbrains.ai.chat.sendMessage",
        "SendToAIFloatingToolbar"
    )
    private val STOP = listOf("jetbrains.ai.chat.stopGeneration", "StopGeneration")

    fun openAiChat(project: Project?) {
        tryCommands(project, AI_CHAT)
    }

    fun sendPrompt(project: Project?, prompt: String, autoSubmit: Boolean = true) {
        ApplicationManager.getApplication().invokeLater {
            val clipboard = Toolkit.getDefaultToolkit().systemClipboard
            val prev = clipboard.getContents(null)?.getTransferData(java.awt.datatransfer.DataFlavor.stringFlavor) as? String
            clipboard.setContents(StringSelection(prompt), null)
            openAiChat(project)
            if (autoSubmit) {
                Thread.sleep(150)
                tryCommands(project, SUBMIT)
            }
            if (prev != null && prev != prompt) {
                clipboard.setContents(StringSelection(prev), null)
            }
        }
    }

    fun sendSelection(project: Project?, defaultPrompt: String) {
        val editor = FileEditorManager.getInstance(project ?: return).selectedTextEditor
        val text = editor?.selectionModel?.selectedText?.trim().orEmpty()
        val prompt = if (text.isBlank()) defaultPrompt else "Analysiere und bearbeite:\n\n```\n$text\n```"
        sendPrompt(project, prompt)
    }

    fun stopGeneration(project: Project?) {
        tryCommands(project, STOP)
    }

    fun showPromptDialog(project: Project?) {
        val prompt = Messages.showInputDialog(project, "Was soll der Agent tun?", "Bridge Prompt", null)
        if (!prompt.isNullOrBlank()) sendPrompt(project, prompt.trim())
    }

    private fun tryCommands(project: Project?, ids: List<String>): Boolean {
        val am = ActionManager.getInstance()
        for (id in ids) {
            val action = am.getAction(id) ?: continue
            try {
                val event = com.intellij.openapi.actionSystem.AnActionEvent.createFromAnAction(
                    action, null, "Bridge", com.intellij.openapi.actionSystem.DataContext { dataId ->
                        when {
                            com.intellij.openapi.actionSystem.CommonDataKeys.PROJECT.`is`(dataId) -> project
                            com.intellij.openapi.actionSystem.CommonDataKeys.EDITOR.`is`(dataId) ->
                                FileEditorManager.getInstance(project ?: return@DataContext null).selectedTextEditor
                            else -> null
                        }
                    }
                )
                action.actionPerformed(event)
                return true
            } catch (_: Exception) {
                /* try next */
            }
        }
        return false
    }
}

object AutonomousRunner {
    fun run(project: Project?, prompt: String, done: (Boolean, String?) -> Unit) {
        val settings = com.intellij.openapi.components.service<BridgeSettings>()
        try {
            if (prompt.startsWith("adb ") || prompt.startsWith("./gradlew") || prompt.startsWith("gradlew")) {
                val proc = ProcessBuilder("cmd", "/c", prompt)
                    .directory(project?.basePath?.let { java.io.File(it) })
                    .redirectErrorStream(true)
                    .start()
                val out = proc.inputStream.bufferedReader().readText()
                done(proc.waitFor() == 0, out)
                return
            }
            AgentControl.sendPrompt(project, prompt, settings.autonomous && settings.maxAccess)
            done(true, "Prompt an AI gesendet (Max Access: ${settings.maxAccess})")
        } catch (e: Exception) {
            done(false, e.message)
        }
    }
}

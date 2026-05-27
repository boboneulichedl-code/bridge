package com.coreai.bridge

import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage
import com.intellij.util.xmlb.XmlSerializerUtil

@State(name = "BridgeSettings", storages = [Storage("bridge-settings.xml")])
class BridgeSettings : PersistentStateComponent<BridgeSettings> {
    var serverUrl: String = "https://bridge.chatpilot.link"
    var apiToken: String = ""
    var clientId: String = ""
    var maxAccess: Boolean = true
    var autonomous: Boolean = true
    var autoConnect: Boolean = true

    override fun getState(): BridgeSettings = this

    override fun loadState(state: BridgeSettings) {
        XmlSerializerUtil.copyBean(state, this)
    }

    fun ensureClientId(): String {
        if (clientId.isBlank()) {
            clientId = "studio-${java.util.UUID.randomUUID()}"
        }
        return clientId
    }
}

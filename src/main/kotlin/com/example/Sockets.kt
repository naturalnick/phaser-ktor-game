package com.example

import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.serialization.json.Json
import java.time.Duration
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import kotlin.time.Duration.Companion.seconds

fun Application.configureSockets() {
    install(WebSockets) {
        pingPeriod = 15.seconds
        timeout = 15.seconds
        maxFrameSize = Long.MAX_VALUE
        masking = false
    }

    val connectionManager = ConnectionManager()

    routing {
        webSocket("/game") {
            val playerId = call.parameters["id"] ?: generatePlayerId()
            try {
                for (frame in incoming) {
                    if (frame is Frame.Text) {
                        val text = frame.readText()
                        val parts = text.split("|")
                        println(parts)
                        when (parts[0]) {
                            "move" -> {
                                val x = parts[1].toDouble()
                                val y = parts[2].toDouble()
                                val mapId = parts[3]
                                connectionManager.updatePosition(playerId, x, y, mapId)
                            }
                            "join" -> {
                                val x = parts[1].toDouble()
                                val y = parts[2].toDouble()
                                val mapId = parts[3]
                                connectionManager.addConnection(this, playerId, x, y, mapId)
                            }
                            "chat" -> {
                                val message = parts[1]
                                val mapId = parts[2]
                                connectionManager.handleChatMessage(playerId, message, mapId)
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                println("Error: ${e.message}")  // Add logging to see what's failing
            } finally {
                connectionManager.removeConnection(playerId)
            }
        }
    }
}

private fun generatePlayerId(): String = UUID.randomUUID().toString()

sealed class GameMessage {
    data class PlayerMove(val id: String, val x: Double, val y: Double) : GameMessage()
    data class PlayerJoin(val id: String, val x: Double, val y: Double) : GameMessage()
    data class PlayerLeave(val id: String) : GameMessage()
}

data class PlayerPosition(
    val id: String,
    var x: Double,
    var y: Double,
    var mapId: String
)

class ConnectionManager {
    private val connections = ConcurrentHashMap<String, DefaultWebSocketServerSession>()
    private val playerPositions = ConcurrentHashMap<String, PlayerPosition>()

    suspend fun addConnection(session: DefaultWebSocketServerSession, id: String, x: Double, y: Double, mapId: String) {
        connections[id] = session
        val initialPosition = PlayerPosition(id, x, y, mapId)
        playerPositions[id] = initialPosition
        broadcastToMap(mapId, "join|$id|$x|$y", id)
    }

    suspend fun removeConnection(id: String) {
        playerPositions[id]?.let { position ->
            broadcastToMap(position.mapId, "leave|$id", id)
        }
        connections.remove(id)
        playerPositions.remove(id)
    }

    suspend fun updatePosition(id: String, x: Double, y: Double, mapId: String) {
        playerPositions[id]?.let { pos ->
            if (pos.mapId != mapId) {
                return changeMap(id, x, y, mapId)
            }

            pos.x = x
            pos.y = y
            broadcastToMap(pos.mapId, "move|$id|$x|$y", id)
        }
    }

    suspend fun handleChatMessage(id: String, message: String, mapId: String) {
        broadcastToMap(mapId, "chat|$id|$message", id)
    }

    private suspend fun changeMap(id: String, x: Double, y: Double, newMapId: String) {
        playerPositions[id]?.let { pos ->
            val oldMapId = pos.mapId
            // Notify old map players
            broadcastToMap(oldMapId, "leave|$id", id)

            // Update map and notify new map players
            pos.mapId = newMapId
            broadcastToMap(newMapId, "join|$id|${x}|${y}|${newMapId}", id)
        }
    }

    private suspend fun broadcastToMap(mapId: String, message: String, excludeId: String? = null) {
        // Find all players in this map and send them the message
        playerPositions.values
            .filter { it.mapId == mapId && it.id != excludeId }
            .forEach { player ->
                connections[player.id]?.send(Frame.Text(message))
            }
    }
}
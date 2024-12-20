package com.example

import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.serialization.Serializable
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
                            "enemyUpdate" -> {
                                val enemyData = parts[1]
                                val mapData = Json.decodeFromString<EnemyUpdateData>(enemyData)
                                connectionManager.handleEnemyUpdate(playerId, enemyData, mapData.mapId)
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
    @Serializable
    data class PlayerMove(val id: String, val x: Double, val y: Double) : GameMessage()
    @Serializable
    data class PlayerJoin(val id: String, val x: Double, val y: Double) : GameMessage()
    @Serializable
    data class PlayerLeave(val id: String) : GameMessage()
}

@Serializable
data class PlayerPosition(
    val id: String,
    var x: Double,
    var y: Double,
    var mapId: String
)

@Serializable
data class EnemyUpdateData(
    val mapId: String,
    val enemies: List<EnemyPosition>
)

@Serializable
data class EnemyPosition(
    val id: Int,
    val x: Double,
    val y: Double
)

class ConnectionManager {
    private val connections = ConcurrentHashMap<String, DefaultWebSocketServerSession>()
    private val playerPositions = ConcurrentHashMap<String, PlayerPosition>()
    private val mapHosts = ConcurrentHashMap<String, String>()

    suspend fun addConnection(session: DefaultWebSocketServerSession, id: String, x: Double, y: Double, mapId: String) {
        connections[id] = session
        val initialPosition = PlayerPosition(id, x, y, mapId)
        playerPositions[id] = initialPosition

        // If this is the first player in the map, make them the host
        if (!mapHosts.containsKey(mapId)) {
            mapHosts[mapId] = id
            connections[id]?.send(Frame.Text("enemyHost|$id"))
        }

        broadcastToMap(mapId, "join|$id|$x|$y", id)
    }

    suspend fun removeConnection(id: String) {
        playerPositions[id]?.let { position ->
            if (mapHosts[position.mapId] == id) {
                reassignHost(position.mapId, id)
            }
            broadcastToMap(position.mapId, "leave|$id", id)
        }
        connections.remove(id)
        playerPositions.remove(id)
    }

    private suspend fun reassignHost(mapId: String, oldHostId: String) {
        // Find another player in the same map
        val newHost = playerPositions.entries
            .firstOrNull { it.value.mapId == mapId && it.key != oldHostId }
            ?.key

        if (newHost != null) {
            mapHosts[mapId] = newHost
            connections[newHost]?.send(Frame.Text("enemyHost|$newHost"))
            broadcastToMap(mapId, "enemyHost|$newHost")
        } else {
            mapHosts.remove(mapId)
        }
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

    suspend fun handleEnemyUpdate(id: String, enemyData: String, mapId: String) {
        // Only relay enemy updates from the map host
        if (mapHosts[mapId] == id) {
            broadcastToMap(mapId, "enemyUpdate|$enemyData", id)
        }
    }

    private suspend fun changeMap(id: String, x: Double, y: Double, newMapId: String) {
        playerPositions[id]?.let { pos ->
            val oldMapId = pos.mapId

            if (mapHosts[oldMapId] == id) {
                reassignHost(oldMapId, id)
            }
            // Notify old map players
            broadcastToMap(oldMapId, "leave|$id", id)

            // Update map and notify new map players
            pos.mapId = newMapId
            if (!mapHosts.containsKey(newMapId)) {
                mapHosts[newMapId] = id
                connections[id]?.send(Frame.Text("enemyHost|$id"))
            }

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
package com.example

import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
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
                        val message = Json.decodeFromString<GameMessage>(frame.readText())
                        println(message.toString())
                        when (message) {
                            is GameMessage.PlayerMove -> {
                                connectionManager.updatePosition(
                                    message.id,
                                    message.x,
                                    message.y,
                                    message.mapId
                                )
                            }
                            is GameMessage.PlayerJoin -> {
                                connectionManager.addConnection(
                                    this,
                                    message.id,
                                    message.x,
                                    message.y,
                                    message.mapId
                                )
                            }
                            is GameMessage.ChatMessage -> {
                                connectionManager.handleChatMessage(
                                    message.id,
                                    message.message,
                                    message.mapId
                                )
                            }
                            is GameMessage.EnemyUpdate -> {
                                connectionManager.handleEnemyUpdate(
                                    message.id,
                                    message.data,
                                    message.data.mapId
                                )
                            }
                            is GameMessage.PlayerLeave -> {
                                connectionManager.removeConnection(message.id)
                            }
                            is GameMessage.EnemyHost -> {
                                // This is typically sent from server to client
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                println("Error processing message: ${e.message}, $e")
            } finally {
                connectionManager.removeConnection(playerId)
            }
        }
    }
}

private fun generatePlayerId(): String = UUID.randomUUID().toString()

@Serializable
sealed class GameMessage {
    @SerialName("PlayerMove")
    @Serializable
    data class PlayerMove(
        val id: String,
        val x: Double,
        val y: Double,
        val mapId: String
    ) : GameMessage()

    @SerialName("PlayerJoin")
    @Serializable
    data class PlayerJoin(
        val id: String,
        val x: Double,
        val y: Double,
        val mapId: String
    ) : GameMessage()

    @SerialName("PlayerLeave")
    @Serializable
    data class PlayerLeave(
        val id: String
    ) : GameMessage()

    @SerialName("ChatMessage")
    @Serializable
    data class ChatMessage(
        val id: String,
        val message: String,
        val mapId: String
    ) : GameMessage()

    @SerialName("EnemyUpdate")
    @Serializable
    data class EnemyUpdate(
        val id: String,
        val data: EnemyUpdateData
    ) : GameMessage()

    @SerialName("EnemyHost")
    @Serializable
    data class EnemyHost(
        val hostId: String,
        val mapId: String
    ) : GameMessage()
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
        if (!mapHosts.containsKey(mapId)) {
            mapHosts[mapId] = id
            connections[id]?.send(Frame.Text(Json.encodeToString(GameMessage.serializer(),
                GameMessage.EnemyHost(id, mapId)
            )))
        }
        broadcastToMap(
            mapId,
            GameMessage.PlayerJoin(id, x, y, mapId),
            id
        )
    }

    suspend fun removeConnection(id: String) {
        playerPositions[id]?.let { position ->
            if (mapHosts[position.mapId] == id) {
                reassignHost(position.mapId, id)
            }
            broadcastToMap(
                position.mapId,
                GameMessage.PlayerLeave(id),
                id
            )
        }
        connections.remove(id)
        playerPositions.remove(id)
    }

    private suspend fun reassignHost(mapId: String, oldHostId: String) {
        val newHost = playerPositions.entries
            .firstOrNull { it.value.mapId == mapId && it.key != oldHostId }
            ?.key

        if (newHost != null) {
            mapHosts[mapId] = newHost
            val hostMessage = GameMessage.EnemyHost(newHost, mapId)
            val serializedMessage = Json.encodeToString(GameMessage.serializer(), hostMessage)
            connections[newHost]?.send(Frame.Text(serializedMessage))
            broadcastToMap(mapId, hostMessage)
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
            broadcastToMap(
                pos.mapId,
                GameMessage.PlayerMove(id, x, y, mapId),
                id
            )
        }
    }

    suspend fun handleChatMessage(id: String, message: String, mapId: String) {
        broadcastToMap(
            mapId,
            GameMessage.ChatMessage(id, message, mapId),
            id
        )
    }

    private suspend fun changeMap(id: String, x: Double, y: Double, newMapId: String) {
        playerPositions[id]?.let { pos ->
            val oldMapId = pos.mapId

            if (mapHosts[oldMapId] == id) {
                reassignHost(oldMapId, id)
            }
            // Notify old map players of leave
            broadcastToMap(
                oldMapId,
                GameMessage.PlayerLeave(id),
                id
            )

            // Update map and notify new map players
            pos.mapId = newMapId
            if (!mapHosts.containsKey(newMapId)) {
                mapHosts[newMapId] = id
                val hostMessage = GameMessage.EnemyHost(id, newMapId)
                connections[id]?.send(Frame.Text(Json.encodeToString(GameMessage.serializer(), hostMessage)))
            }

            broadcastToMap(
                newMapId,
                GameMessage.PlayerJoin(id, x, y, newMapId),
                id
            )
        }
    }

    suspend fun handleEnemyUpdate(id: String, enemyData: EnemyUpdateData, mapId: String) {
        if (mapHosts[mapId] == id) {
            broadcastToMap(
                mapId,
                GameMessage.EnemyUpdate(id, enemyData),
                id
            )
        }
    }

    private suspend fun broadcastToMap(mapId: String, message: GameMessage, excludeId: String? = null) {
        val serializedMessage = Json.encodeToString(GameMessage.serializer(), message)
        playerPositions.values
            .filter { it.mapId == mapId && it.id != excludeId }
            .forEach { player ->
                connections[player.id]?.send(Frame.Text(serializedMessage))
            }
    }
}
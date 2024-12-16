package com.example

import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import java.io.File
import java.time.Duration
import kotlin.time.Duration.Companion.seconds

fun Application.configureRouting() {
    routing {
        staticResources("/", "static") {
            default("index.html")
        }
    }
}

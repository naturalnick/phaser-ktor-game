plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.ktor)
    alias(libs.plugins.kotlin.plugin.serialization)
    id("com.github.node-gradle.node") version "7.0.1"
}

group = "com.example"
version = "0.0.1"

application {
    mainClass.set("io.ktor.server.netty.EngineMain")

    val isDevelopment: Boolean = project.ext.has("development")
    applicationDefaultJvmArgs = listOf("-Dio.ktor.development=$isDevelopment")
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(libs.ktor.server.core)
    implementation(libs.ktor.server.websockets)
    implementation(libs.ktor.server.host.common)
    implementation(libs.ktor.server.content.negotiation)
    implementation(libs.ktor.serialization.kotlinx.json)
    implementation(libs.ktor.server.netty)
    implementation(libs.logback.classic)
    implementation(libs.ktor.server.config.yaml)
    testImplementation(libs.ktor.server.test.host)
    testImplementation(libs.kotlin.test.junit)
    implementation("org.postgresql:postgresql:42.5.1")
}

node {
    version.set("20.11.0")
    download.set(true)
    workDir.set(file("${project.buildDir}/nodejs"))
    npmWorkDir.set(file("${project.buildDir}/npm"))
    nodeProjectDir.set(file("${project.projectDir}/client"))
}

tasks {
    register<com.github.gradle.node.npm.task.NpmTask>("buildClient") {
        dependsOn(npmInstall)
        args.set(listOf("run", "build"))

        inputs.dir("client/src")
        inputs.files(
            "client/package.json",
            "client/tsconfig.json",
            "client/vite.config.ts",
            "client/index.html"
        )
        outputs.dir("${project.buildDir}/resources/main/static")
    }

    named("processResources") {
        dependsOn("buildClient")
    }
}
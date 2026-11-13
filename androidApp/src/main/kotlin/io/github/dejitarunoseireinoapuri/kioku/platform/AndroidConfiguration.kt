package io.github.dejitarunoseireinoapuri.kioku.platform

import com.google.firebase.functions.FirebaseFunctions
import com.google.firebase.functions.FirebaseFunctionsException
import io.github.dejitarunoseireinoapuri.kioku.data.NativeCancellation
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.AiConfiguration
import io.github.dejitarunoseireinoapuri.kioku.domain.ConfigurationResult
import java.util.concurrent.TimeUnit

private const val CONFIGURATION_TIMEOUT_SECONDS = 15L

internal class AndroidConfiguration(
    private val functions: FirebaseFunctions,
) {
    fun load(completion: (ConfigurationResult) -> Unit): NativeCancellation {
        var cancelled = false
        val call = functions.getHttpsCallable("getConfiguration")
        call.setTimeout(CONFIGURATION_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        call.call(mapOf("apiVersion" to 1)).addOnCompleteListener { task ->
            if (!cancelled) {
                completion(if (task.isSuccessful) parse(task.result.data) else failure(task.exception))
            }
        }
        return NativeCancellation { cancelled = true }
    }

    private fun parse(data: Any?): ConfigurationResult {
        val value = data as? Map<*, *>
        val ai =
            when (value?.get("ai")) {
                "ready" -> AiConfiguration.Ready
                "notConfigured" -> AiConfiguration.NotConfigured
                else -> null
            }
        return if (value != null && valid(value) && ai != null) ConfigurationResult.Loaded(ai) else unavailable()
    }

    private fun valid(value: Map<*, *>) =
        value.keys == setOf("apiVersion", "account", "ai", "revision") &&
            (value["apiVersion"] as? Number)?.toDouble() == 1.0 && value["account"] == "authorized" &&
            (value["revision"] as? Number)?.toDouble()?.let { it >= 0 && it % 1 == 0.0 } == true

    private fun failure(error: Exception?): ConfigurationResult {
        val code = (error as? FirebaseFunctionsException)?.code
        val issue =
            if (code == FirebaseFunctionsException.Code.PERMISSION_DENIED) {
                AccountIssue.Denied
            } else {
                AccountIssue.Unavailable
            }
        return ConfigurationResult.Failed(issue)
    }

    private fun unavailable() = ConfigurationResult.Failed(AccountIssue.Unavailable)
}

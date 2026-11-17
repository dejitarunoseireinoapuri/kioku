package io.github.dejitarunoseireinoapuri.kioku.platform

import org.json.JSONObject

/** Native transport boundary. Production uses authenticated/attested Firebase callables only. */
internal interface ReferenceRpc {
    suspend fun post(
        path: String,
        payload: JSONObject = JSONObject(),
    ): JSONObject
}

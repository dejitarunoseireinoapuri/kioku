package io.github.dejitarunoseireinoapuri.kioku.platform

import com.google.firebase.FirebaseNetworkException
import com.google.firebase.functions.FirebaseFunctionsException
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import java.io.IOException
import java.net.SocketTimeoutException

/** Inspect only exception types/codes, never messages or provider payloads. */
internal fun memoryTransportIssue(error: Exception?): CaptureIssue {
    val base = memoryFailureCode((error as? FirebaseFunctionsException)?.code)
    val causes = generateSequence(error as Throwable?) { it.cause }.take(MAX_ERROR_CAUSES).toList()
    return when {
        base != CaptureIssue.Unavailable -> base
        causes.any { it is SocketTimeoutException } -> CaptureIssue.TimedOut
        causes.any { it is IOException || it is FirebaseNetworkException } -> CaptureIssue.Connection
        else -> base
    }
}

internal fun memoryFailureCode(code: FirebaseFunctionsException.Code?): CaptureIssue =
    when (code) {
        FirebaseFunctionsException.Code.DEADLINE_EXCEEDED -> {
            CaptureIssue.TimedOut
        }

        FirebaseFunctionsException.Code.PERMISSION_DENIED, FirebaseFunctionsException.Code.UNAUTHENTICATED -> {
            CaptureIssue.Denied
        }

        FirebaseFunctionsException.Code.INVALID_ARGUMENT -> {
            CaptureIssue.Invalid
        }

        FirebaseFunctionsException.Code.RESOURCE_EXHAUSTED -> {
            CaptureIssue.Limited
        }

        FirebaseFunctionsException.Code.FAILED_PRECONDITION -> {
            CaptureIssue.NotConfigured
        }

        else -> {
            CaptureIssue.Unavailable
        }
    }

private const val MAX_ERROR_CAUSES = 8

package io.github.dejitarunoseireinoapuri.kioku.platform

import android.content.Intent
import android.net.Uri
import android.os.BadParcelableException
import androidx.core.content.IntentCompat
import androidx.core.net.toUri
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue

internal sealed interface ReferenceDelivery {
    data class Files(
        val uris: List<Uri>,
    ) : ReferenceDelivery

    data class Web(
        val url: String,
    ) : ReferenceDelivery

    data class Failed(
        val issue: ReferenceIssue,
    ) : ReferenceDelivery
}

/** Envelope only. Provider metadata/bytes are read later, after authenticated account admission. */
internal fun receiveReferences(intent: Intent): ReferenceDelivery =
    try {
        when (intent.action) {
            Intent.ACTION_SEND, Intent.ACTION_SEND_MULTIPLE -> receiveEnvelope(intent)
            else -> ReferenceDelivery.Failed(ReferenceIssue.Invalid)
        }
    } catch (_: BadParcelableException) {
        ReferenceDelivery.Failed(ReferenceIssue.Invalid)
    } catch (_: ClassCastException) {
        ReferenceDelivery.Failed(ReferenceIssue.Invalid)
    }

private fun receiveEnvelope(intent: Intent): ReferenceDelivery {
    val streams = referenceStreams(intent)
    return when {
        streams.size > MAX_SHARED_FILES -> {
            ReferenceDelivery.Failed(ReferenceIssue.TooLarge)
        }

        (intent.clipData?.itemCount ?: 0) > MAX_SHARED_FILES -> {
            ReferenceDelivery.Failed(ReferenceIssue.TooLarge)
        }

        streams.isNotEmpty() -> {
            receiveFiles(intent, streams)
        }

        intent.action == Intent.ACTION_SEND_MULTIPLE -> {
            ReferenceDelivery.Failed(ReferenceIssue.Invalid)
        }

        else -> {
            receiveWeb(
                intent
                    .getCharSequenceExtra(Intent.EXTRA_TEXT)
                    ?.toString()
                    ?.trim()
                    .orEmpty(),
            )
        }
    }
}

private fun receiveFiles(
    intent: Intent,
    streams: List<Uri>,
): ReferenceDelivery =
    when {
        intent.flags and Intent.FLAG_GRANT_READ_URI_PERMISSION == 0 -> {
            ReferenceDelivery.Failed(ReferenceIssue.Permission)
        }

        streams.any { it.scheme != "content" || it.authority.isNullOrBlank() } -> {
            ReferenceDelivery.Failed(ReferenceIssue.Permission)
        }

        else -> {
            ReferenceDelivery.Files(streams)
        }
    }

private fun receiveWeb(text: String): ReferenceDelivery {
    if (text.length > MAX_LINK_SIZE) return ReferenceDelivery.Failed(ReferenceIssue.TooLarge)
    val candidates = Regex("https://[^\\s]+", RegexOption.IGNORE_CASE).findAll(text).map { it.value }.toList()
    return when {
        candidates.size != 1 -> ReferenceDelivery.Failed(ReferenceIssue.Invalid)
        else -> validateLink(candidates.single().toUri())
    }
}

private fun validateLink(link: Uri): ReferenceDelivery {
    val validOrigin = link.scheme?.lowercase() == "https" && !link.host.isNullOrBlank() && link.userInfo == null
    val port = runCatching { link.port }.getOrDefault(INVALID_PORT)
    return when {
        !validOrigin || (port != -1 && port != HTTPS_PORT) -> ReferenceDelivery.Failed(ReferenceIssue.Invalid)
        link.host in setOf("drive.google.com", "docs.google.com") -> ReferenceDelivery.Failed(ReferenceIssue.DriveLink)
        else -> ReferenceDelivery.Web(link.toString())
    }
}

private fun referenceStreams(intent: Intent): List<Uri> {
    val streams =
        if (intent.action == Intent.ACTION_SEND_MULTIPLE) {
            IntentCompat.getParcelableArrayListExtra(intent, Intent.EXTRA_STREAM, Uri::class.java).orEmpty()
        } else {
            listOfNotNull(IntentCompat.getParcelableExtra(intent, Intent.EXTRA_STREAM, Uri::class.java))
        }
    if (streams.size > MAX_SHARED_FILES) return streams.take(MAX_SHARED_FILES + 1)
    val clipped =
        intent.clipData
            ?.let { clip ->
                (0 until minOf(clip.itemCount, MAX_SHARED_FILES)).mapNotNull { clip.getItemAt(it).uri }
            }.orEmpty()
    return (streams + clipped).distinct()
}

private const val MAX_SHARED_FILES = 5
private const val MAX_LINK_SIZE = 4096
private const val HTTPS_PORT = 443
private const val INVALID_PORT = -2

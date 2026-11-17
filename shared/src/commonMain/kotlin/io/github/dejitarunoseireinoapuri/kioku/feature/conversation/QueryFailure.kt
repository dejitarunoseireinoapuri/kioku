package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_more_context
import io.github.dejitarunoseireinoapuri.kioku.resources.connection_error
import io.github.dejitarunoseireinoapuri.kioku.resources.query_error
import io.github.dejitarunoseireinoapuri.kioku.resources.request_timeout

internal fun queryFailureText(issue: CaptureIssue) =
    when (issue) {
        CaptureIssue.Connection -> Res.string.connection_error
        CaptureIssue.TimedOut -> Res.string.request_timeout
        CaptureIssue.MoreContext -> Res.string.capture_more_context
        else -> Res.string.query_error
    }

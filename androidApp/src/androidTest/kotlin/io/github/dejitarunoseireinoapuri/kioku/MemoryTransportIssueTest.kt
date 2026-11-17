package io.github.dejitarunoseireinoapuri.kioku

import com.google.firebase.functions.FirebaseFunctionsException
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.platform.memoryFailureCode
import io.github.dejitarunoseireinoapuri.kioku.platform.memoryTransportIssue
import org.junit.Assert.assertEquals
import org.junit.Test
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

class MemoryTransportIssueTest {
    @Test
    fun nativeNetworkCausesAndTimeoutsHaveSpecificSafeCategories() {
        assertEquals(CaptureIssue.Connection, memoryTransportIssue(UnknownHostException("fixture")))
        assertEquals(CaptureIssue.Connection, memoryTransportIssue(RuntimeException(IOException("fixture"))))
        assertEquals(CaptureIssue.TimedOut, memoryTransportIssue(SocketTimeoutException("fixture")))
        assertEquals(
            CaptureIssue.TimedOut,
            memoryFailureCode(FirebaseFunctionsException.Code.DEADLINE_EXCEEDED),
        )
    }

    @Test
    fun serverUnavailableAndAuthorizationAreNotReportedAsPoorCoverage() {
        assertEquals(
            CaptureIssue.Unavailable,
            memoryFailureCode(FirebaseFunctionsException.Code.UNAVAILABLE),
        )
        assertEquals(
            CaptureIssue.Denied,
            memoryFailureCode(FirebaseFunctionsException.Code.PERMISSION_DENIED),
        )
        assertEquals(CaptureIssue.Unavailable, memoryTransportIssue(IllegalArgumentException("fixture")))
    }
}

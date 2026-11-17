package io.github.dejitarunoseireinoapuri.kioku

import android.Manifest
import android.content.ContextWrapper
import android.content.pm.PackageManager
import androidx.test.platform.app.InstrumentationRegistry
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceObserver
import io.github.dejitarunoseireinoapuri.kioku.platform.AndroidVoiceInput
import org.junit.Assert.assertEquals
import org.junit.Test

class VoicePermissionDeviceTest {
    @Test fun deniedPermissionNeverCreatesAnAudioSourceOrStartsRecognition() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val denied =
            object : ContextWrapper(instrumentation.targetContext) {
                override fun checkPermission(
                    permission: String,
                    pid: Int,
                    uid: Int,
                ): Int =
                    if (permission == Manifest.permission.RECORD_AUDIO) {
                        PackageManager.PERMISSION_DENIED
                    } else {
                        super.checkPermission(permission, pid, uid)
                    }
            }
        var observedIssue: VoiceIssue? = null
        var audioSources = 0
        instrumentation.runOnMainSync {
            val input =
                AndroidVoiceInput(denied, {}, {
                    audioSources++
                    error("No microphone may be allocated without permission")
                })
            try {
                input.begin(
                    object : VoiceObserver {
                        override fun ready() = error("Permission denied")

                        override fun partial(text: String) = error("Permission denied")

                        override fun completed(text: String) = error("Permission denied")

                        override fun failed(issue: VoiceIssue) {
                            observedIssue = issue
                        }
                    },
                )
            } finally {
                input.close()
            }
        }
        assertEquals(0, audioSources)
        assertEquals(VoiceIssue.Permission, observedIssue)
    }
}

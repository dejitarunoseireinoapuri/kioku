package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.platform.PcmVoicePipe
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.FileInputStream
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class VoicePipeDeviceTest {
    @Test fun cancellationDoesNotWaitForAStalledReader() {
        val pipe = PcmVoicePipe()
        val stopped = CountDownLatch(1)
        val worker =
            Thread {
                try {
                    pipe.write(ByteArray(1_000_000))
                } catch (
                    _: Exception,
                ) {
                    // Cancellation closes the descriptors.
                } finally {
                    stopped.countDown()
                }
            }
        try {
            worker.start()
            // One byte proves the writer started; the remaining megabyte cannot fit in the pipe.
            val stream = FileInputStream(pipe.source.fileDescriptor)
            assertTrue(stream.read() >= 0)
            assertFalse(stopped.await(0, TimeUnit.NANOSECONDS))
            pipe.cancel()
            assertTrue("Closing a full pipe must release the writer", stopped.await(2, TimeUnit.SECONDS))
        } finally {
            pipe.cancel()
            worker.join(TimeUnit.SECONDS.toMillis(2))
        }
    }
}

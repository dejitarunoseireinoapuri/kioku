package io.github.dejitarunoseireinoapuri.kioku

import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.core.app.ActivityScenario
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSafeArea
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** Validates real window geometry without Espresso input injection or private content. */
class GestureSafeAreaTest {
    @Test fun bottomControlsClearSystemGestureAreaWithExtraSpace() {
        val laidOut = CountDownLatch(1)
        LifecycleTestActivity.content = null
        try {
            ActivityScenario.launch(LifecycleTestActivity::class.java).use { scenario ->
                scenario.onActivity {
                    it.enableEdgeToEdge()
                    activityView = it.window.decorView
                    it.setContent { SafeContent(laidOut) }
                }
                assertTrue(
                    "Content must clear real gesture inset plus 8 dp: $lastGeometry",
                    laidOut.await(10, TimeUnit.SECONDS),
                )
            }
        } finally {
            activityView = null
            LifecycleTestActivity.content = null
        }
    }

    @Composable
    private fun SafeContent(laidOut: CountDownLatch) {
        KiokuSafeArea {
            Box(
                Modifier.fillMaxSize().onGloballyPositioned { coordinates ->
                    val view = activityView ?: return@onGloballyPositioned
                    val insets = ViewCompat.getRootWindowInsets(view) ?: return@onGloballyPositioned
                    val blocked =
                        insets
                            .getInsets(
                                WindowInsetsCompat.Type.systemBars() or
                                    WindowInsetsCompat.Type.mandatorySystemGestures(),
                            ).bottom
                    val bottom = coordinates.boundsInWindow().bottom
                    val margin = view.height - bottom
                    lastGeometry = "inset=$blocked margin=$margin height=${view.height}"
                    if (blocked > 0 && margin >= blocked + 8 * view.resources.displayMetrics.density - 1) {
                        laidOut.countDown()
                    }
                },
            )
        }
    }

    @Volatile private var lastGeometry = "no layout"
    private var activityView: android.view.View? = null
}

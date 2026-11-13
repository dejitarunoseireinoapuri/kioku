package io.github.dejitarunoseireinoapuri.kioku

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.Composable

/** Non-exported debug host: instrumentation supplies synthetic content across real recreation. */
class LifecycleTestActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { content?.invoke() }
    }

    companion object {
        var content: (@Composable () -> Unit)? = null
    }
}

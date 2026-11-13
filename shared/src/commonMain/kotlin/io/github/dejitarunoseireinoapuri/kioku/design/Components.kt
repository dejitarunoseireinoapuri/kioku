package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.material.Button
import androidx.compose.material.ButtonDefaults
import androidx.compose.material.Divider
import androidx.compose.material.Icon
import androidx.compose.material.IconButton
import androidx.compose.material.MaterialTheme
import androidx.compose.material.OutlinedButton
import androidx.compose.material.Surface
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import org.jetbrains.compose.resources.DrawableResource
import org.jetbrains.compose.resources.painterResource

@Composable
fun ActionButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    primary: Boolean = false,
    enabled: Boolean = true,
) {
    val target = modifier.sizeIn(minHeight = KiokuSpacing.TouchTarget)
    if (primary) {
        Button(
            enabled = enabled,
            onClick = onClick,
            modifier = target,
            elevation = null,
            colors = ButtonDefaults.buttonColors(),
        ) { Text(label) }
    } else {
        OutlinedButton(
            enabled = enabled,
            onClick = onClick,
            modifier = target,
            border = BorderStroke(1.dp, KiokuColors.Rule),
        ) { Text(label, color = KiokuColors.Secondary) }
    }
}

@Composable
fun IconAction(
    icon: DrawableResource,
    description: String,
    onClick: () -> Unit,
) {
    IconButton(onClick = onClick, modifier = Modifier.sizeIn(48.dp, 48.dp)) {
        Icon(painterResource(icon), description, tint = KiokuColors.Secondary)
    }
}

@Composable
fun Panel(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        border = BorderStroke(1.dp, KiokuColors.Rule),
        elevation = 0.dp,
    ) {
        Column(Modifier.padding(KiokuSpacing.Medium), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            content()
        }
    }
}

@Composable
fun ScreenHeading(title: String) {
    Text(title, style = MaterialTheme.typography.h5, modifier = Modifier.semantics { heading() })
}

@Composable
fun TopBar(
    title: String,
    leading: @Composable () -> Unit = { KiokuMark(Modifier.size(24.dp)) },
    trailing: @Composable () -> Unit = {},
) {
    Column {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
        ) {
            leading()
            Column(Modifier.weight(1f)) { ScreenHeading(title) }
            trailing()
        }
        Divider(color = KiokuColors.Rule)
    }
}

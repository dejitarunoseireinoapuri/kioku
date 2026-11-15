package io.github.dejitarunoseireinoapuri.kioku.feature.account

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuWordmark
import io.github.dejitarunoseireinoapuri.kioku.design.TerminalBrandMark
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountIssue
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.login_description
import io.github.dejitarunoseireinoapuri.kioku.resources.login_title
import org.jetbrains.compose.resources.stringResource

@Composable
internal fun LoginScreen(
    issue: AccountIssue?,
    onSignIn: () -> Unit,
) {
    BoxWithConstraints(Modifier.fillMaxSize()) {
        val viewportHeight = maxHeight
        Column(
            Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .heightIn(min = viewportHeight)
                .padding(horizontal = KiokuSpacing.Large, vertical = KiokuSpacing.LoginVertical),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Box(
                Modifier.fillMaxWidth().heightIn(min = viewportHeight * 0.75f),
                contentAlignment = Alignment.Center,
            ) { LoginIntroduction() }
            Column(
                Modifier.fillMaxWidth().padding(top = KiokuSpacing.Large),
                verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Medium),
            ) {
                issue?.let { AccountIssueText(it) }
                GoogleButton(true, onSignIn, Modifier.fillMaxWidth())
            }
        }
    }
}

@Composable
private fun LoginIntroduction() {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        TerminalBrandMark()
        Column(Modifier.padding(top = KiokuSpacing.Medium)) { KiokuWordmark() }
        Text(
            stringResource(Res.string.login_title),
            modifier = Modifier.padding(top = KiokuSpacing.LoginHeadlineGap).semantics { heading() },
            style = MaterialTheme.typography.body1.copy(fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold),
            color = KiokuColors.Accent,
            textAlign = TextAlign.Center,
        )
        Text(
            stringResource(Res.string.login_description),
            modifier = Modifier.padding(top = KiokuSpacing.Medium),
            color = KiokuColors.BrandSecondary,
            style = MaterialTheme.typography.body1,
            textAlign = TextAlign.Center,
        )
    }
}

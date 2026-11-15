package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.EditableSource
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChangeDescription
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryItem
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryReference
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.describeChange
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationState
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.TextConversationState
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.TextMessage
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.afterChange
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.canManage
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class MemoryChangePresentationTest {
    @Test
    fun descriptionsNameOnlyTheSelectedFactAndRejectMissingOrDuplicateSelections() {
        val source =
            EditableSource(
                MemorySource("source", "Dos asuntos.", "2026-11-15"),
                "version",
                listOf(MemoryItem("first", "Mi examen es el martes."), MemoryItem("second", "Quiero ver Loto.")),
                0,
            )
        assertEquals(
            MemoryChangeDescription("Mi examen es el martes.", "Mi examen es el viernes."),
            source.describeChange(listOf("first"), "Mi examen es el viernes."),
        )
        assertEquals(MemoryChangeDescription("Quiero ver Loto."), source.describeChange(listOf("second"), null))
        for (ids in listOf(emptyList(), listOf("first", "foreign"), listOf("first", "first"))) {
            assertNull(source.describeChange(ids, null))
        }
    }

    @Test
    fun managementRequiresCurrentReferencesAndCannotUseAnOldAnswerAfterAChange() {
        val answer =
            QueryOutcome.Reply(
                AnswerStatus.Answered,
                "Dos planes.",
                listOf(QueryReference("first", "2026-11-15"), QueryReference("second", "2026-11-15")),
            )
        val chat = TextConversationState(messages = listOf(TextMessage.Result(1, TextOutcome.Asked(answer))))
        val state = ConversationState(conversation = chat)
        assertTrue(state.canManage(listOf("first", "second")))
        assertTrue(state.canManage(listOf("second")))
        for (ids in listOf(emptyList(), listOf("foreign"), listOf("first", "first"))) {
            assertFalse(state.canManage(ids))
        }
        val changed = chat.afterChange(MemoryChange.Confirmed(ChangeAction.Forget, 1))
        assertFalse(state.copy(conversation = changed).canManage(listOf("first")))
        assertFalse(ConversationState().canManage(listOf("first")))
    }
}

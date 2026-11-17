package io.github.dejitarunoseireinoapuri.kioku.platform

import android.content.ContentResolver
import android.content.Intent
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelStore
import androidx.lifecycle.ViewModelStoreOwner
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceFailure
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceWorkspaceRepository
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceWork
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceWorkspaceViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.koin.dsl.koinApplication
import org.koin.dsl.module

internal class AndroidReferenceHost(
    resolver: ContentResolver,
    rpc: ReferenceRpc,
) : ViewModel(),
    ViewModelStoreOwner {
    private val reader = ReferenceFileReader(resolver)
    private val repository = AndroidReferenceRepository(rpc, reader)
    override val viewModelStore = ViewModelStore()
    private val dependencies =
        koinApplication {
            modules(
                module {
                    single<ReferenceWorkspaceRepository> { repository }
                    factory { ReferenceWorkspaceViewModel(get()) }
                },
            )
        }
    private val factory = viewModelFactory { initializer { dependencies.koin.get<ReferenceWorkspaceViewModel>() } }
    val model = ViewModelProvider(this, factory)[ReferenceWorkspaceViewModel::class.java]
    private val mutableReceiving = MutableStateFlow(false)
    val receiving = mutableReceiving.asStateFlow()
    private var incomingJob: Job? = null

    init {
        model.editWeb("")
        model.refresh()
    }

    fun receive(intent: Intent) {
        // A new delivery supersedes a read-only startup refresh, never a pending import or deletion.
        if (model.state.value.work == ReferenceWork.Loading) model.interrupt()
        if (model.state.value.work != null || receiving.value) return model.report(ReferenceIssue.Busy)
        when (val delivery = receiveReferences(intent)) {
            is ReferenceDelivery.Failed -> {
                model.report(delivery.issue)
            }

            is ReferenceDelivery.Web -> {
                model.editWeb(delivery.url)
                model.importWeb(
                    java.util.UUID
                        .randomUUID()
                        .toString(),
                )
            }

            is ReferenceDelivery.Files -> {
                receiveFiles(delivery)
            }
        }
    }

    private fun receiveFiles(delivery: ReferenceDelivery.Files) {
        mutableReceiving.value = true
        incomingJob =
            viewModelScope.launch {
                try {
                    repository.clearTransfers()
                    // Recheck the authorized catalog before reading provider metadata or bytes.
                    repository.catalog()
                    model.importFiles(reader.describe(delivery))
                } catch (
                    error: CancellationException,
                ) {
                    throw error
                } catch (
                    error: ReferenceReadFailure,
                ) {
                    model.report(error.issue)
                } catch (error: ReferenceFailure) {
                    model.report(error.issue)
                } finally {
                    mutableReceiving.value = false
                }
            }
    }

    fun interrupt() {
        incomingJob?.cancel()
        reader.close()
        mutableReceiving.value = false
        model.interrupt()
    }

    fun close() {
        interrupt()
        reader.close()
        viewModelStore.clear()
        repository.clearTransfers()
        dependencies.close()
    }

    override fun onCleared() = close()
}

package br.com.jadson.appchecklistpemt.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import br.com.jadson.appchecklistpemt.databinding.ItemHistoryBinding
import br.com.jadson.appchecklistpemt.data.model.Checklist

class HistoryAdapter(
    private val onDeleteClick: (Checklist) -> Unit,
    private val onPdfClick: (Checklist) -> Unit,
    private val onDetailsClick: (Checklist) -> Unit
) : ListAdapter<Checklist, HistoryAdapter.HistoryViewHolder>(DiffCallback) {

    class HistoryViewHolder(private val binding: ItemHistoryBinding) :
        RecyclerView.ViewHolder(binding.root) {
        
        fun bind(
            checklist: Checklist,
            onDeleteClick: (Checklist) -> Unit,
            onPdfClick: (Checklist) -> Unit,
            onDetailsClick: (Checklist) -> Unit
        ) {
            binding.tvModel.text = checklist.model
            binding.tvDate.text = "${checklist.date} ${checklist.time}"
            binding.tvSerial.text = "Série: ${checklist.serialNumber}"
            binding.tvOwner.text = "Proprietário: ${checklist.owner}"
            
            binding.btnDelete.setOnClickListener { onDeleteClick(checklist) }
            binding.btnPdf.setOnClickListener { onPdfClick(checklist) }
            binding.btnDetails.setOnClickListener { onDetailsClick(checklist) }
            
            // Ocultar rascunho se existir (pois voltamos para versão estável)
            binding.chipDraft.visibility = android.view.View.GONE
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HistoryViewHolder {
        val binding = ItemHistoryBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return HistoryViewHolder(binding)
    }

    override fun onBindViewHolder(holder: HistoryViewHolder, position: Int) {
        holder.bind(getItem(position), onDeleteClick, onPdfClick, onDetailsClick)
    }

    object DiffCallback : DiffUtil.ItemCallback<Checklist>() {
        override fun areItemsTheSame(oldItem: Checklist, newItem: Checklist): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Checklist, newItem: Checklist): Boolean {
            return oldItem == newItem
        }
    }
}

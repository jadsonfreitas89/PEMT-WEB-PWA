package br.com.jadson.appchecklistpemt.ui.adapter

import android.content.Context
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.Toast
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import br.com.jadson.appchecklistpemt.R
import br.com.jadson.appchecklistpemt.databinding.ItemCategoryHeaderBinding
import br.com.jadson.appchecklistpemt.databinding.ItemChecklistBinding
import br.com.jadson.appchecklistpemt.databinding.ItemChecklistFooterBinding
import br.com.jadson.appchecklistpemt.databinding.ItemChecklistHeaderBinding
import br.com.jadson.appchecklistpemt.databinding.ItemFinalReportBinding
import br.com.jadson.appchecklistpemt.data.model.ChecklistDisplayItem
import br.com.jadson.appchecklistpemt.data.model.ChecklistItem
import br.com.jadson.appchecklistpemt.core.constants.AppConstants
import com.google.android.material.dialog.MaterialAlertDialogBuilder

class ChecklistAdapter(
    private val onHeaderBound: (ItemChecklistHeaderBinding) -> Unit,
    private val onFooterBound: (ItemChecklistFooterBinding) -> Unit,
    private val onCategoryClicked: (String) -> Unit,
    private val onItemChanged: (ChecklistItem) -> Unit
) : ListAdapter<ChecklistDisplayItem, RecyclerView.ViewHolder>(DiffCallback) {

    companion object {
        private const val TYPE_HEADER = 0
        private const val TYPE_CAT_HEADER = 1
        private const val TYPE_ITEM = 2
        private const val TYPE_REPORT = 3
        private const val TYPE_FOOTER = 4
    }

    override fun getItemViewType(position: Int): Int {
        return when (getItem(position)) {
            is ChecklistDisplayItem.Header -> TYPE_HEADER
            is ChecklistDisplayItem.CategoryHeader -> TYPE_CAT_HEADER
            is ChecklistDisplayItem.Item -> TYPE_ITEM
            is ChecklistDisplayItem.FinalReport -> TYPE_REPORT
            is ChecklistDisplayItem.Footer -> TYPE_FOOTER
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return when (viewType) {
            TYPE_HEADER -> HeaderViewHolder(ItemChecklistHeaderBinding.inflate(inflater, parent, false))
            TYPE_CAT_HEADER -> CategoryViewHolder(ItemCategoryHeaderBinding.inflate(inflater, parent, false))
            TYPE_ITEM -> ItemViewHolder(ItemChecklistBinding.inflate(inflater, parent, false))
            TYPE_REPORT -> ReportViewHolder(ItemFinalReportBinding.inflate(inflater, parent, false))
            TYPE_FOOTER -> FooterViewHolder(ItemChecklistFooterBinding.inflate(inflater, parent, false))
            else -> throw IllegalArgumentException("Invalid view type")
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (val item = getItem(position)) {
            is ChecklistDisplayItem.Header -> onHeaderBound((holder as HeaderViewHolder).binding)
            is ChecklistDisplayItem.CategoryHeader -> (holder as CategoryViewHolder).bind(item, onCategoryClicked)
            is ChecklistDisplayItem.Item -> (holder as ItemViewHolder).bind(item.checklistItem, onItemChanged)
            is ChecklistDisplayItem.FinalReport -> (holder as ReportViewHolder).bind(item)
            is ChecklistDisplayItem.Footer -> onFooterBound((holder as FooterViewHolder).binding)
        }
    }

    class HeaderViewHolder(val binding: ItemChecklistHeaderBinding) : RecyclerView.ViewHolder(binding.root)
    class FooterViewHolder(val binding: ItemChecklistFooterBinding) : RecyclerView.ViewHolder(binding.root)
    
    class ReportViewHolder(val binding: ItemFinalReportBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(report: ChecklistDisplayItem.FinalReport) {
            binding.tvFinalStatus.text = report.status
            binding.tvJustification.text = report.justification
            val color = if (report.status == "APROVADA") "#4CAF50" else "#F44336"
            binding.tvFinalStatus.setTextColor(android.graphics.Color.parseColor(color))
        }
    }

    class CategoryViewHolder(private val binding: ItemCategoryHeaderBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(header: ChecklistDisplayItem.CategoryHeader, onClick: (String) -> Unit) {
            binding.tvCategoryName.text = header.name
            binding.ivArrow.rotation = if (header.isExpanded) 180f else 0f
            binding.ivCheck.visibility = if (header.isCompleted) View.VISIBLE else View.GONE
            binding.root.setOnClickListener { onClick(header.name) }
        }
    }

    class ItemViewHolder(private val binding: ItemChecklistBinding) : RecyclerView.ViewHolder(binding.root) {
        private var textWatcher: TextWatcher? = null

        fun bind(item: ChecklistItem, onItemChanged: (ChecklistItem) -> Unit) {
            binding.tvCategory.text = item.category
            binding.tvDescription.text = item.description
            
            updateStatusButton(item.status)

            binding.btnStatus.setOnClickListener {
                showStatusDialog(item, onItemChanged)
            }
            
            // Text box always visible as requested
            binding.tilObservation.visibility = View.VISIBLE
            
            // Hide end icon by default
            binding.tilObservation.isEndIconVisible = false
            
            // Remove old watcher to avoid multiple updates
            textWatcher?.let { binding.etObservation.removeTextChangedListener(it) }
            binding.etObservation.setText(item.observation)
            
            textWatcher = object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                    item.observation = s?.toString()
                }
                override fun afterTextChanged(s: Editable?) {
                    // Show icon only if focused and text changed
                    binding.tilObservation.isEndIconVisible = binding.etObservation.isFocused
                }
            }
            binding.etObservation.addTextChangedListener(textWatcher)

            binding.etObservation.setOnFocusChangeListener { _, hasFocus ->
                binding.tilObservation.isEndIconVisible = hasFocus
            }

            val saveObservation = {
                binding.etObservation.clearFocus()
                val imm = binding.root.context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                imm.hideSoftInputFromWindow(binding.etObservation.windowToken, 0)
                onItemChanged(item) // Notify save
                Toast.makeText(binding.root.context, "Observação salva", Toast.LENGTH_SHORT).show()
            }

            binding.tilObservation.setEndIconOnClickListener {
                saveObservation()
            }
            
            binding.etObservation.setOnEditorActionListener { _, actionId, _ ->
                if (actionId == EditorInfo.IME_ACTION_DONE) {
                    saveObservation()
                    true
                } else false
            }
        }

        private fun updateStatusButton(status: String) {
            binding.btnStatus.text = if (status == AppConstants.InspectionStatus.NONE) "SELECIONAR STATUS" else status
            
            val context = binding.root.context
            val color = when (status) {
                AppConstants.InspectionStatus.APPROVED -> android.graphics.Color.parseColor("#4CAF50")
                AppConstants.InspectionStatus.REPROVED -> android.graphics.Color.parseColor("#F44336")
                AppConstants.InspectionStatus.NA -> android.graphics.Color.parseColor("#757575")
                else -> android.graphics.Color.BLACK
            }
            
            if (status != AppConstants.InspectionStatus.NONE) {
                binding.btnStatus.setTextColor(color)
                binding.btnStatus.setStrokeColorResource(android.R.color.transparent)
                binding.btnStatus.setBackgroundColor(android.graphics.Color.argb(40, android.graphics.Color.red(color), android.graphics.Color.green(color), android.graphics.Color.blue(color)))
            } else {
                binding.btnStatus.setTextColor(android.graphics.Color.BLACK)
                binding.btnStatus.setBackgroundColor(android.graphics.Color.TRANSPARENT)
            }
        }

        private fun showStatusDialog(item: ChecklistItem, onItemChanged: (ChecklistItem) -> Unit) {
            val options = arrayOf(
                AppConstants.InspectionStatus.APPROVED,
                AppConstants.InspectionStatus.REPROVED,
                AppConstants.InspectionStatus.NA
            )

            MaterialAlertDialogBuilder(binding.root.context)
                .setTitle("Selecione o Status")
                .setItems(options) { _, which ->
                    val newStatus = options[which]
                    if (item.status != newStatus) {
                        item.status = newStatus
                        updateStatusButton(newStatus)
                        onItemChanged(item)
                    }
                }
                .show()
        }
    }

    object DiffCallback : DiffUtil.ItemCallback<ChecklistDisplayItem>() {
        override fun areItemsTheSame(oldItem: ChecklistDisplayItem, newItem: ChecklistDisplayItem): Boolean {
            return when {
                oldItem is ChecklistDisplayItem.CategoryHeader && newItem is ChecklistDisplayItem.CategoryHeader -> oldItem.name == newItem.name
                oldItem is ChecklistDisplayItem.Item && newItem is ChecklistDisplayItem.Item -> oldItem.checklistItem.description == newItem.checklistItem.description
                else -> oldItem == newItem
            }
        }
        override fun areContentsTheSame(oldItem: ChecklistDisplayItem, newItem: ChecklistDisplayItem): Boolean = oldItem == newItem
    }
}

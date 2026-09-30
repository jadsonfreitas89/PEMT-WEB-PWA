package br.com.jadson.appchecklistpemt.ui.screens

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import br.com.jadson.appchecklistpemt.R
import br.com.jadson.appchecklistpemt.databinding.FragmentSafetyCommitmentBinding

class SafetyCommitmentFragment : Fragment() {

    private var _binding: FragmentSafetyCommitmentBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentSafetyCommitmentBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.cbCiente.setOnCheckedChangeListener { _, isChecked ->
            binding.btnStartInspection.isEnabled = isChecked
        }

        binding.btnStartInspection.setOnClickListener {
            findNavController().navigate(R.id.checklistFragment)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

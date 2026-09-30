package br.com.jadson.appchecklistpemt.ui.screens

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import br.com.jadson.appchecklistpemt.R
import br.com.jadson.appchecklistpemt.data.repository.AuthRepository
import br.com.jadson.appchecklistpemt.databinding.FragmentHomeBinding

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    private val authRepository = AuthRepository()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupUserInfo()

        binding.btnChecklist.setOnClickListener {
            findNavController().navigate(R.id.inspectionIntroFragment)
        }

        binding.btnMaintainers.setOnClickListener {
            val bundle = Bundle().apply { putString("type", "Manutentores") }
            findNavController().navigate(R.id.listSimpleFragment, bundle)
        }

        binding.btnOperators.setOnClickListener {
            val bundle = Bundle().apply { putString("type", "Operadores") }
            findNavController().navigate(R.id.listSimpleFragment, bundle)
        }

        binding.btnProfile.setOnClickListener {
            findNavController().navigate(R.id.action_homeFragment_to_completeProfileFragment)
        }
    }

    private fun setupUserInfo() {
        val user = authRepository.currentUser.value
        val userName = user?.displayName ?: user?.email ?: "Usuário"
        binding.tvWelcome.text = "Olá, $userName"
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

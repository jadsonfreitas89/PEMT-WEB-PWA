package br.com.jadson.appchecklistpemt.ui.screens

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.fragment.findNavController
import br.com.jadson.appchecklistpemt.R
import br.com.jadson.appchecklistpemt.data.AppDatabase
import br.com.jadson.appchecklistpemt.data.model.Empresa
import br.com.jadson.appchecklistpemt.data.repository.AuthRepository
import br.com.jadson.appchecklistpemt.data.repository.EmpresaRepository
import br.com.jadson.appchecklistpemt.data.repository.UserRepository
import br.com.jadson.appchecklistpemt.databinding.FragmentCompleteProfileBinding
import br.com.jadson.appchecklistpemt.viewmodel.CadastroViewModel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class CompleteProfileFragment : Fragment() {

    private var _binding: FragmentCompleteProfileBinding? = null
    private val binding get() = _binding!!

    private val viewModel: CadastroViewModel by viewModels {
        val db = AppDatabase.getDatabase(requireContext())
        CadastroViewModel.Factory(
            AuthRepository(),
            UserRepository(db.usuarioDao()),
            EmpresaRepository(db.empresaDao())
        )
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentCompleteProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        loadExistingData()
        setupObservers()
        setupListeners()
    }

    private fun setEditMode(isEditing: Boolean) {
        val views = listOf(
            binding.etNome, binding.etTelefone, binding.etCargo, binding.etCrea,
            binding.etNomeEmpresa, binding.etCnpj, binding.etEnderecoEmpresa,
            binding.etCidadeEmpresa, binding.etEstadoEmpresa
        )
        
        views.forEach { it.isEnabled = isEditing }
        // E-mail sempre travado
        binding.etEmailEmpresa.isEnabled = false

        binding.btnEditProfile.visibility = if (isEditing) View.GONE else View.VISIBLE
        binding.layoutEditActions.visibility = if (isEditing) View.VISIBLE else View.GONE
    }

    private fun loadExistingData() {
        viewLifecycleOwner.lifecycleScope.launch {
            binding.loading.visibility = View.VISIBLE
            val db = AppDatabase.getDatabase(requireContext())
            val authRepository = AuthRepository()
            val userRepository = UserRepository(db.usuarioDao())
            val empresaRepository = EmpresaRepository(db.empresaDao())

            val uid = authRepository.getUserId()
            
            // Tenta buscar o e-mail do Auth para travar no campo
            val userEmail = authRepository.currentUser.value?.email ?: ""
            binding.etEmailEmpresa.setText(userEmail)
            
            userRepository.getUsuarioLocal(uid).first()?.let { user ->
                binding.etNome.setText(user.nome)
                binding.etTelefone.setText(user.telefone)
                binding.etCargo.setText(user.cargo)
                binding.etCrea.setText(user.crea)

                if (user.empresaId.isNotBlank()) {
                    empresaRepository.getEmpresaLocal(user.empresaId).first()?.let { empresa ->
                        binding.etNomeEmpresa.setText(empresa.nome)
                        binding.etCnpj.setText(empresa.cnpj)
                        binding.etEmailEmpresa.setText(empresa.email.ifBlank { userEmail })
                        binding.etEnderecoEmpresa.setText(empresa.endereco)
                        binding.etCidadeEmpresa.setText(empresa.cidade)
                        binding.etEstadoEmpresa.setText(empresa.estado)
                    }
                }
                
                // Se o perfil está completo, começa em modo visualização
                if (user.nome.isNotBlank() && user.empresaId.isNotBlank()) {
                    setEditMode(false)
                } else {
                    setEditMode(true)
                }
            }
            binding.loading.visibility = View.GONE
        }
    }

    private fun setupListeners() {
        binding.btnEditProfile.setOnClickListener {
            setEditMode(true)
        }

        binding.btnCancelEdit.setOnClickListener {
            setEditMode(false)
            loadExistingData() // Recarrega dados originais
        }

        binding.btnSaveProfile.setOnClickListener {
            val nome = binding.etNome.text.toString()
            val telefone = binding.etTelefone.text.toString()
            val cargo = binding.etCargo.text.toString()
            val crea = binding.etCrea.text.toString()
            val nomeEmpresa = binding.etNomeEmpresa.text.toString()
            val cnpj = binding.etCnpj.text.toString()
            val emailEmpresa = binding.etEmailEmpresa.text.toString()
            val endereco = binding.etEnderecoEmpresa.text.toString()
            val cidade = binding.etCidadeEmpresa.text.toString()
            val estado = binding.etEstadoEmpresa.text.toString()
            
            if (nome.isBlank() || telefone.isBlank() || cargo.isBlank() || nomeEmpresa.isBlank() || cnpj.isBlank()) {
                Toast.makeText(requireContext(), "Preencha todos os campos obrigatórios", Toast.LENGTH_SHORT).show()
            } else {
                saveProfileAndCompany(nome, telefone, cargo, crea, nomeEmpresa, cnpj, emailEmpresa, endereco, cidade, estado)
            }
        }
    }

    private fun saveProfileAndCompany(
        nome: String, telefone: String, cargo: String, crea: String?, 
        nomeEmpresa: String, cnpj: String, emailEmpresa: String, 
        endereco: String, cidade: String, estado: String
    ) {
        viewLifecycleOwner.lifecycleScope.launch {
            binding.loading.visibility = View.VISIBLE
            binding.btnSaveProfile.isEnabled = false
            
            try {
                val db = AppDatabase.getDatabase(requireContext())
                val userRepository = UserRepository(db.usuarioDao())
                val empresaRepository = EmpresaRepository(db.empresaDao())
                val authRepository = AuthRepository()
                
                // 1. Criar e Salvar Nova Empresa com todos os campos
                val novaEmpresa = Empresa(
                    nome = nomeEmpresa,
                    cnpj = cnpj,
                    email = emailEmpresa,
                    endereco = endereco,
                    cidade = cidade,
                    estado = estado
                )
                empresaRepository.saveEmpresa(novaEmpresa)

                // 2. Atualizar Usuário com o ID da nova Empresa
                val uid = authRepository.getUserId()
                val currentLocalUser = userRepository.getUsuarioLocal(uid).first()
                
                if (currentLocalUser != null) {
                    val updatedUser = currentLocalUser.copy(
                        nome = nome,
                        telefone = telefone,
                        cargo = cargo,
                        crea = crea,
                        empresaId = novaEmpresa.empresaId,
                        empresaNome = novaEmpresa.nome
                    )
                    userRepository.saveUsuario(updatedUser)
                    Toast.makeText(requireContext(), "Perfil e Empresa criados!", Toast.LENGTH_SHORT).show()
                    findNavController().navigate(R.id.action_completeProfileFragment_to_homeFragment)
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Erro ao salvar: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                binding.loading.visibility = View.GONE
                binding.btnSaveProfile.isEnabled = true
            }
        }
    }

    private fun setupObservers() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.loading.collect { isLoading ->
                    binding.loading.visibility = if (isLoading) View.VISIBLE else View.GONE
                    binding.btnSaveProfile.isEnabled = !isLoading
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

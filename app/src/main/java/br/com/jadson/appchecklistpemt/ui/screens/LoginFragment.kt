package br.com.jadson.appchecklistpemt.ui.screens

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.fragment.findNavController
import br.com.jadson.appchecklistpemt.R
import br.com.jadson.appchecklistpemt.data.AppDatabase
import br.com.jadson.appchecklistpemt.data.repository.AuthRepository
import br.com.jadson.appchecklistpemt.data.repository.UserRepository
import br.com.jadson.appchecklistpemt.databinding.FragmentLoginBinding
import br.com.jadson.appchecklistpemt.viewmodel.AuthViewModel
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import kotlinx.coroutines.launch

class LoginFragment : Fragment() {

    private var _binding: FragmentLoginBinding? = null
    private val binding get() = _binding!!

    private lateinit var googleSignInClient: GoogleSignInClient

    private val viewModel: AuthViewModel by viewModels {
        val db = AppDatabase.getDatabase(requireContext())
        AuthViewModel.Factory(AuthRepository(), UserRepository(db.usuarioDao()))
    }

    private val googleSignInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(ApiException::class.java)!!
            viewModel.loginWithGoogle(account)
        } catch (e: ApiException) {
            android.util.Log.e("LoginFragment", "Erro Google: ${e.statusCode}", e)
            Toast.makeText(requireContext(), "Erro ao logar com Google (Status: ${e.statusCode})", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(R.string.default_web_client_id))
            .requestEmail()
            .build()
        googleSignInClient = GoogleSignIn.getClient(requireActivity(), gso)
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentLoginBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text.toString()
            val password = binding.etPassword.text.toString()
            viewModel.login(email, password)
        }

        binding.btnGoogleLogin.setOnClickListener {
            googleSignInClient.signOut().addOnCompleteListener {
                googleSignInLauncher.launch(googleSignInClient.signInIntent)
            }
        }

        binding.tvRegister.setOnClickListener {
            findNavController().navigate(R.id.action_loginFragment_to_registerFragment)
        }

        binding.tvForgotPassword.setOnClickListener {
            val email = binding.etEmail.text.toString()
            viewModel.resetPassword(email)
        }

        observeViewModel()
    }

    private fun observeViewModel() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                launch {
                    viewModel.loading.collect { isLoading ->
                        binding.btnLogin.isEnabled = !isLoading
                        binding.btnGoogleLogin.isEnabled = !isLoading
                        binding.loading.visibility = if (isLoading) View.VISIBLE else View.GONE
                    }
                }
                launch {
                    viewModel.authError.collect { error ->
                        Toast.makeText(requireContext(), error, Toast.LENGTH_LONG).show()
                    }
                }
                launch {
                    viewModel.loginSuccess.collect {
                        findNavController().navigate(R.id.action_loginFragment_to_homeFragment)
                    }
                }
                launch {
                    viewModel.needsProfileCompletion.collect {
                        findNavController().navigate(R.id.action_loginFragment_to_completeProfileFragment)
                    }
                }
                launch {
                    viewModel.resetPasswordSuccess.collect {
                        Toast.makeText(requireContext(), "E-mail de recuperação enviado", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

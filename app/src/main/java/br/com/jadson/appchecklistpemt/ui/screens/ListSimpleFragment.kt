package br.com.jadson.appchecklistpemt.ui.screens

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import br.com.jadson.appchecklistpemt.api.GoogleSheetsService
import br.com.jadson.appchecklistpemt.core.constants.AppConstants
import br.com.jadson.appchecklistpemt.databinding.FragmentListSimpleBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class ListSimpleFragment : Fragment() {

    private var _binding: FragmentListSimpleBinding? = null
    private val binding get() = _binding!!
    private var type: String = ""

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentListSimpleBinding.inflate(inflater, container, false)
        type = arguments?.getString("type") ?: ""
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        fetchData()
    }

    private fun fetchData() {
        binding.progressBar.visibility = View.VISIBLE
        
        lifecycleScope.launch {
            try {
                val retrofit = Retrofit.Builder()
                    .baseUrl("https://script.google.com/")
                    .addConverterFactory(GsonConverterFactory.create())
                    .build()
                
                val service = retrofit.create(GoogleSheetsService::class.java)
                val url = AppConstants.GOOGLE_SCRIPT_URL + "?action=get" + type
                android.util.Log.d("ListSimple", "Fetching from: $url")
                
                val response = withContext(Dispatchers.IO) { service.fetchData(url) }
                
                if (response.isSuccessful) {
                    val jsonStr = response.body()?.string() ?: ""
                    android.util.Log.d("ListSimple", "Response: $jsonStr")
                    val list = parseJson(jsonStr)
                    if (list.isEmpty()) {
                        Toast.makeText(requireContext(), "Nenhum dado encontrado na aba $type", Toast.LENGTH_SHORT).show()
                    }
                    setupList(list)
                } else {
                    android.util.Log.e("ListSimple", "Error code: ${response.code()}")
                    Toast.makeText(requireContext(), "Erro ao carregar dados", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Erro de conexão", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun parseJson(json: String): List<String> {
        val list = mutableListOf<String>()
        try {
            val obj = JSONObject(json)
            val array = obj.getJSONArray("data")
            for (i in 0 until array.length()) {
                list.add(array.getString(i))
            }
        } catch (e: Exception) {}
        return list
    }

    private fun setupList(list: List<String>) {
        binding.rvSimpleList.layoutManager = LinearLayoutManager(requireContext())
        binding.rvSimpleList.adapter = object : androidx.recyclerview.widget.RecyclerView.Adapter<SimpleViewHolder>() {
            override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SimpleViewHolder {
                val view = LayoutInflater.from(parent.context).inflate(android.R.layout.simple_list_item_1, parent, false)
                return SimpleViewHolder(view)
            }
            override fun onBindViewHolder(holder: SimpleViewHolder, position: Int) {
                (holder.itemView as android.widget.TextView).text = list[position]
            }
            override fun getItemCount() = list.size
        }
    }

    class SimpleViewHolder(view: View) : androidx.recyclerview.widget.RecyclerView.ViewHolder(view)

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

package br.com.jadson.appchecklistpemt.api

import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Url

interface GoogleSheetsService {

    /**
     * Envia o checklist para o Google Apps Script.
     * Usamos @Url para que a URL do WebApp possa ser configurada dinamicamente.
     */
    @POST
    suspend fun uploadChecklist(
        @Url url: String,
        @Body jsonData: RequestBody
    ): Response<ResponseBody>

    @GET
    suspend fun fetchData(@Url url: String): Response<ResponseBody>
}

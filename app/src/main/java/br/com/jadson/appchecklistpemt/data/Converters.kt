package br.com.jadson.appchecklistpemt.data

import androidx.room.TypeConverter
import br.com.jadson.appchecklistpemt.domain.model.ChecklistCategory
import br.com.jadson.appchecklistpemt.domain.model.ChecklistStatus
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class Converters {
    private val gson = Gson()

    @TypeConverter
    fun fromChecklistStatus(value: ChecklistStatus): String {
        return value.name
    }

    @TypeConverter
    fun toChecklistStatus(value: String): ChecklistStatus {
        return ChecklistStatus.valueOf(value)
    }

    @TypeConverter
    fun fromStringList(value: List<String>): String {
        return gson.toJson(value)
    }

    @TypeConverter
    fun toStringList(value: String): List<String> {
        val type = object : TypeToken<List<String>>() {}.type
        return gson.fromJson(value, type)
    }

    @TypeConverter
    fun fromCategoryList(value: List<ChecklistCategory>): String {
        return gson.toJson(value)
    }

    @TypeConverter
    fun toCategoryList(value: String): List<ChecklistCategory> {
        val type = object : TypeToken<List<ChecklistCategory>>() {}.type
        return gson.fromJson(value, type)
    }
}

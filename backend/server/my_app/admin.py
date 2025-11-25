from django.contrib import admin
from .models import Question, Report

# Register your models here so they show up in the Admin Panel
admin.site.register(Question)
admin.site.register(Report)
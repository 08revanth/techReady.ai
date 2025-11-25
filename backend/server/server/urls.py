from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Frontend calls /my_app/api/...
    path('my_app/', include('my_app.urls')),
]
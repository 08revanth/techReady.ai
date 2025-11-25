from django.urls import path
from . import views

urlpatterns = [
    # Video Upload (Note: Frontend posts to /my_app/)
    path('', views.index_view, name='index'), 
    
    # Auth
    path('api/signup/', views.signup),
    path('api/login/', views.login),
    
    # Core Features
    path('api/get-random-question/<str:card_name>/', views.get_random_question),
    path('api/save_report/', views.save_report),
    path('api/profile/<str:email>/', views.profile),
    path('api/report/<int:report_id>/delete/', views.delete_report),
]
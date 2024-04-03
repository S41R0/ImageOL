from django.urls import path
from . import views

urlpatterns = [
    path('', views.main),
    path('text/', views.text)
]
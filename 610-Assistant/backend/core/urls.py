from django.urls import path

from .views import events_view, investigate_view

urlpatterns = [
    path("events/", events_view, name="events"),
    path("investigate/", investigate_view, name="investigate"),
]

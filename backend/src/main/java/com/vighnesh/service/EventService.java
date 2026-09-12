package com.vighnesh.service;

import com.vighnesh.model.Event;
import com.vighnesh.model.User;

import java.util.List;

public interface EventService {
    Event createEvent(Long restaurantId, Event event, User user) throws Exception;
    Event updateEvent(Long eventId, Event event, User user) throws Exception;
    void deleteEvent(Long eventId, User user) throws Exception;
    List<Event> getAllEvents();
    List<Event> getEventsByRestaurant(Long restaurantId) throws Exception;
    Event findEventById(Long eventId) throws Exception;
}


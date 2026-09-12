package com.vighnesh.service;

import com.vighnesh.model.Event;
import com.vighnesh.model.Restaurant;
import com.vighnesh.model.User;
import com.vighnesh.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EventServiceImp implements EventService{

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private RestaurantService restaurantService;

    @Override
    public Event createEvent(Long restaurantId, Event event, User user) throws Exception {
        Restaurant restaurant = restaurantService.findRestaurantById(restaurantId);
        if (restaurant == null) {
            throw new Exception("restaurant not found: " + restaurantId);
        }
        // only restaurant owner or admin can create
        if (restaurant.getOwner() == null || !restaurant.getOwner().getId().equals(user.getId())) {
            throw new Exception("not authorized to create event for this restaurant");
        }
        event.setRestaurant(restaurant);
        event.setCreatedBy(user);
        return eventRepository.save(event);
    }

    @Override
    public Event updateEvent(Long eventId, Event event, User user) throws Exception {
        Optional<Event> opt = eventRepository.findById(eventId);
        if (opt.isEmpty()){
            throw new Exception("event not found: " + eventId);
        }
        Event existing = opt.get();
        // ownership check: user must be the creator or restaurant owner
        boolean isOwner = existing.getCreatedBy() != null && existing.getCreatedBy().getId().equals(user.getId());
        boolean isRestaurantOwner = existing.getRestaurant()!=null && existing.getRestaurant().getOwner()!=null && existing.getRestaurant().getOwner().getId().equals(user.getId());
        if (!isOwner && !isRestaurantOwner) {
            throw new Exception("not authorized to update this event");
        }
        // update fields
        if(event.getName()!=null) existing.setName(event.getName());
        if(event.getDescription()!=null) existing.setDescription(event.getDescription());
        if(event.getImage()!=null) existing.setImage(event.getImage());
        if(event.getLocation()!=null) existing.setLocation(event.getLocation());
        if(event.getStartedAt()!=null) existing.setStartedAt(event.getStartedAt());
        if(event.getEndsAt()!=null) existing.setEndsAt(event.getEndsAt());
        existing.setActive(event.isActive());

        return eventRepository.save(existing);
    }

    @Override
    public void deleteEvent(Long eventId, User user) throws Exception {
        Optional<Event> opt = eventRepository.findById(eventId);
        if (opt.isEmpty()){
            throw new Exception("event not found: " + eventId);
        }
        Event existing = opt.get();
        boolean isOwner = existing.getCreatedBy() != null && existing.getCreatedBy().getId().equals(user.getId());
        boolean isRestaurantOwner = existing.getRestaurant()!=null && existing.getRestaurant().getOwner()!=null && existing.getRestaurant().getOwner().getId().equals(user.getId());
        if (!isOwner && !isRestaurantOwner) {
            throw new Exception("not authorized to delete this event");
        }
        eventRepository.deleteById(eventId);
    }

    @Override
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    @Override
    public List<Event> getEventsByRestaurant(Long restaurantId) throws Exception {
        // ensure restaurant exists
        restaurantService.findRestaurantById(restaurantId);
        return eventRepository.findByRestaurantId(restaurantId);
    }

    @Override
    public Event findEventById(Long eventId) throws Exception {
        Optional<Event> opt = eventRepository.findById(eventId);
        if(opt.isEmpty()) throw new Exception("event not found: " + eventId);
        return opt.get();
    }
}


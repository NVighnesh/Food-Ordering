package com.vighnesh.controller;

import com.vighnesh.model.Event;
import com.vighnesh.model.User;
import com.vighnesh.response.MessageResponse;
import com.vighnesh.service.EventService;
import com.vighnesh.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class EventController {

    @Autowired
    private EventService eventService;

    @Autowired
    private UserService userService;

    @PostMapping("/admin/events/restaurant/{restaurantId}")
    public ResponseEntity<Event> createEvent(
            @PathVariable Long restaurantId,
            @RequestBody Event req,
            @RequestHeader("Authorization") String jwt
    ) throws Exception{
        User user = userService.findUserByJwtToken(jwt);
        Event created = eventService.createEvent(restaurantId, req, user);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/events")
    public ResponseEntity<List<Event>> getAllEvents(){
        List<Event> events = eventService.getAllEvents();
        return new ResponseEntity<>(events, HttpStatus.OK);
    }

    @GetMapping("/admin/events/restaurant/{restaurantId}")
    public ResponseEntity<List<Event>> getEventsByRestaurant(
            @PathVariable Long restaurantId,
            @RequestHeader("Authorization") String jwt
    ) throws Exception{
        // ensure user is authenticated
        userService.findUserByJwtToken(jwt);
        List<Event> events = eventService.getEventsByRestaurant(restaurantId);
        return new ResponseEntity<>(events, HttpStatus.OK);
    }

    @PutMapping("/admin/events/{id}")
    public ResponseEntity<Event> updateEvent(
            @PathVariable Long id,
            @RequestBody Event req,
            @RequestHeader("Authorization") String jwt
    ) throws Exception{
        User user = userService.findUserByJwtToken(jwt);
        Event updated = eventService.updateEvent(id, req, user);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @DeleteMapping("/admin/events/{id}")
    public ResponseEntity<MessageResponse> deleteEvent(
            @PathVariable Long id,
            @RequestHeader("Authorization") String jwt
    ) throws Exception{
        User user = userService.findUserByJwtToken(jwt);
        eventService.deleteEvent(id, user);
        MessageResponse res = new MessageResponse();
        res.setMessage("event deleted");
        return new ResponseEntity<>(res, HttpStatus.OK);
    }
}


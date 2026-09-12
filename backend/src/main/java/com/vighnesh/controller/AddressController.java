package com.vighnesh.controller;

import com.vighnesh.model.Address;
import com.vighnesh.model.User;
import com.vighnesh.repository.AddressRepository;
import com.vighnesh.repository.UserRepository;
import com.vighnesh.repository.OrderRepository;
import com.vighnesh.response.MessageResponse;
import com.vighnesh.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users/addresses")
public class AddressController {

    @Autowired
    private UserService userService;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping
    public ResponseEntity<List<Address>> listAddresses(
            @RequestHeader("Authorization") String jwt
    ) throws Exception{
        User user = userService.findUserByJwtToken(jwt);
        List<Address> addresses = user.getAddresses();
        return new ResponseEntity<>(addresses, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<Address> addAddress(
            @RequestBody Address req,
            @RequestHeader("Authorization") String jwt
    ) throws Exception{
        User user = userService.findUserByJwtToken(jwt);
        Address saved = addressRepository.save(req);
        boolean exists = user.getAddresses().stream()
                .anyMatch(a -> a.getId() != null && a.getId().equals(saved.getId()));
        if(!exists){
            user.getAddresses().add(saved);
            userRepository.save(user);
        }
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Address> updateAddress(
            @PathVariable Long id,
            @RequestBody Address req,
            @RequestHeader("Authorization") String jwt
    ) throws Exception{
        User user = userService.findUserByJwtToken(jwt);
        Optional<Address> opt = addressRepository.findById(id);
        if(opt.isEmpty()){
            throw new Exception("address not found: " + id);
        }
        Address existing = opt.get();
        boolean owned = user.getAddresses().stream()
                .anyMatch(a -> a.getId() != null && a.getId().equals(id));
        if(!owned){
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        // update fields
        existing.setStreet(req.getStreet());
        existing.setCity(req.getCity());
        existing.setState(req.getState());
        existing.setPostalCode(req.getPostalCode());
        existing.setCountry(req.getCountry());
        existing.setLatitude(req.getLatitude());
        existing.setLongitude(req.getLongitude());

        Address saved = addressRepository.save(existing);
        return new ResponseEntity<>(saved, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteAddress(
            @PathVariable Long id,
            @RequestHeader("Authorization") String jwt
    ) throws Exception{
        User user = userService.findUserByJwtToken(jwt);
        boolean owned = user.getAddresses().stream()
                .anyMatch(a -> a.getId() != null && a.getId().equals(id));
        if(!owned){
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        // If any orders reference this address, prevent deletion to avoid FK constraint
        boolean inUse = orderRepository.existsByDeliveryAddressId(id);
        MessageResponse res = new MessageResponse();
        if(inUse){
            res.setMessage("Cannot delete address: it is referenced by existing orders");
            return new ResponseEntity<>(res, HttpStatus.CONFLICT);
        }

        // detach from user
        user.getAddresses().removeIf(a -> a.getId() != null && a.getId().equals(id));
        userRepository.save(user);
        // delete address
        addressRepository.deleteById(id);
        res.setMessage("address deleted");
        return new ResponseEntity<>(res, HttpStatus.NO_CONTENT);
    }

}

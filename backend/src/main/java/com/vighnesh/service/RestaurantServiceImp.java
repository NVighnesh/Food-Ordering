package com.vighnesh.service;

import com.vighnesh.dto.RestaurantDto;

import com.vighnesh.model.Address;
import com.vighnesh.model.Restaurant;
import com.vighnesh.model.User;
import com.vighnesh.model.Favorite;
import com.vighnesh.repository.AddressRepository;
import com.vighnesh.repository.RestaurantRepository;
import com.vighnesh.repository.UserRepository;
import com.vighnesh.repository.FavoriteRepository;
import com.vighnesh.request.CreateRestaurantRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class RestaurantServiceImp implements RestaurantService{
    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Override
    public List<RestaurantDto> getFavoriteRestaurants(User user) {
        List<Favorite> favorites = favoriteRepository.findByUser_Id(user.getId());
        List<RestaurantDto> dtos = new java.util.ArrayList<>();
        for (Favorite fav : favorites) {
            RestaurantDto dto = new RestaurantDto();
            dto.setId(fav.getRestaurantId());
            dto.setTitle(fav.getTitle());
            dto.setDescription(fav.getDescription());
            dto.setImages(fav.getImages());
            dtos.add(dto);
        }
        return dtos;
    }

    @Override
    public Restaurant createRestaurant(CreateRestaurantRequest req, User user) {
        Restaurant existingRestaurant = restaurantRepository.findByName(req.getName());
        if (existingRestaurant != null) {
            throw new IllegalStateException("Restaurant with the same name already exists");
        }
        Address address = addressRepository.save(req.getAddress());


        Restaurant restaurant = new Restaurant();
        restaurant.setAddress(address);
        restaurant.setContactInformation(req.getContactInformation());
        restaurant.setCuisineType(req.getCuisineType());
        restaurant.setDescription(req.getDescription());
        restaurant.setImages(req.getImages());
        restaurant.setName(req.getName());
        restaurant.setOpeningHours(req.getOpeningHours());
        restaurant.setRegistrationDate(LocalDateTime.now());
        restaurant.setOwner(user);
        return restaurantRepository.save(restaurant);
    }

    @Override
    public Restaurant updateRestaurant(Long restaurantId, CreateRestaurantRequest updateRestaurant) throws Exception {
        Restaurant restaurant = findRestaurantById(restaurantId);
        if(restaurant.getCuisineType()!=null) {
            restaurant.setCuisineType(updateRestaurant.getCuisineType());
        }
        if(restaurant.getDescription()!=null) {
            restaurant.setDescription(updateRestaurant.getDescription());
        }
        if(restaurant.getName()!=null) {
            restaurant.setName(updateRestaurant.getName());
        }

        return restaurantRepository.save(restaurant);
    }

    @Override
    public void deleteRestaurant(Long restaurantId) throws Exception {
        Restaurant restaurant = findRestaurantById(restaurantId);
        restaurantRepository.delete(restaurant);


    }

    @Override
    public List<Restaurant> getAllRestaurant() {

        return restaurantRepository.findAll();
    }

    @Override
    public Page<Restaurant> searchRestaurant(String keyword, Pageable pageable) {

        return restaurantRepository.findBySearchQuery(keyword, pageable);
    }

    @Override
    public Restaurant findRestaurantById(Long id) throws Exception {
        Optional<Restaurant> pot=restaurantRepository.findById(id);
        if(pot.isEmpty()){
            throw new Exception("restaurant not found"+id);

        }

        return pot.get();
    }

    @Override
    public List<Restaurant> getRestaurantByUserId(Long userId) throws Exception {
        List<Restaurant> restaurants = restaurantRepository.findByOwnerId(userId);
        if (restaurants == null || restaurants.isEmpty()) {
            throw new Exception("No restaurant found with owner id " + userId);
        }
        return restaurants;
    }

    @Override
    @Transactional
    public RestaurantDto addToFavorites(Long restaurantId, User user) throws Exception {
        Restaurant restaurant=findRestaurantById(restaurantId);
        RestaurantDto dto=new RestaurantDto();
        dto.setDescription(restaurant.getDescription());
        dto.setImages(restaurant.getImages());
        dto.setTitle(restaurant.getName());
        dto.setId(restaurantId);


        Optional<Favorite> existing = favoriteRepository.findByUser_IdAndRestaurantId(user.getId(), restaurantId);
        if (existing.isPresent()) {
            // remove favorite
            favoriteRepository.deleteByUser_IdAndRestaurantId(user.getId(), restaurantId);
        } else {
            Favorite fav = new Favorite();
            fav.setRestaurantId(restaurantId);
            fav.setTitle(restaurant.getName());
            fav.setDescription(restaurant.getDescription());
            // avoid sharing the same collection instance between entities -> copy the list
            fav.setImages(new java.util.ArrayList<>(restaurant.getImages()));
            fav.setUser(user);
            favoriteRepository.save(fav);
        }


        return dto;
    }

    @Override
    public Restaurant updateRestaurantStatus(Long id) throws Exception {
        Restaurant restaurant=findRestaurantById(id);
        restaurant.setOpen(!restaurant.isOpen());
        return restaurantRepository.save(restaurant);
    }
}
